#!/usr/bin/env python3
import os
import re
import sys
import json
import urllib.request
import urllib.error

def print_help():
    print("Usage: python add_problem.py <problem_folder_path>")
    print("\nExpected folder structure:")
    print("  problem_folder/")
    print("    test0.in, test0.ok, test1.in, test1.ok, ... (individual test files)")
    print("    OR tests.in + tests.ok (concatenated with === delimiter)")
    print("    info.txt         - Metadata in key:value format (optional)")
    print("    description.md   - Markdown description (optional)")
    print("\ninfo.txt format (all keys optional):")
    print("    Title: My Challenge")
    print("    Difficulty: Easy|Medium|Hard")
    print("    Restrictions: markdown constraints text")
    print("    TimeLimit: 5000ms")
    print("    MemoryLimit: 256MB")

def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print_help()
        sys.exit(0)

    folder_path = sys.argv[1]
    if not os.path.isdir(folder_path):
        print(f"Error: Directory '{folder_path}' does not exist.")
        sys.exit(1)

    # 1. Scan for individual test cases: test0.in/test0.ok, test1.in/test1.ok, etc.
    test_files = {}
    for filename in os.listdir(folder_path):
        match = re.match(r'^test(\d+)\.(in|ok)$', filename)
        if match:
            num = int(match.group(1))
            ext = match.group(2)
            if num not in test_files:
                test_files[num] = {}
            test_files[num][ext] = filename

    sorted_nums = sorted(test_files.keys())
    paired_nums = [n for n in sorted_nums if 'in' in test_files[n] and 'ok' in test_files[n]]

    test_cases = []

    # 2. Read Metadata (Title, Difficulty, Restrictions) from a single info/problem/title text file
    title = os.path.basename(os.path.normpath(folder_path)).replace("_", " ").title()
    difficulty = "Easy"
    restrictions = ""
    time_limit = 5000
    memory_limit = 256

    metadata_content = ""
    for meta_file in ("info.txt", "problem.txt", "title.txt"):
        meta_path = os.path.join(folder_path, meta_file)
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                metadata_content = f.read()
            break

    if metadata_content:
        # Check if file has "key: value" format (at least one valid metadata key)
        has_keys = False
        lines = metadata_content.splitlines()
        for line in lines:
            if ":" in line:
                key = line.split(":", 1)[0].strip().lower()
                if key in ("title", "difficulty", "restrictions", "timelimit", "time_limit", "memorylimit", "memory_limit"):
                    has_keys = True
                    
        if has_keys:
            for line in lines:
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip().lower()
                    val = val.strip()
                    if key == "title":
                        title = val
                    elif key == "difficulty":
                        if val.title() in ("Easy", "Medium", "Hard"):
                            difficulty = val.title()
                    elif key == "restrictions":
                        restrictions = val
                    elif key in ("timelimit", "time_limit"):
                        try:
                            time_limit = int(val.replace("ms", "").strip())
                        except ValueError:
                            pass
                    elif key in ("memorylimit", "memory_limit"):
                        try:
                            memory_limit = int(val.replace("mb", "").replace("MB", "").strip())
                        except ValueError:
                            pass
        else:
            # Fallback to treat the first line of the file as the title
            first_line = metadata_content.strip().splitlines()[0] if metadata_content.strip() else ""
            if first_line:
                title = first_line

    # Also fallback to legacy individual text files if info.txt was not used/found
    if not restrictions:
        rest_path = os.path.join(folder_path, "restrictions.txt")
        if os.path.exists(rest_path):
            with open(rest_path, 'r', encoding='utf-8') as f:
                restrictions = f.read().strip()

    if difficulty == "Easy":
        diff_path = os.path.join(folder_path, "difficulty.txt")
        if os.path.exists(diff_path):
            with open(diff_path, 'r', encoding='utf-8') as f:
                val = f.read().strip().title()
                if val in ("Easy", "Medium", "Hard"):
                    difficulty = val

    # 3. Read Description
    desc_path = os.path.join(folder_path, "description.md")
    if os.path.exists(desc_path):
        with open(desc_path, 'r', encoding='utf-8') as f:
            description = f.read().strip()
    else:
        description = f"### {title}\n\nWrite a solution to solve this challenge."

    # 6. Parse test cases
    if paired_nums:
        # Mode A: Individual files (test0.in, test0.ok, etc.)
        for num in paired_nums:
            in_file = os.path.join(folder_path, test_files[num]['in'])
            ok_file = os.path.join(folder_path, test_files[num]['ok'])
            with open(in_file, 'r', encoding='utf-8') as f:
                in_val = f.read().strip()
            with open(ok_file, 'r', encoding='utf-8') as f:
                out_val = f.read().strip()
            test_cases.append({"input": in_val, "output": out_val})
        print(f"Parsed {len(test_cases)} test cases from individual test files.")
    else:
        # Mode B: Single concatenated files (tests.in, tests.ok)
        in_path = os.path.join(folder_path, "tests.in")
        ok_path = os.path.join(folder_path, "tests.ok")

        if not os.path.exists(in_path) or not os.path.exists(ok_path):
            print("Error: Could not find any test cases. Provide either individual files (e.g. test0.in/test0.ok) or concatenated files (tests.in/tests.ok).")
            sys.exit(1)

        with open(in_path, 'r', encoding='utf-8') as f:
            in_content = f.read()

        with open(ok_path, 'r', encoding='utf-8') as f:
            ok_content = f.read()

        delimiter_pattern = r'\r?\n\s*===\s*\r?\n'

        # Split using the pattern
        if re.search(delimiter_pattern, in_content) or re.search(delimiter_pattern, ok_content):
            inputs = [part.strip() for part in re.split(delimiter_pattern, in_content)]
            outputs = [part.strip() for part in re.split(delimiter_pattern, ok_content)]
        else:
            # Fallback to single testcase if no === delimiter
            inputs = [in_content.strip()]
            outputs = [ok_content.strip()]

        # Filter out trailing empty entries from both side splits
        while len(inputs) > 0 and not inputs[-1]:
            inputs.pop()
        while len(outputs) > 0 and not outputs[-1]:
            outputs.pop()

        count = max(len(inputs), len(outputs))
        for i in range(count):
            in_val = inputs[i] if i < len(inputs) else ""
            out_val = outputs[i] if i < len(outputs) else ""
            # Skip fully empty rows
            if in_val or out_val:
                test_cases.append({"input": in_val, "output": out_val})
        print(f"Parsed {len(test_cases)} test cases from tests.in/tests.ok.")

    # 6. Scan for broken code templates (broken.py, broken.cpp, broken.c, broken.java)
    broken_code = {}
    lang_mapping = {
        'py': 'python',
        'cpp': 'cpp',
        'c': 'c',
        'java': 'java'
    }
    for filename in os.listdir(folder_path):
        parts = filename.split('.')
        if len(parts) == 2 and parts[0] == 'broken' and parts[1].lower() in lang_mapping:
            lang_key = lang_mapping[parts[1].lower()]
            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    broken_code[lang_key] = f.read()
                print(f"Parsed broken code for language: {lang_key}")
            except Exception as e:
                print(f"Warning: Failed to read broken code file {filename}: {e}")

    # 7. Build API Request
    # First parsed test case becomes the public sample example. All test cases are added to hiddenTestCases.
    payload = {
        "title": title,
        "description": description,
        "restrictions": restrictions,
        "difficulty": difficulty,
        "testCases": test_cases[:1],
        "hiddenTestCases": test_cases,
        "timeLimit": time_limit,
        "memoryLimit": memory_limit,
        "brokenCode": json.dumps(broken_code) if broken_code else None
    }

    url = os.environ.get("CODEKNIGHTS_API_URL", "http://localhost:3000/api/admin/questions")
    api_key = os.environ.get("ADMIN_API_KEY", "dev-admin-key")

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    print(f"Connecting to API at: {url}...")
    try:
        with urllib.request.urlopen(req) as res:
            res_body = res.read().decode('utf-8')
            if res.status == 200:
                data = json.loads(res_body)
                print("\n[SUCCESS] Challenge added successfully!")
                print(f"  ID: {data.get('id')}")
                print(f"  Problem No: #{data.get('problemId')}")
                print(f"  Title: {data.get('title')}")
                print(f"  Difficulty: {data.get('difficulty')}")
            else:
                print(f"API Error (status {res.status}): {res_body}")
    except urllib.error.HTTPError as e:
        print(f"\n[ERROR] HTTP Error: {e.code} - {e.reason}")
        try:
            print(e.read().decode('utf-8'))
        except Exception:
            pass
    except urllib.error.URLError as e:
        print(f"\n[ERROR] Connection Failed: {e.reason}")
        print("Ensure the local dev server is running on http://localhost:3000")

if __name__ == "__main__":
    main()
