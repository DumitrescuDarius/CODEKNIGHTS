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

    // Ensure base temp directory exists
    const tempRoot = path.join(os.tmpdir(), "code_knights_exec");
    try {
      if (!fs.existsSync(tempRoot)) {
        fs.mkdirSync(tempRoot, { recursive: true });
      }
    } catch (err) {
      console.error("[API/RUN] Failed to create tempRoot:", err);
    }

    const jobId = crypto.randomUUID();
    jobDir = path.join(fs.existsSync(tempRoot) ? tempRoot : os.tmpdir(), `job_${jobId}`);
    
    console.log(`[API/RUN] Creating job directory: ${jobDir}`);
    fs.mkdirSync(jobDir, { recursive: true });

    let fileName = "";
    let compileCmd = "";
    let runCmd = "";

    switch (language) {
      case "c":
        fileName = "solution.c";
        compileCmd = `gcc "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        break;
      case "cpp":
        fileName = "solution.cpp";
        compileCmd = `g++ "${path.join(jobDir, fileName)}" -o "${path.join(jobDir, "solution")}"`;
        runCmd = `"${path.join(jobDir, "solution")}"`;
        break;
      case "python":
        fileName = "solution.py";
        runCmd = `python3 "${path.join(jobDir, fileName)}"`;
        break;
      case "java":
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        compileCmd = `javac --release 25 "${path.join(jobDir, fileName)}"`;
        runCmd = `java -cp "${jobDir}" ${className}`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    console.log(`[API/RUN] Writing file: ${fileName}`);
    fs.writeFileSync(path.join(jobDir, fileName), code);

    // Compile if needed
    if (compileCmd) {
      console.log(`[API/RUN] Compiling with: ${compileCmd}`);
      await new Promise((resolve, reject) => {
        exec(compileCmd, { timeout: 10000 }, async (error, stdout, stderr) => {
          if (error) {
            console.error(`[API/RUN] Compilation failed: ${stderr || error.message}`);
            reject({ stderr: stderr || error.message });
          } else {
            if (language === "cpp" || language === "c") {
              exec(`chmod +x "${path.join(jobDir, "solution")}"`, (err) => {
                if (err) console.error("[API/RUN] chmod failed:", err);
                resolve(stdout);
              });
            } else {
              resolve(stdout);
            }
          }
        });
      });
    }

    // Run code with stdin
    console.log(`[API/RUN] Running with: ${runCmd}`);
    const output = await new Promise((resolve, reject) => {
      const child = exec(runCmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && (error as any).killed) {
          console.error("[API/RUN] Execution timed out");
          reject({ stderr: "Execution timed out (5s)" });
        } else {
          resolve(stdout + (stderr ? "\n" + stderr : ""));
        }
      });

      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
    
    console.log("[API/RUN] Execution successful");
    return NextResponse.json({ output });

  } catch (error: any) {
    console.error("[API/RUN] Error caught:", error.stderr || error.message || error);
    const stderr = error.stderr || error.message || String(error);
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
    // Cleanup
    if (jobDir && fs.existsSync(jobDir)) {
      try {
        console.log(`[API/RUN] Cleaning up: ${jobDir}`);
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error("[API/RUN] Cleanup error:", cleanupErr);
      }
    }
  }
}
