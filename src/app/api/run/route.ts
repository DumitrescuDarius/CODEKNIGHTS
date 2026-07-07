import { NextResponse } from "next/server";
import { exec, execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

/** Avoid spawning `docker version` on every run (was a large fixed cost per request). */
let dockerAvailableCache: boolean | undefined;

function shouldUseDocker(): boolean {
  const mode = process.env.CODEKNIGHTS_EXECUTOR?.toLowerCase();
  if (mode === "local") return false;
  if (mode === "docker") {
    if (dockerAvailableCache === undefined) {
      try {
        execSync("docker version", { stdio: "ignore", timeout: 4000 });
        dockerAvailableCache = true;
      } catch {
        dockerAvailableCache = false;
      }
    }
    return dockerAvailableCache;
  }
  // auto (default): Docker unless explicitly told to prefer host toolchain (faster on dev machines).
  if (process.env.CODEKNIGHTS_PREFER_LOCAL === "1") return false;
  if (dockerAvailableCache === undefined) {
    try {
      execSync("docker version", { stdio: "ignore", timeout: 4000 });
      dockerAvailableCache = true;
    } catch {
      dockerAvailableCache = false;
    }
  }
  return dockerAvailableCache;
}


async function executeWithPiston(code: string, language: string, stdin: string = ""): Promise<string> {
  const compilerMap: Record<string, string> = {
    c: "gcc-13.2.0-c",
    cpp: "gcc-13.2.0",
    python: "cpython-3.12.7",
    java: "openjdk-jdk-22+36"
  };
  const compiler = compilerMap[language];
  if (!compiler) throw { stderr: "Unsupported language for execution API" };

  const res = await fetch("https://wandbox.org/api/compile.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler: compiler,
      code: code,
      stdin: stdin
    })
  });

  const data = await res.json();
  if (!res.ok) throw { stderr: "Execution API failed" };
  if (data.status !== "0") {
    throw { stderr: data.compiler_error || data.program_error || "Execution failed" };
  }

  return data.program_output || "";
}


function parseCompileError(stderr: string, fileName: string) {
  const errors: { line: number; column: number; message: string }[] = [];
  const lines = stderr.split('\n');
  
  // Pattern for gcc/g++: fileName:line:column: error: message
  const pattern = new RegExp(`${fileName}:(\\d+):(\\d+):\\s+(?:fatal\\s+)?error:\\s+(.+)`, 'i');

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      errors.push({
        line: parseInt(match[1]),
        column: parseInt(match[2]),
        message: match[3].trim()
      });
    }
  }
  return errors;
}

