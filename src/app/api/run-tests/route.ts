import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

function shouldUseDocker() {
  if (process.env.NODE_ENV !== "development") return false;
  try {
    const stdout = require('child_process').execSync("docker info", { stdio: "pipe" }).toString();
    return stdout.includes("Server Version");
  } catch {
    return false;
  }
}

async function executeWithPiston(code: string, language: string, stdin: string = ""): Promise<string> {
  const pistonMap: Record<string, { language: string, version: string }> = {
    c: { language: "c", version: "10.2.0" },
    cpp: { language: "c++", version: "10.2.0" },
    python: { language: "python", version: "3.10.0" },
    java: { language: "java", version: "15.0.2" }
  };
  const langConfig = pistonMap[language];
  if (!langConfig) throw { stderr: "Unsupported language for Piston API" };

  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: langConfig.language,
      version: langConfig.version,
      files: [{ content: code }],
      stdin: stdin,
      compile_timeout: 10000,
      run_timeout: 5000
    })
  });

  const data = await res.json();
  if (!res.ok) throw { stderr: data.message || "Piston API execution failed" };
  if (data.compile && data.compile.code !== 0) throw { stderr: data.compile.output };
  if (data.run && data.run.code !== 0) throw { stderr: data.run.output || "Execution failed with non-zero exit code" };
  return data.run ? data.run.output : "";
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
      return regex.toString();
    }
  }
  return null;
}

function parseCompileError(stderr: string, fileName: string) {
  const errors: { line: number; column: number; message: string }[] = [];
  const lines = stderr.split('\n');
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
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { code, language, questionId } = body;

    if (!code || !language || !questionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const maliciousPattern = checkMaliciousCode(code, language);
    if (maliciousPattern) {
      return NextResponse.json({ 
        error: `Execution Blocked: Code contains restricted patterns or system calls.\nMatched restricted rule: ${maliciousPattern}` 
      }, { status: 403 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { testCases: true, hiddenTestCases: true }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const publicTests = typeof question.testCases === 'string' ? JSON.parse(question.testCases) : question.testCases;
    const hiddenTests = question.hiddenTestCases 
      ? (typeof question.hiddenTestCases === 'string' ? JSON.parse(question.hiddenTestCases) : question.hiddenTestCases)
      : [];
      
    const allTests = [...publicTests, ...hiddenTests];
    let passed = 0;
    const details = [];

    const tempRoot = path.join(os.tmpdir(), "code_knights_exec");
    if (!fs.existsSync(tempRoot)) {
      try {
        fs.mkdirSync(tempRoot, { recursive: true, mode: 0o777 });
      } catch (err) {}
    }

    const jobId = crypto.randomUUID();
    jobDir = path.join(fs.existsSync(tempRoot) ? tempRoot : os.tmpdir(), `job_${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true, mode: 0o777 });

    const hasDocker = shouldUseDocker();

    let fileName = "";
    let runCmd = "";
    let compileCmd = "";
    let dockerImage = "";

    switch (language) {
      case "c":
        fileName = "solution.c";
        compileCmd = `gcc -pipe -O0 "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        if (hasDocker) { dockerImage = "gcc:latest"; runCmd = "./solution"; }
        break;
      case "cpp":
        fileName = "solution.cpp";
        compileCmd = `g++ -pipe -O0 "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        if (hasDocker) { dockerImage = "gcc:latest"; runCmd = "./solution"; }
        break;
      case "python":
        fileName = "solution.py";
        runCmd = `python3 "${path.join(jobDir, fileName)}"`;
        if (hasDocker) { dockerImage = "python:3.11-slim"; runCmd = "python3 solution.py"; }
        break;
      case "java":
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        compileCmd = `javac "${path.join(jobDir, fileName)}"`;
        runCmd = `java -XX:TieredStopAtLevel=1 -cp "${jobDir}" ${className}`;
        if (hasDocker) { dockerImage = "openjdk:17-slim"; runCmd = `java -XX:TieredStopAtLevel=1 ${className}`; }
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    fs.writeFileSync(path.join(jobDir, fileName), code);
    fs.chmodSync(path.join(jobDir, fileName), 0o666);

    const runLocalCompile = async () => {
      if (compileCmd) {
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
    };

    const runDockerCompile = async () => {
      if (compileCmd) {
        let containerCompileCmd = compileCmd;
        if (language === "c") containerCompileCmd = `gcc -pipe -O0 solution.c -o solution`;
        if (language === "cpp") containerCompileCmd = `g++ -pipe -O0 solution.cpp -o solution`;
        if (language === "java") containerCompileCmd = `javac ${fileName}`;
        
        const fullCompileCmd = `docker run --rm --pull=never --network none --memory 512m -v "${jobDir}:/app" -w /app ${dockerImage} sh -c "${containerCompileCmd}"`;
        await new Promise((resolve, reject) => {
          exec(fullCompileCmd, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) reject({ stderr: stderr || error.message });
            else resolve(stdout);
          });
        });
      }
    };

    // Attempt Compilation (Skip on production, let Piston handle it per-test)
    if (process.env.NODE_ENV === "development" || hasDocker) {
      try {
        if (hasDocker) {
          try {
            await runDockerCompile();
          } catch (e) {
            await runLocalCompile();
          }
        } else {
          await runLocalCompile();
        }
      } catch (compileErr: any) {
      const stderr = compileErr.stderr || String(compileErr);
      let compileErrors: any[] = [];
      if (language === "cpp" || language === "c") {
        compileErrors = parseCompileError(stderr, fileName);
      }
      return NextResponse.json({
        error: stderr,
        compileErrors: compileErrors.length > 0 ? compileErrors : undefined
      });
      }
    }

    const executeTest = async (stdin: string) => {
      const executeLocal = async () => {
        return new Promise<string>((resolve, reject) => {
          const child = exec(runCmd, { timeout: 5000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error && (error as any).killed) reject({ stderr: "Execution timed out (5s)" });
            else if (error) reject({ stderr: stderr || error.message });
            else resolve(stdout + (stderr ? "\n" + stderr : ""));
          });
          if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
        });
      };

      const executeDocker = async () => {
        const dockerArgs = `--rm --pull=never --network none --memory 512m --cpus 1.0 -v "${jobDir}:/app" -w /app`;
        const fullRunCmd = `docker run ${dockerArgs} ${dockerImage} sh -c "${runCmd}"`;
        return new Promise<string>((resolve, reject) => {
          const child = exec(fullRunCmd, { timeout: 5000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
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
        try {
          return await executeDocker();
        } catch (e) {
          return await executeLocal();
        }
      } else {
        return await executeLocal();
      }
    };

    // Run tests sequentially
    for (let i = 0; i < allTests.length; i++) {
      const tc = allTests[i];
      const isHidden = i >= publicTests.length;
      
      try {
        const actualOutput = await executeTest(tc.input || "");
        const isCorrect = actualOutput?.trimEnd() === tc.output?.trimEnd();
        if (isCorrect) passed++;

        if (isHidden) {
          details.push({
            passed: isCorrect,
            input: "HIDDEN TEST CASE",
            expected: "HIDDEN",
            actual: "HIDDEN"
          });
        } else {
          details.push({
            passed: isCorrect,
            input: tc.input,
            expected: tc.output,
            actual: actualOutput
          });
        }
      } catch (err: any) {
        return NextResponse.json({ error: err.stderr || err.message || String(err) });
      }
    }

    return NextResponse.json({ passed, total: allTests.length, details });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (jobDir && fs.existsSync(jobDir)) {
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (cleanupErr) {
      }
    }
  }
}
