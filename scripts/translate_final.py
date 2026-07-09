import os
import re

translations_patch = {
    "en": {
        "loadingWorkspaces": "Loading workspaces...",
        "bronze": "Bronze", "silver": "Silver", "gold": "Gold", "diamond": "Diamond", "master": "Master", "grandmaster": "Grandmaster",
        "loadingProfile": "LOADING PROFILE...", "profileNotFound": "Profile not found.",
        "zoom": "Zoom", "rotation": "Rotation", "saveCrop": "Save Crop",
        "stdin": "Stdin", "stdout": "Stdout", "utf8": "UTF-8",
        "agentGreeting": "How can I help you with your code today?",
        "penaltyTime": "+1 penalty point per second elapsed.",
        "penaltyWrong": "+50 penalty points for every failed submission.",
        "penaltyComplexity": "+100 penalty points if your algorithm's time complexity is worse than the ideal solution."
    },
    "ro": {
        "loadingWorkspaces": "Se încarcă spațiile de lucru...",
        "bronze": "Bronz", "silver": "Argint", "gold": "Aur", "diamond": "Diamant", "master": "Maestru", "grandmaster": "Mare Maestru",
        "loadingProfile": "SE ÎNCARCĂ PROFILUL...", "profileNotFound": "Profilul nu a fost găsit.",
        "zoom": "Zoom", "rotation": "Rotație", "saveCrop": "Salvează Decupajul",
        "stdin": "Intrare (Stdin)", "stdout": "Ieșire (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Cum te pot ajuta cu codul tău astăzi?",
        "penaltyTime": "+1 punct de penalizare pe secundă scursă.",
        "penaltyWrong": "+50 puncte de penalizare pentru fiecare trimitere eșuată.",
        "penaltyComplexity": "+100 puncte de penalizare dacă complexitatea timpului algoritmului tău este mai slabă decât soluția ideală."
    },
    "fr": {
        "loadingWorkspaces": "Chargement des espaces de travail...",
        "bronze": "Bronze", "silver": "Argent", "gold": "Or", "diamond": "Diamant", "master": "Maître", "grandmaster": "Grand Maître",
        "loadingProfile": "CHARGEMENT DU PROFIL...", "profileNotFound": "Profil introuvable.",
        "zoom": "Zoom", "rotation": "Rotation", "saveCrop": "Enregistrer le Cadrage",
        "stdin": "Entrée (Stdin)", "stdout": "Sortie (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Comment puis-je vous aider avec votre code aujourd'hui ?",
        "penaltyTime": "+1 point de pénalité par seconde écoulée.",
        "penaltyWrong": "+50 points de pénalité pour chaque soumission échouée.",
        "penaltyComplexity": "+100 points de pénalité si la complexité de votre algorithme est pire que la solution idéale."
    },
    "de": {
        "loadingWorkspaces": "Arbeitsbereiche werden geladen...",
        "bronze": "Bronze", "silver": "Silber", "gold": "Gold", "diamond": "Diamant", "master": "Meister", "grandmaster": "Großmeister",
        "loadingProfile": "PROFIL WIRD GELADEN...", "profileNotFound": "Profil nicht gefunden.",
        "zoom": "Zoom", "rotation": "Drehung", "saveCrop": "Zuschnitt Speichern",
        "stdin": "Standardeingabe (Stdin)", "stdout": "Standardausgabe (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Wie kann ich dir heute mit deinem Code helfen?",
        "penaltyTime": "+1 Strafpunkt pro vergangener Sekunde.",
        "penaltyWrong": "+50 Strafpunkte für jede fehlgeschlagene Einreichung.",
        "penaltyComplexity": "+100 Strafpunkte, wenn die Zeitkomplexität deines Algorithmus schlechter ist als die ideale Lösung."
    },
    "hi": {
        "loadingWorkspaces": "कार्यस्थान लोड हो रहे हैं...",
        "bronze": "कांस्य", "silver": "रजत", "gold": "स्वर्ण", "diamond": "हीरा", "master": "मास्टर", "grandmaster": "ग्रैंडमास्टर",
        "loadingProfile": "प्रोफ़ाइल लोड हो रही है...", "profileNotFound": "प्रोफ़ाइल नहीं मिली।",
        "zoom": "ज़ूम", "rotation": "घूर्णन", "saveCrop": "क्रॉप सेव करें",
        "stdin": "Stdin", "stdout": "Stdout", "utf8": "UTF-8",
        "agentGreeting": "मैं आज आपके कोड के साथ आपकी कैसे मदद कर सकता हूँ?",
        "penaltyTime": "+1 दंड बिंदु प्रति बीता हुआ सेकंड।",
        "penaltyWrong": "प्रत्येक विफल सबमिशन के लिए +50 दंड बिंदु।",
        "penaltyComplexity": "+100 दंड बिंदु यदि आपके एल्गोरिथ्म की समय जटिलता आदर्श समाधान से भी बदतर है।"
    },
    "ru": {
        "loadingWorkspaces": "Загрузка рабочих пространств...",
        "bronze": "Бронза", "silver": "Серебро", "gold": "Золото", "diamond": "Алмаз", "master": "Мастер", "grandmaster": "Гроссмейстер",
        "loadingProfile": "ЗАГРУЗКА ПРОФИЛЯ...", "profileNotFound": "Профиль не найден.",
        "zoom": "Масштаб", "rotation": "Вращение", "saveCrop": "Сохранить обрезку",
        "stdin": "Ввод (Stdin)", "stdout": "Вывод (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Как я могу помочь вам с вашим кодом сегодня?",
        "penaltyTime": "+1 штрафной балл за каждую прошедшую секунду.",
        "penaltyWrong": "+50 штрафных баллов за каждую неудачную отправку.",
        "penaltyComplexity": "+100 штрафных баллов, если сложность вашего алгоритма хуже идеального решения."
    },
    "hu": {
        "loadingWorkspaces": "Munkaterületek betöltése...",
        "bronze": "Bronz", "silver": "Ezüst", "gold": "Arany", "diamond": "Gyémánt", "master": "Mester", "grandmaster": "Nagymester",
        "loadingProfile": "PROFIL BETÖLTÉSE...", "profileNotFound": "Profil nem található.",
        "zoom": "Nagyítás", "rotation": "Forgatás", "saveCrop": "Kivágás mentése",
        "stdin": "Bemenet (Stdin)", "stdout": "Kimenet (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Miben segíthetek ma a kódjával kapcsolatban?",
        "penaltyTime": "+1 büntetőpont minden eltelt másodpercért.",
        "penaltyWrong": "+50 büntetőpont minden sikertelen beküldésért.",
        "penaltyComplexity": "+100 büntetőpont, ha az algoritmusa rosszabb időbeli komplexitású, mint az ideális megoldás."
    },
    "es": {
        "loadingWorkspaces": "Cargando espacios de trabajo...",
        "bronze": "Bronce", "silver": "Plata", "gold": "Oro", "diamond": "Diamante", "master": "Maestro", "grandmaster": "Gran Maestro",
        "loadingProfile": "CARGANDO PERFIL...", "profileNotFound": "Perfil no encontrado.",
        "zoom": "Zoom", "rotation": "Rotación", "saveCrop": "Guardar Recorte",
        "stdin": "Entrada (Stdin)", "stdout": "Salida (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "¿En qué puedo ayudarte con tu código hoy?",
        "penaltyTime": "+1 punto de penalización por segundo transcurrido.",
        "penaltyWrong": "+50 puntos de penalización por cada envío fallido.",
        "penaltyComplexity": "+100 puntos de penalización si la complejidad de tiempo de tu algoritmo es peor que la solución ideal."
    },
    "it": {
        "loadingWorkspaces": "Caricamento spazi di lavoro...",
        "bronze": "Bronzo", "silver": "Argento", "gold": "Oro", "diamond": "Diamante", "master": "Maestro", "grandmaster": "Gran Maestro",
        "loadingProfile": "CARICAMENTO PROFILO...", "profileNotFound": "Profilo non trovato.",
        "zoom": "Zoom", "rotation": "Rotazione", "saveCrop": "Salva Ritaglio",
        "stdin": "Input (Stdin)", "stdout": "Output (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Come posso aiutarti con il tuo codice oggi?",
        "penaltyTime": "+1 punto di penalità per ogni secondo trascorso.",
        "penaltyWrong": "+50 punti di penalità per ogni invio non riuscito.",
        "penaltyComplexity": "+100 punti di penalità se la complessità temporale del tuo algoritmo è peggiore della soluzione ideale."
    },
    "zh": {
        "loadingWorkspaces": "正在加载工作区...",
        "bronze": "青铜", "silver": "白银", "gold": "黄金", "diamond": "钻石", "master": "大师", "grandmaster": "宗师",
        "loadingProfile": "正在加载个人资料...", "profileNotFound": "未找到个人资料。",
        "zoom": "缩放", "rotation": "旋转", "saveCrop": "保存裁剪",
        "stdin": "标准输入", "stdout": "标准输出", "utf8": "UTF-8",
        "agentGreeting": "今天我能为您提供什么代码帮助？",
        "penaltyTime": "每经过一秒 +1 惩罚点。",
        "penaltyWrong": "每次失败的提交 +50 惩罚点。",
        "penaltyComplexity": "如果您的算法时间复杂度低于理想解决方案，+100 惩罚点。"
    },
    "ja": {
        "loadingWorkspaces": "ワークスペースを読み込んでいます...",
        "bronze": "ブロンズ", "silver": "シルバー", "gold": "ゴールド", "diamond": "ダイヤモンド", "master": "マスター", "grandmaster": "グランドマスター",
        "loadingProfile": "プロフィールを読み込んでいます...", "profileNotFound": "プロフィールが見つかりません。",
        "zoom": "ズーム", "rotation": "回転", "saveCrop": "クロップを保存",
        "stdin": "標準入力 (Stdin)", "stdout": "標準出力 (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "今日はコードのことでどのようにお手伝いできますか？",
        "penaltyTime": "経過秒数ごとに+1ペナルティポイント。",
        "penaltyWrong": "提出の失敗ごとに+50ペナルティポイント。",
        "penaltyComplexity": "アルゴリズムの時間的複雑さが理想的な解決策よりも悪い場合、+100ペナルティポイント。"
    },
    "pt": {
        "loadingWorkspaces": "Carregando áreas de trabalho...",
        "bronze": "Bronze", "silver": "Prata", "gold": "Ouro", "diamond": "Diamante", "master": "Mestre", "grandmaster": "Grão-Mestre",
        "loadingProfile": "CARREGANDO PERFIL...", "profileNotFound": "Perfil não encontrado.",
        "zoom": "Zoom", "rotation": "Rotação", "saveCrop": "Salvar Recorte",
        "stdin": "Entrada (Stdin)", "stdout": "Saída (Stdout)", "utf8": "UTF-8",
        "agentGreeting": "Como posso te ajudar com seu código hoje?",
        "penaltyTime": "+1 ponto de penalidade por segundo decorrido.",
        "penaltyWrong": "+50 pontos de penalidade para cada submissão falha.",
        "penaltyComplexity": "+100 pontos de penalidade se a complexidade de tempo do seu algoritmo for pior que a solução ideal."
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
    "src/components/windows/NotesWindow.tsx": [
        ("Loading workspaces...", "{t(\"loadingWorkspaces\")}")
    ],
    "src/components/windows/TutorialWindow.tsx": [
        ("+1 penalty point per second elapsed.", "{t(\"penaltyTime\")}"),
        ("+50 penalty points for every failed submission.", "{t(\"penaltyWrong\")}"),
        ("+100 penalty points if your algorithm's time complexity is worse than the ideal solution.", "{t(\"penaltyComplexity\")}"),
        (">Bronze<", ">{t(\"bronze\")}<"),
        (">Silver<", ">{t(\"silver\")}<"),
        (">Gold<", ">{t(\"gold\")}<"),
        (">Diamond<", ">{t(\"diamond\")}<"),
        (">Master<", ">{t(\"master\")}<"),
        (">Grandmaster<", ">{t(\"grandmaster\")}<")
    ],
    "src/components/windows/EditorWindow.tsx": [
        (">Stdin<", ">{t(\"stdin\")}<"),
        (">Stdout<", ">{t(\"stdout\")}<"),
        (">UTF-8<", ">{t(\"utf8\")}<")
    ],
    "src/components/windows/AgentWindow.tsx": [
        (">How can I help you with your code today?<", ">{t(\"agentGreeting\")}<")
    ],
    "src/components/windows/ProfileWindow.tsx": [
        (">LOADING PROFILE...<", ">{t(\"loadingProfile\")}<"),
        (">Profile not found.<", ">{t(\"profileNotFound\")}<"),
        (">Zoom<", ">{t(\"zoom\")}<"),
        (">Rotation<", ">{t(\"rotation\")}<"),
        (">Save Crop<", ">{t(\"saveCrop\")}<")
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

print("Batch 3 applied.")
