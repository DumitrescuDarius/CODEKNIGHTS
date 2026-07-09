import os
import re

translations_patch = {
    "en": {
        "battle": "BATTLE", "arena": "ARENA", "tourna": "TOURNA", "ments": "MENTS",
        "rankA": "RANK_A", "rankB": "RANK_B", "adminAccess": "ADMIN_ACCESS",
        "noAgentsRegistered": "NO AGENTS REGISTERED...", "noActiveSequences": "NO ACTIVE SEQUENCES DETECTED.",
        "agentsTitle": "AGENTS", "phaseTitle": "PHASE",
        "selectProblem": "Select a problem to start battling.",
        "howToPlay": "HOW TO PLAY", "tutorialEditorTitle": "1. The Editor",
        "tutorialEditorDesc": "Write your code in the main window. You can switch languages and themes in the Settings.",
        "tutorialBattlesTitle": "2. Battles", "tutorialBattlesDesc": "Compete against other players to solve programming problems the fastest.",
        "tutorialPenaltyTitle": "3. Penalty System", "tutorialScoreFormula": "Your score is determined by Time + Penalty.",
        "tutorialTimePenalty": "Time: +1 penalty point per second elapsed.",
        "tutorialWrongAttemptsPenalty": "Wrong Attempts: +50 penalty points per failed submission.",
        "tutorialComplexityPenalty": "Complexity: +100 penalty points if your time complexity is worse than required.",
        "letsGo": "LET'S GO"
    },
    "ro": {
         "battle": "LUPTĂ", "arena": "ARENĂ", "tourna": "TUR", "ments": "NEE",
        "rankA": "RANG_A", "rankB": "RANG_B", "adminAccess": "ACCES_ADMIN",
        "noAgentsRegistered": "NICIUN AGENT ÎNREGISTRAT...", "noActiveSequences": "NICIO SECVENȚĂ ACTIVĂ DETECTATĂ.",
        "agentsTitle": "AGENȚI", "phaseTitle": "FAZĂ",
        "selectProblem": "Selectează o problemă pentru a începe lupta.",
        "howToPlay": "CUM SĂ JOCI", "tutorialEditorTitle": "1. Editorul",
        "tutorialEditorDesc": "Scrie codul în fereastra principală. Poți schimba limbile și temele din Setări.",
        "tutorialBattlesTitle": "2. Lupte", "tutorialBattlesDesc": "Concurează împotriva altor jucători pentru a rezolva probleme de programare cât mai rapid.",
        "tutorialPenaltyTitle": "3. Sistem de Penalizări", "tutorialScoreFormula": "Scorul tău este determinat de Timp + Penalizare.",
        "tutorialTimePenalty": "Timp: +1 punct de penalizare per secundă scursă.",
        "tutorialWrongAttemptsPenalty": "Încercări Greșite: +50 puncte de penalizare per trimitere eșuată.",
        "tutorialComplexityPenalty": "Complexitate: +100 puncte de penalizare dacă complexitatea timpului este mai slabă decât se cere.",
        "letsGo": "SĂ ÎNCEPEM"
    },
    "fr": {
         "battle": "BATAILLE", "arena": "ARÈNE", "tourna": "TOUR", "ments": "NOIS",
        "rankA": "RANG_A", "rankB": "RANG_B", "adminAccess": "ACCÈS_ADMIN",
        "noAgentsRegistered": "AUCUN AGENT ENREGISTRÉ...", "noActiveSequences": "AUCUNE SÉQUENCE ACTIVE DÉTECTÉE.",
        "agentsTitle": "AGENTS", "phaseTitle": "PHASE",
        "selectProblem": "Sélectionnez un problème pour commencer le combat.",
        "howToPlay": "COMMENT JOUER", "tutorialEditorTitle": "1. L'Éditeur",
        "tutorialEditorDesc": "Écrivez votre code dans la fenêtre principale. Vous pouvez changer les langues et les thèmes dans les Paramètres.",
        "tutorialBattlesTitle": "2. Batailles", "tutorialBattlesDesc": "Affrontez d'autres joueurs pour résoudre les problèmes de programmation le plus rapidement possible.",
        "tutorialPenaltyTitle": "3. Système de Pénalités", "tutorialScoreFormula": "Votre score est déterminé par le Temps + la Pénalité.",
        "tutorialTimePenalty": "Temps: +1 point de pénalité par seconde écoulée.",
        "tutorialWrongAttemptsPenalty": "Tentatives Incorrectes: +50 points de pénalité par soumission échouée.",
        "tutorialComplexityPenalty": "Complexité: +100 points de pénalité si votre complexité temporelle est pire que requise.",
        "letsGo": "ALLONS-Y"
    },
    "de": {
        "battle": "KAMPF", "arena": "ARENA", "tourna": "TUR", "ments": "NIERE",
        "rankA": "RANG_A", "rankB": "RANG_B", "adminAccess": "ADMIN_ZUGRIFF",
        "noAgentsRegistered": "KEINE AGENTEN REGISTRIERT...", "noActiveSequences": "KEINE AKTIVEN SEQUENZEN ERKANNT.",
        "agentsTitle": "AGENTEN", "phaseTitle": "PHASE",
        "selectProblem": "Wähle ein Problem aus, um den Kampf zu beginnen.",
        "howToPlay": "SPIELANLEITUNG", "tutorialEditorTitle": "1. Der Editor",
        "tutorialEditorDesc": "Schreibe deinen Code im Hauptfenster. Du kannst Sprachen und Designs in den Einstellungen ändern.",
        "tutorialBattlesTitle": "2. Kämpfe", "tutorialBattlesDesc": "Tritt gegen andere Spieler an, um Programmierprobleme am schnellsten zu lösen.",
        "tutorialPenaltyTitle": "3. Strafsystem", "tutorialScoreFormula": "Deine Punktzahl wird durch Zeit + Strafe bestimmt.",
        "tutorialTimePenalty": "Zeit: +1 Strafpunkt pro vergangener Sekunde.",
        "tutorialWrongAttemptsPenalty": "Falsche Versuche: +50 Strafpunkte pro fehlgeschlagener Einreichung.",
        "tutorialComplexityPenalty": "Komplexität: +100 Strafpunkte, wenn deine Zeitkomplexität schlechter ist als gefordert.",
        "letsGo": "LOS GEHT'S"
    },
    "hi": {
        "battle": "लड़ाई", "arena": "अखाड़ा", "tourna": "टूर्ना", "ments": "मेंट",
        "rankA": "RANK_A", "rankB": "RANK_B", "adminAccess": "ADMIN_ACCESS",
        "noAgentsRegistered": "कोई एजेंट पंजीकृत नहीं...", "noActiveSequences": "कोई सक्रिय अनुक्रम नहीं मिला।",
        "agentsTitle": "एजेंट", "phaseTitle": "चरण",
        "selectProblem": "लड़ाई शुरू करने के लिए एक समस्या चुनें।",
        "howToPlay": "कैसे खेलें", "tutorialEditorTitle": "1. संपादक",
        "tutorialEditorDesc": "मुख्य विंडो में अपना कोड लिखें। आप सेटिंग्स में भाषाएं और थीम बदल सकते हैं।",
        "tutorialBattlesTitle": "2. लड़ाई", "tutorialBattlesDesc": "प्रोग्रामिंग समस्याओं को सबसे तेजी से हल करने के लिए अन्य खिलाड़ियों के खिलाफ प्रतिस्पर्धा करें।",
        "tutorialPenaltyTitle": "3. दंड प्रणाली", "tutorialScoreFormula": "आपका स्कोर समय + दंड द्वारा निर्धारित किया जाता है।",
        "tutorialTimePenalty": "समय: +1 दंड बिंदु प्रति बीता हुआ सेकंड।",
        "tutorialWrongAttemptsPenalty": "गलत प्रयास: +50 दंड बिंदु प्रति विफल सबमिशन।",
        "tutorialComplexityPenalty": "जटिलता: +100 दंड बिंदु यदि आपकी समय जटिलता आवश्यकता से खराब है।",
        "letsGo": "चलो चलें"
    },
    "ru": {
        "battle": "БИТВА", "arena": "АРЕНА", "tourna": "ТУР", "ments": "НИРЫ",
        "rankA": "РАНГ_A", "rankB": "РАНГ_B", "adminAccess": "ДОСТУП_АДМИНА",
        "noAgentsRegistered": "АГЕНТЫ НЕ ЗАРЕГИСТРИРОВАНЫ...", "noActiveSequences": "АКТИВНЫЕ ПОСЛЕДОВАТЕЛЬНОСТИ НЕ ОБНАРУЖЕНЫ.",
        "agentsTitle": "АГЕНТЫ", "phaseTitle": "ФАЗА",
        "selectProblem": "Выберите задачу, чтобы начать битву.",
        "howToPlay": "КАК ИГРАТЬ", "tutorialEditorTitle": "1. Редактор",
        "tutorialEditorDesc": "Пишите код в главном окне. Вы можете менять языки и темы в Настройках.",
        "tutorialBattlesTitle": "2. Битвы", "tutorialBattlesDesc": "Соревнуйтесь с другими игроками в скорости решения задач.",
        "tutorialPenaltyTitle": "3. Система штрафов", "tutorialScoreFormula": "Ваш счет определяется как Время + Штраф.",
        "tutorialTimePenalty": "Время: +1 штрафной балл за каждую прошедшую секунду.",
        "tutorialWrongAttemptsPenalty": "Неверные попытки: +50 штрафных баллов за неудачную отправку.",
        "tutorialComplexityPenalty": "Сложность: +100 штрафных баллов, если сложность хуже требуемой.",
        "letsGo": "ПОГНАЛИ"
    },
    "hu": {
        "battle": "CSATA", "arena": "ARÉNA", "tourna": "BAJNOK", "ments": "SÁG",
        "rankA": "RANG_A", "rankB": "RANG_B", "adminAccess": "ADMIN_HOZZÁFÉRÉS",
        "noAgentsRegistered": "NINCSENEK REGISZTRÁLT ÜGYNÖKÖK...", "noActiveSequences": "NINCS AKTÍV SZEKVENCIA.",
        "agentsTitle": "ÜGYNÖKÖK", "phaseTitle": "FÁZIS",
        "selectProblem": "Válassz egy feladatot a csata megkezdéséhez.",
        "howToPlay": "HOGYAN KELL JÁTSZANI", "tutorialEditorTitle": "1. A Szerkesztő",
        "tutorialEditorDesc": "Írd a kódodat a főablakba. A nyelveket és a témákat a Beállításokban módosíthatod.",
        "tutorialBattlesTitle": "2. Csaták", "tutorialBattlesDesc": "Versenyezz más játékosokkal, hogy a leggyorsabban oldd meg a programozási feladatokat.",
        "tutorialPenaltyTitle": "3. Büntetési Rendszer", "tutorialScoreFormula": "A pontszámod az Idő + Büntetés alapján dől el.",
        "tutorialTimePenalty": "Idő: +1 büntetőpont minden eltelt másodpercért.",
        "tutorialWrongAttemptsPenalty": "Rossz próbálkozások: +50 büntetőpont sikertelen beküldésenként.",
        "tutorialComplexityPenalty": "Komplexitás: +100 büntetőpont, ha a komplexitásod rosszabb az elvártnál.",
        "letsGo": "GYERÜNK"
    },
    "es": {
        "battle": "BATALLA", "arena": "ARENA", "tourna": "TOR", "ments": "NEOS",
        "rankA": "RANGO_A", "rankB": "RANGO_B", "adminAccess": "ACCESO_ADMIN",
        "noAgentsRegistered": "NO HAY AGENTES REGISTRADOS...", "noActiveSequences": "NO SE DETECTARON SECUENCIAS ACTIVAS.",
        "agentsTitle": "AGENTES", "phaseTitle": "FASE",
        "selectProblem": "Selecciona un problema para comenzar la batalla.",
        "howToPlay": "CÓMO JUGAR", "tutorialEditorTitle": "1. El Editor",
        "tutorialEditorDesc": "Escribe tu código en la ventana principal. Puedes cambiar idiomas y temas en la Configuración.",
        "tutorialBattlesTitle": "2. Batallas", "tutorialBattlesDesc": "Compite contra otros jugadores para resolver problemas de programación más rápido.",
        "tutorialPenaltyTitle": "3. Sistema de Penalización", "tutorialScoreFormula": "Tu puntuación se determina por Tiempo + Penalización.",
        "tutorialTimePenalty": "Tiempo: +1 punto de penalización por segundo transcurrido.",
        "tutorialWrongAttemptsPenalty": "Intentos Incorrectos: +50 puntos de penalización por envío fallido.",
        "tutorialComplexityPenalty": "Complejidad: +100 puntos de penalización si tu complejidad de tiempo es peor de lo requerido.",
        "letsGo": "VAMOS"
    },
    "it": {
        "battle": "BATTAGLIA", "arena": "ARENA", "tourna": "TOR", "ments": "NEI",
        "rankA": "RANGO_A", "rankB": "RANGO_B", "adminAccess": "ACCESSO_ADMIN",
        "noAgentsRegistered": "NESSUN AGENTE REGISTRATO...", "noActiveSequences": "NESSUNA SEQUENZA ATTIVA RILEVATA.",
        "agentsTitle": "AGENTI", "phaseTitle": "FASE",
        "selectProblem": "Seleziona un problema per iniziare la battaglia.",
        "howToPlay": "COME GIOCARE", "tutorialEditorTitle": "1. L'Editor",
        "tutorialEditorDesc": "Scrivi il tuo codice nella finestra principale. Puoi cambiare lingua e tema nelle Impostazioni.",
        "tutorialBattlesTitle": "2. Battaglie", "tutorialBattlesDesc": "Competi contro altri giocatori per risolvere i problemi di programmazione più velocemente.",
        "tutorialPenaltyTitle": "3. Sistema di Penalità", "tutorialScoreFormula": "Il tuo punteggio è determinato da Tempo + Penalità.",
        "tutorialTimePenalty": "Tempo: +1 punto di penalità per secondo trascorso.",
        "tutorialWrongAttemptsPenalty": "Tentativi Errati: +50 punti di penalità per invio fallito.",
        "tutorialComplexityPenalty": "Complessità: +100 punti di penalità se la tua complessità temporale è peggiore di quanto richiesto.",
        "letsGo": "ANDIAMO"
    },
    "zh": {
        "battle": "战斗", "arena": "竞技场", "tourna": "锦标", "ments": "赛",
        "rankA": "RANK_A", "rankB": "RANK_B", "adminAccess": "管理员访问",
        "noAgentsRegistered": "没有注册的代理...", "noActiveSequences": "未检测到活动序列。",
        "agentsTitle": "代理", "phaseTitle": "阶段",
        "selectProblem": "选择一个问题开始战斗。",
        "howToPlay": "怎么玩", "tutorialEditorTitle": "1. 编辑器",
        "tutorialEditorDesc": "在主窗口中编写代码。您可以在设置中切换语言和主题。",
        "tutorialBattlesTitle": "2. 战斗", "tutorialBattlesDesc": "与其他玩家竞争，以最快的速度解决编程问题。",
        "tutorialPenaltyTitle": "3. 惩罚系统", "tutorialScoreFormula": "您的分数由时间 + 惩罚决定。",
        "tutorialTimePenalty": "时间：每经过一秒 +1 惩罚点。",
        "tutorialWrongAttemptsPenalty": "错误尝试：每次提交失败 +50 惩罚点。",
        "tutorialComplexityPenalty": "复杂性：如果您的时间复杂性低于要求，+100 惩罚点。",
        "letsGo": "开始吧"
    },
    "ja": {
        "battle": "バトル", "arena": "アリーナ", "tourna": "トーナ", "ments": "メント",
        "rankA": "RANK_A", "rankB": "RANK_B", "adminAccess": "ADMIN_ACCESS",
        "noAgentsRegistered": "エージェントが登録されていません...", "noActiveSequences": "アクティブなシーケンスが検出されませんでした。",
        "agentsTitle": "エージェント", "phaseTitle": "フェーズ",
        "selectProblem": "バトルを開始する問題を選択してください。",
        "howToPlay": "遊び方", "tutorialEditorTitle": "1. エディター",
        "tutorialEditorDesc": "メインウィンドウにコードを記述します。設定で言語とテーマを切り替えることができます。",
        "tutorialBattlesTitle": "2. バトル", "tutorialBattlesDesc": "プログラミングの問題を最も速く解決するために他のプレイヤーと競います。",
        "tutorialPenaltyTitle": "3. ペナルティシステム", "tutorialScoreFormula": "スコアは時間 + ペナルティによって決定されます。",
        "tutorialTimePenalty": "時間: 経過秒数ごとに+1ペナルティポイント。",
        "tutorialWrongAttemptsPenalty": "誤った試行: 提出の失敗ごとに+50ペナルティポイント。",
        "tutorialComplexityPenalty": "複雑さ: 時間の複雑さが要求よりも悪い場合、+100ペナルティポイント。",
        "letsGo": "始めよう"
    },
    "pt": {
        "battle": "BATALHA", "arena": "ARENA", "tourna": "TOR", "ments": "NEIOS",
        "rankA": "RANK_A", "rankB": "RANK_B", "adminAccess": "ACESSO_ADMIN",
        "noAgentsRegistered": "NENHUM AGENTE REGISTRADO...", "noActiveSequences": "NENHUMA SEQUÊNCIA ATIVA DETECTADA.",
        "agentsTitle": "AGENTES", "phaseTitle": "FASE",
        "selectProblem": "Selecione um problema para começar a batalha.",
        "howToPlay": "COMO JOGAR", "tutorialEditorTitle": "1. O Editor",
        "tutorialEditorDesc": "Escreva seu código na janela principal. Você pode alterar idiomas e temas nas Configurações.",
        "tutorialBattlesTitle": "2. Batalhas", "tutorialBattlesDesc": "Compita contra outros jogadores para resolver problemas de programação o mais rápido possível.",
        "tutorialPenaltyTitle": "3. Sistema de Penalidade", "tutorialScoreFormula": "Sua pontuação é determinada por Tempo + Penalidade.",
        "tutorialTimePenalty": "Tempo: +1 ponto de penalidade por segundo decorrido.",
        "tutorialWrongAttemptsPenalty": "Tentativas Incorretas: +50 pontos de penalidade por submissão falha.",
        "tutorialComplexityPenalty": "Complexidade: +100 pontos de penalidade se a complexidade for pior do que o exigido.",
        "letsGo": "VAMOS LÁ"
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

# File Updates
files_to_update = {
    "src/components/windows/BattleWindow.tsx": [
        (">BATTLE<", ">{t(\"battle\")}<"),
        (">ARENA<", ">{t(\"arena\")}<"),
        ("Select a problem to start battling.", "{t(\"selectProblem\")}")
    ],
    "src/components/windows/TournamentWindow.tsx": [
        (">TOURNA<", ">{t(\"tourna\")}<"),
        (">MENTS<", ">{t(\"ments\")}<"),
        (">RANK_A<", ">{t(\"rankA\")}<"),
        (">RANK_B<", ">{t(\"rankB\")}<"),
        (">ADMIN_ACCESS<", ">{t(\"adminAccess\")}<"),
        (">IDENTIFIER_TITLE<", ">{t(\"identifierTitle\")}<"),
        (">ADD_PARTICIPANT<", ">{t(\"addParticipant\")}<"),
        (">INVITE<", ">{t(\"inviteBtn\") || t(\"invite\")}<"),
        ("NO AGENTS REGISTERED...", "{t(\"noAgentsRegistered\")}"),
        ("NO ACTIVE SEQUENCES DETECTED.", "{t(\"noActiveSequences\")}"),
        (">AGENTS<", ">{t(\"agentsTitle\")}<"),
        (">PHASE<", ">{t(\"phaseTitle\")}<")
    ],
    "src/components/windows/TutorialWindow.tsx": [
        (">HOW TO PLAY<", ">{t(\"howToPlay\")}<"),
        (">1. The Editor<", ">{t(\"tutorialEditorTitle\")}<"),
        ("Write your code in the main window. You can switch languages and themes in the Settings.", "{t(\"tutorialEditorDesc\")}"),
        (">2. Battles<", ">{t(\"tutorialBattlesTitle\")}<"),
        ("Compete against other players to solve programming problems the fastest.", "{t(\"tutorialBattlesDesc\")}"),
        (">3. Penalty System<", ">{t(\"tutorialPenaltyTitle\")}<"),
        ("Your score is determined by Time + Penalty.", "{t(\"tutorialScoreFormula\")}"),
        ("Time: +1 penalty point per second elapsed.", "{t(\"tutorialTimePenalty\")}"),
        ("Wrong Attempts: +50 penalty points per failed submission.", "{t(\"tutorialWrongAttemptsPenalty\")}"),
        ("Complexity: +100 penalty points if your time complexity is worse than required.", "{t(\"tutorialComplexityPenalty\")}"),
        (">LET'S GO<", ">{t(\"letsGo\")}<")
    ],
    "src/components/windows/FriendsWindow.tsx": [
        ("No friends added yet.", "{t(\"noFriendsAdded\")}"),
        (">CANCEL<", ">{t(\"cancelInvite\") || t(\"cancel\")}<"),
        (">DUEL!<", ">{t(\"duelBtn\") || t(\"duel\")}<"),
        ("Type at least 2 characters to search for users.", "{t(\"typeToSearch\")}"),
        (">Remove Friend<", ">{t(\"removeFriendTitle\") || t(\"removeFriend\")}<"),
        (">Remove<", ">{t(\"removeBtn\") || t(\"remove\")}<")
    ]
}

for rel_path, replacements in files_to_update.items():
    full_path = "/home/darius/Programming/Projects/CODEKNIGHTS/" + rel_path
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            f_content = f.read()

        # Add `t` to props if not present (only for those that don't already have it)
        if "t: (k: TranslationKey) => string;" not in f_content and "t(" not in f_content and "import { TranslationKey" not in f_content:
            pass # Most of these windows already receive `t` or we'll inject it.
            # Let's verify:
            # BattleWindow gets `t`.
            # TutorialWindow does not!
            if "TutorialWindow.tsx" in full_path:
                f_content = f_content.replace("interface TutorialWindowProps {", "import { TranslationKey } from '../../constants/translations';\n\ninterface TutorialWindowProps {\n  t: (k: TranslationKey) => string;")
                f_content = f_content.replace("const TutorialWindow: React.FC<TutorialWindowProps> = ({ onClose }) => {", "const TutorialWindow: React.FC<TutorialWindowProps> = ({ onClose, t }) => {")
            # TournamentWindow ?
            if "TournamentWindow.tsx" in full_path:
                f_content = f_content.replace("interface TournamentWindowProps {", "import { TranslationKey } from '../../constants/translations';\n\ninterface TournamentWindowProps {\n  t: (k: TranslationKey) => string;")
                f_content = f_content.replace("const TournamentWindow: React.FC<TournamentWindowProps> = ({ session }) => {", "const TournamentWindow: React.FC<TournamentWindowProps> = ({ session, t }) => {")

        for old, new_ in replacements:
            f_content = f_content.replace(old, new_)

        with open(full_path, "w", encoding="utf-8") as f:
            f.write(f_content)

print("Batch 2 applied.")
