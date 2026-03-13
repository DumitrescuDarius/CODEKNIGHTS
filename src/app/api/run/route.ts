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
    const body = await req.json();
    const { code, stdin } = body;
    language = body.language;

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const tempRoot = path.join(os.tmpdir(), "code_knights_exec");
    if (!fs.existsSync(tempRoot)) {
      try {
        fs.mkdirSync(tempRoot, { recursive: true });
      } catch (err) {
        // Fallback to os.tmpdir directly if needed
      }
    }

    const jobId = crypto.randomUUID();
    jobDir = path.join(fs.existsSync(tempRoot) ? tempRoot : os.tmpdir(), jobId);
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
        // Extract public class name or use first class found
        const classMatch = code.match(/public\s+class\s+([a-zA-Z0-9_$]+)/) || code.match(/class\s+([a-zA-Z0-9_$]+)/);
        const className = classMatch ? classMatch[1] : "Solution";
        fileName = `${className}.java`;
        // Use --release 25 to match system java runtime version
        compileCmd = `javac --release 25 "${path.join(jobDir, fileName)}"`;
        runCmd = `java -cp "${jobDir}" ${className}`;
        break;
      default:
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Write code to file
    fs.writeFileSync(path.join(jobDir, fileName), code);

    // Compile if needed
    if (compileCmd) {
      await new Promise((resolve, reject) => {
        exec(compileCmd, async (error, stdout, stderr) => {
          if (error) {
            reject({ stderr: stderr || error.message });
          } else {
            // Ensure the binary is executable for compiled languages
            if (language === "cpp" || language === "c") {
              exec(`chmod +x "${path.join(jobDir, "solution")}"`, (err) => {
                if (err) reject(err);
                else resolve(stdout);
              });
            } else {
              resolve(stdout);
            }
          }
        });
      });
    }

    // Run code with stdin
    const output = await new Promise((resolve, reject) => {
      const child = exec(runCmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && (error as any).killed) {
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
    
    return NextResponse.json({ output });

  } catch (error: any) {
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
    try {
      if (jobDir && fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }
  }
}
