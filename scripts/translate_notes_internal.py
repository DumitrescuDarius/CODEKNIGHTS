import os
import re

translations_patch = {
    "en": { "mainWorkspace": "Main Workspace" },
    "ro": { "mainWorkspace": "Spațiu Principal" },
    "fr": { "mainWorkspace": "Espace Principal" },
    "de": { "mainWorkspace": "Hauptarbeitsbereich" },
    "hi": { "mainWorkspace": "मुख्य कार्यस्थान" },
    "ru": { "mainWorkspace": "Главное Пространство" },
    "hu": { "mainWorkspace": "Fő Munkaterület" },
    "es": { "mainWorkspace": "Espacio Principal" },
    "it": { "mainWorkspace": "Spazio Principale" },
    "zh": { "mainWorkspace": "主工作区" },
    "ja": { "mainWorkspace": "メインワークスペース" },
    "pt": { "mainWorkspace": "Área Principal" }
}

file_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/constants/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

for lang, words in translations_patch.items():
    pattern = r"(" + lang + r": \{)(.*?)(\n\s*\},?)"
    match = re.search(pattern, content, flags=re.DOTALL)
    if match:
        prefix = match.group(1)
        inner = match.group(2)
        suffix = match.group(3)
        new_inner = inner
        for key, value in words.items():
            if f"{key}:" not in inner:
                new_inner += f', {key}: "{value}"'
        content = content[:match.start()] + prefix + new_inner + suffix + content[match.end():]

content = re.sub(r',\s*,', ',', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

nw_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/windows/NotesWindow.tsx"
with open(nw_path, "r", encoding="utf-8") as f:
    nw_content = f.read()

nw_content = nw_content.replace('name: "Main Workspace"', 'name: t("mainWorkspace")')
nw_content = nw_content.replace('name: "New Workspace"', 'name: t("newWorkspace")')

with open(nw_path, "w", encoding="utf-8") as f:
    f.write(nw_content)

print("Notes internal strings applied.")