function checkMaliciousCode(code: string, language: string): string | null {
  const patterns: Record<string, RegExp[]> = {
    python: [
      /import\s+(os|subprocess|pty|socket|sys|shlex|pty)/i,
      /from\s+(os|subprocess|pty|socket|sys|shlex|pty)\s+import/i,
      /__(import|builtins|class|subclasses)__/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /open\s*\(/i,
    ],
    cpp: [
      /system\s*\(/i,
      /popen\s*\(/i,
      /execl?\w*\s*\(/i,
      /fork\s*\(/i,
      /#include\s*<(unistd\.h|stdlib\.h|sys\/|fstream|arpa\/|netdb\.h|sys\/socket\.h)>/i,
      /fstream/i,
      /ifstream/i,
      /ofstream/i,
      /syscall\s*\(/i,
    ],
    c: [
      /system\s*\(/i,
      /popen\s*\(/i,
      /execl?\w*\s*\(/i,
      /fork\s*\(/i,
      /#include\s*<(unistd\.h|stdlib\.h|sys\/|fstream|arpa\/|netdb\.h|sys\/socket\.h)>/i,
      /syscall\s*\(/i,
    ],
    java: [
      /java\.io\./i,
      /java\.nio\./i,
      /java\.net\./i,
      /java\.lang\.reflect\./i,
      /Runtime\.getRuntime\(\)/i,
      /ProcessBuilder/i,
    ]
  };

  const rules = patterns[language] || [];
  for (const regex of rules) {
    if (regex.test(code)) {
      return regex.toString(); // Return the matched pattern
    }
  }
  return null;
}

export async function POST(req: Request) {
  let jobDir = "";
  let language = "";
  
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { code, stdin } = body;
    language = body.language;

    if (process.env.NODE_ENV === "development") {
      console.log(`[API/RUN] Received request for ${language}`);
    }

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const maliciousPattern = checkMaliciousCode(code, language);
    if (maliciousPattern) {
      console.warn(`[API/RUN] Malicious code detected. Language: ${language}, Pattern: ${maliciousPattern}`);
      return NextResponse.json({ 
        error: `Execution Blocked: Code contains restricted patterns or system calls.\nMatched restricted rule: ${maliciousPattern}` 
      }, { status: 403 });
    }

    // We use os.tmpdir() which is usually /tmp on Linux
    const tempRoot = path.join(os.tmpdir(), "code_knights_exec");
    if (!fs.existsSync(tempRoot)) {
      try {
        fs.mkdirSync(tempRoot, { recursive: true, mode: 0o777 });
      } catch (err) {
        console.error("[API/RUN] Failed to create tempRoot:", err);
      }
    }

    const jobId = crypto.randomUUID();
    jobDir = path.join(fs.existsSync(tempRoot) ? tempRoot : os.tmpdir(), `job_${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true, mode: 0o777 });

    const hasDocker = shouldUseDocker();

    let fileName = "";
    let runCmd = "";
    let compileCmd = ""; // For local fallback mode
    let dockerImage = "";
    let containerCmd = "";

    switch (language) {
      case "c":
        fileName = "solution.c";
        // -pipe: less temp I/O; -O0: fast compile for short programs
        compileCmd = `gcc -pipe -O0 "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        if (hasDocker) {
          dockerImage = "gcc:latest";
          containerCmd = `sh -c "gcc -pipe -O0 solution.c -o solution && ./solution"`;
        }
        break;
      case "cpp":
        fileName = "solution.cpp";
        compileCmd = `g++ -pipe -O0 "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        if (hasDocker) {
          dockerImage = "gcc:latest";
          containerCmd = `sh -c "g++ -pipe -O0 solution.cpp -o solution && ./solution"`;
        }
        break;
      case "python":
        fileName = "solution.py";
        // For python there's no compile step; run locally with python3
        runCmd = `python3 "${path.join(jobDir, fileName)}"`;
        if (hasDocker) {
          dockerImage = "python:3.11-slim";
          containerCmd = `python3 solution.py`;
        }
        break;
      case "java":
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        // Use standard javac locally; avoid unsupported --release flags
        compileCmd = `javac "${path.join(jobDir, fileName)}"`;
        runCmd = `java -XX:TieredStopAtLevel=1 -cp "${jobDir}" ${className}`;
        if (hasDocker) {
          dockerImage = "openjdk:17-slim";
          containerCmd = `sh -c "javac ${fileName} && java -XX:TieredStopAtLevel=1 ${className}"`;
        }
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[API/RUN] Mode: ${hasDocker ? "Docker" : "Local"}`);
    }
    fs.writeFileSync(path.join(jobDir, fileName), code);
    fs.chmodSync(path.join(jobDir, fileName), 0o666);

    const execute = async () => {
      const runLocal = async () => {
        if (compileCmd) {
          if (process.env.NODE_ENV === "development") {
            console.log(`[API/RUN] Local Compile: ${compileCmd}`);
          }
          await new Promise((resolve, reject) => {
            exec(compileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
              if (error) reject({ stderr: stderr || error.message });
              else resolve(stdout);
            });
          });
          if (language === "cpp" || language === "c") {
            try { fs.chmodSync(path.join(jobDir, "solution"), 0o755); } catch(e) {}
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.log(`[API/RUN] Local Run: ${runCmd}`);
        }
        return new Promise((resolve, reject) => {
          const child = exec(runCmd, { timeout: 5000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && (error as any).killed) reject({ stderr: "Execution timed out (5s)" });
            else if (error) reject({ stderr: stderr || error.message });
            else resolve(stdout + (stderr ? "\n" + stderr : ""));
          });
          if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
        });
      };

      if (process.env.NODE_ENV !== "development" && !hasDocker) {
        return await executeWithPiston(code, language, stdin);
      }
      
      if (hasDocker) {
        // --pull=never: skip registry round-trip; host already has the image from a prior run
        const dockerArgs = `--rm --pull=never --network none --memory 512m --cpus 1.0 -v "${jobDir}:/app" -w /app`;
        const fullRunCmd = `docker run ${dockerArgs} ${dockerImage} ${containerCmd}`;
        if (process.env.NODE_ENV === "development") {
          console.log(`[API/RUN] Executing Docker: ${fullRunCmd}`);
        }
        try {
          return await new Promise((resolve, reject) => {
            const child = exec(fullRunCmd, { timeout: 10000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
              if (error && (error as any).killed) reject({ stderr: "Execution timed out (10s)" });
              else if (error) reject({ stderr: stderr || error.message });
              else resolve(stdout + (stderr ? "\n" + stderr : ""));
            });
            if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
          });
        } catch (dockerErr) {
          console.error("[API/RUN] Docker execution failed, falling back to local execution:", dockerErr);
          return await runLocal();
        }
      } else {
        return await runLocal();
      }
    };

    const output = await execute();
    if (process.env.NODE_ENV === "development") {
      console.log("[API/RUN] Execution successful");
    }
    return NextResponse.json({ output });

  } catch (error: any) {
    const stderr = error.stderr || error.message || String(error);
    console.error("[API/RUN] Error caught:", stderr);
    
    let compileErrors: any[] = [];
    if (language === "cpp" || language === "c") {
      const fileName = language === "cpp" ? "solution.cpp" : "solution.c";
      compileErrors = parseCompileError(stderr, fileName);
    }

    return NextResponse.json({ 
      error: stderr,
      compileErrors: compileErrors.length > 0 ? compileErrors : undefined
    });
  } finally {
    if (jobDir && fs.existsSync(jobDir)) {
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("[API/RUN] Cleanup error:", cleanupErr);
      }
    }
  }
}
