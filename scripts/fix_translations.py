import re

file_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/constants/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace any double commas with a single comma
new_content = re.sub(r',\s*,', ',', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Fixed double commas in translations.ts")
