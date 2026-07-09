import os
import re

translations_patch = {
    "en": {
        "adminDesc": "Privileged tools for arena management and development.", "editChallenge": "EDIT CHALLENGE", "createChallenge": "CREATE NEW CHALLENGE",
        "titleLabel": "Title", "difficultyLabel": "Difficulty", "noQuestionsFound": "No questions found in the database.",
        "loadingUsers": "Loading users...", "noUsersFound": "No users found."
    },
    "ro": {
        "adminDesc": "Instrumente privilegiate pentru gestionarea arenei.", "editChallenge": "EDITEAZĂ PROVOCAREA", "createChallenge": "CREEAZĂ PROVOCARE NOUĂ",
        "titleLabel": "Titlu", "difficultyLabel": "Dificultate", "noQuestionsFound": "Nu s-au găsit întrebări în baza de date.",
        "loadingUsers": "Se încarcă utilizatorii...", "noUsersFound": "Niciun utilizator găsit."
    },
    "fr": {
        "adminDesc": "Outils privilégiés pour la gestion de l'arène.", "editChallenge": "MODIFIER LE DÉFI", "createChallenge": "CRÉER UN NOUVEAU DÉFI",
        "titleLabel": "Titre", "difficultyLabel": "Difficulté", "noQuestionsFound": "Aucune question trouvée dans la base de données.",
        "loadingUsers": "Chargement des utilisateurs...", "noUsersFound": "Aucun utilisateur trouvé."
    },
    "de": {
         "adminDesc": "Privilegierte Tools für das Arena-Management.", "editChallenge": "HERAUSFORDERUNG BEARBEITEN", "createChallenge": "NEUE HERAUSFORDERUNG ERSTELLEN",
         "titleLabel": "Titel", "difficultyLabel": "Schwierigkeit", "noQuestionsFound": "Keine Fragen in der Datenbank gefunden.",
         "loadingUsers": "Benutzer werden geladen...", "noUsersFound": "Keine Benutzer gefunden."
    },
    "hi": {
         "adminDesc": "अखाड़ा प्रबंधन के लिए विशेषाधिकार प्राप्त उपकरण।", "editChallenge": "चुनौती संपादित करें", "createChallenge": "नई चुनौती बनाएं",
         "titleLabel": "शीर्षक", "difficultyLabel": "कठिनाई", "noQuestionsFound": "डेटाबेस में कोई प्रश्न नहीं मिला।",
         "loadingUsers": "उपयोगकर्ता लोड हो रहे हैं...", "noUsersFound": "कोई उपयोगकर्ता नहीं मिला।"
    },
    "ru": {
         "adminDesc": "Привилегированные инструменты для управления ареной.", "editChallenge": "РЕДАКТИРОВАТЬ ЗАДАЧУ", "createChallenge": "СОЗДАТЬ НОВУЮ ЗАДАЧУ",
         "titleLabel": "Название", "difficultyLabel": "Сложность", "noQuestionsFound": "В базе данных не найдено задач.",
         "loadingUsers": "Загрузка пользователей...", "noUsersFound": "Пользователи не найдены."
    },
    "hu": {
         "adminDesc": "Kiemelt eszközök az aréna kezeléséhez.", "editChallenge": "KIHÍVÁS SZERKESZTÉSE", "createChallenge": "ÚJ KIHÍVÁS LÉTREHOZÁSA",
         "titleLabel": "Cím", "difficultyLabel": "Nehézség", "noQuestionsFound": "Nem található kérdés az adatbázisban.",
         "loadingUsers": "Felhasználók betöltése...", "noUsersFound": "Nem található felhasználó."
    },
    "es": {
         "adminDesc": "Herramientas privilegiadas para la gestión de la arena.", "editChallenge": "EDITAR DESAFÍO", "createChallenge": "CREAR NUEVO DESAFÍO",
         "titleLabel": "Título", "difficultyLabel": "Dificultad", "noQuestionsFound": "No se encontraron preguntas en la base de datos.",
         "loadingUsers": "Cargando usuarios...", "noUsersFound": "No se encontraron usuarios."
    },
    "it": {
         "adminDesc": "Strumenti privilegiati per la gestione dell'arena.", "editChallenge": "MODIFICA SFIDA", "createChallenge": "CREA NUOVA SFIDA",
         "titleLabel": "Titolo", "difficultyLabel": "Difficoltà", "noQuestionsFound": "Nessuna domanda trovata nel database.",
         "loadingUsers": "Caricamento utenti...", "noUsersFound": "Nessun utente trovato."
    },
    "zh": {
         "adminDesc": "竞技场管理和开发特权工具。", "editChallenge": "编辑挑战", "createChallenge": "创建新挑战",
         "titleLabel": "标题", "difficultyLabel": "难度", "noQuestionsFound": "数据库中没有找到问题。",
         "loadingUsers": "正在加载用户...", "noUsersFound": "未找到用户。"
    },
    "ja": {
         "adminDesc": "アリーナ管理用の特権ツール。", "editChallenge": "チャレンジを編集", "createChallenge": "新しいチャレンジを作成",
         "titleLabel": "タイトル", "difficultyLabel": "難易度", "noQuestionsFound": "データベースに質問が見つかりませんでした。",
         "loadingUsers": "ユーザーを読み込んでいます...", "noUsersFound": "ユーザーが見つかりません。"
    },
    "pt": {
         "adminDesc": "Ferramentas privilegiadas para gerenciamento de arena.", "editChallenge": "EDITAR DESAFIO", "createChallenge": "CRIAR NOVO DESAFIO",
         "titleLabel": "Título", "difficultyLabel": "Dificuldade", "noQuestionsFound": "Nenhuma pergunta encontrada no banco de dados.",
         "loadingUsers": "Carregando usuários...", "noUsersFound": "Nenhum usuário encontrado."
    }
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

files_to_update = {
    "src/components/windows/AdminWindow.tsx": [
        ("Privileged tools for arena management and development.", "{t(\"adminDesc\")}"),
        ('"EDIT CHALLENGE"', 't("editChallenge")'),
        ('"CREATE NEW CHALLENGE"', 't("createChallenge")'),
        (">Title<", ">{t(\"titleLabel\")}<"),
        (">Difficulty<", ">{t(\"difficultyLabel\")}<"),
        ("No questions found in the database.", "{t(\"noQuestionsFound\")}"),
        ("Loading users...", "{t(\"loadingUsers\")}"),
        ("No users found.", "{t(\"noUsersFound\")}")
    ]
}

for rel_path, replacements in files_to_update.items():
    full_path = "/home/darius/Programming/Projects/CODEKNIGHTS/" + rel_path
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            f_content = f.read()

        for old, new_ in replacements:
            f_content = f_content.replace(old, new_)

        with open(full_path, "w", encoding="utf-8") as f:
            f.write(f_content)

print("Admin translations applied.")
