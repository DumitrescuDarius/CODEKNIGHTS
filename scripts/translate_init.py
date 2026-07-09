import os
import re

translations_patch = {
    "en": { "initTourney": "INITIALIZE NEW TOURNAMENT" },
    "ro": { "initTourney": "INIȚIALIZEAZĂ TURNEU NOU" },
    "fr": { "initTourney": "INITIALISER NOUVEAU TOURNOI" },
    "de": { "initTourney": "NEUES TURNIER INITIALISIEREN" },
    "hi": { "initTourney": "नया टूर्नामेंट प्रारंभ करें" },
    "ru": { "initTourney": "ИНИЦИАЛИЗИРОВАТЬ НОВЫЙ ТУРНИР" },
    "hu": { "initTourney": "ÚJ BAJNOKSÁG INICIALIZÁLÁSA" },
    "es": { "initTourney": "INICIALIZAR NUEVO TORNEO" },
    "it": { "initTourney": "INIZIALIZZA NUOVO TORNEO" },
    "zh": { "initTourney": "初始化新锦标赛" },
    "ja": { "initTourney": "新しいトーナメントを初期化" },
    "pt": { "initTourney": "INICIALIZAR NOVO TORNEIO" }
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

nw_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/windows/TournamentWindow.tsx"
with open(nw_path, "r", encoding="utf-8") as f:
    nw_content = f.read()

nw_content = nw_content.replace('INITIALIZE NEW TOURNAMENT', '{t("initTourney")}')

with open(nw_path, "w", encoding="utf-8") as f:
    f.write(nw_content)

print("Translations applied.")
