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

    console.log(`[API/RUN] Received request for ${language} (Docker Mode)`);

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    // We use os.tmpdir() which is usually /tmp on Linux
    const tempRoot = path.join(os.tmpdir(), "code_knights_exec");
    if (!fs.existsSync(tempRoot)) {
      fs.mkdirSync(tempRoot, { recursive: true, mode: 0o777 });
    }

    const jobId = crypto.randomUUID();
    jobDir = path.join(tempRoot, `job_${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true, mode: 0o777 });

    let fileName = "";
    let dockerImage = "";
    let containerCmd = "";

    // Security: Limit memory to 128MB and CPU to 0.5 cores
    const dockerArgs = `--rm --network none --memory 128m --cpus 0.5 -v "${jobDir}:/app" -w /app`;

    switch (language) {
      case "c":
        fileName = "solution.c";
        dockerImage = "gcc:latest";
        containerCmd = `sh -c "gcc solution.c -o solution && ./solution"`;
        break;
      case "cpp":
        fileName = "solution.cpp";
        dockerImage = "gcc:latest";
        containerCmd = `sh -c "g++ solution.cpp -o solution && ./solution"`;
        break;
      case "python":
        fileName = "solution.py";
        dockerImage = "python:3.11-slim";
        containerCmd = `python3 solution.py`;
        break;
      case "java":
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        dockerImage = "openjdk:17-slim";
        containerCmd = `sh -c "javac ${fileName} && java ${className}"`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Write code to file
    fs.writeFileSync(path.join(jobDir, fileName), code);
    // Ensure file is readable by the docker user (which might be root or non-root)
    fs.chmodSync(path.join(jobDir, fileName), 0o666);

    const fullRunCmd = `docker run ${dockerArgs} ${dockerImage} ${containerCmd}`;
    
    console.log(`[API/RUN] Executing: ${fullRunCmd}`);

    const output = await new Promise((resolve, reject) => {
      const child = exec(fullRunCmd, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && (error as any).killed) {
          reject({ stderr: "Execution timed out (10s)" });
        } else {
          // Combine stdout and stderr for the user to see
          resolve(stdout + (stderr ? "\n" + stderr : ""));
        }
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
    
    return NextResponse.json({ output });

  } catch (error: any) {
    const stderr = error.stderr || error.message || String(error);
    console.error("[API/RUN] Docker Error:", stderr);
    
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
