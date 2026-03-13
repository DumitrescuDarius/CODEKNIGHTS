import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

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

export async function POST(req: Request) {
  let jobDir = "";
  let language = "";
  
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { code, stdin } = body;
    language = body.language;

    console.log(`[API/RUN] Received request for ${language}`);

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
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

    // Check if Docker is available
    const hasDocker = await new Promise((resolve) => {
      exec("docker --version", (error) => resolve(!error));
    });

    let fileName = "";
    let runCmd = "";
    let compileCmd = ""; // For local fallback mode
    let dockerImage = "";
    let containerCmd = "";

    switch (language) {
      case "c":
        fileName = "solution.c";
        if (hasDocker) {
          dockerImage = "gcc:latest";
          containerCmd = `sh -c "gcc solution.c -o solution && ./solution"`;
        } else {
          compileCmd = `gcc "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
          runCmd = `"${path.join(jobDir, "solution")}"`;
        }
        break;
      case "cpp":
        fileName = "solution.cpp";
        if (hasDocker) {
          dockerImage = "gcc:latest";
          containerCmd = `sh -c "g++ solution.cpp -o solution && ./solution"`;
        } else {
          compileCmd = `g++ "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
          runCmd = `"${path.join(jobDir, "solution")}"`;
        }
        break;
      case "python":
        fileName = "solution.py";
        if (hasDocker) {
          dockerImage = "python:3.11-slim";
          containerCmd = `python3 solution.py`;
        } else {
          runCmd = `python3 "${path.join(jobDir, fileName)}"`;
        }
        break;
      case "java":
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        if (hasDocker) {
          dockerImage = "openjdk:17-slim";
          containerCmd = `sh -c "javac ${fileName} && java ${className}"`;
        } else {
          compileCmd = `javac --release 25 "${path.join(jobDir, fileName)}"`;
          runCmd = `java -cp "${jobDir}" ${className}`;
        }
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    console.log(`[API/RUN] Mode: ${hasDocker ? "Docker" : "Local Fallback"}`);
    fs.writeFileSync(path.join(jobDir, fileName), code);
    fs.chmodSync(path.join(jobDir, fileName), 0o666);

    const execute = async () => {
      if (hasDocker) {
        const dockerArgs = `--rm --network none --memory 128m --cpus 0.5 -v "${jobDir}:/app" -w /app`;
        const fullRunCmd = `docker run ${dockerArgs} ${dockerImage} ${containerCmd}`;
        console.log(`[API/RUN] Executing Docker: ${fullRunCmd}`);
        
        return new Promise((resolve, reject) => {
          const child = exec(fullRunCmd, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && (error as any).killed) reject({ stderr: "Execution timed out (10s)" });
            else resolve(stdout + (stderr ? "\n" + stderr : ""));
          });
          if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
        });
      } else {
        // Fallback to local execution
        if (compileCmd) {
          console.log(`[API/RUN] Local Compile: ${compileCmd}`);
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
        
        console.log(`[API/RUN] Local Run: ${runCmd}`);
        return new Promise((resolve, reject) => {
          const child = exec(runCmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && (error as any).killed) reject({ stderr: "Execution timed out (5s)" });
            else resolve(stdout + (stderr ? "\n" + stderr : ""));
          });
          if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
        });
      }
    };

    const output = await execute();
    console.log("[API/RUN] Execution successful");
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
