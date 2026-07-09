import os
import re

translations_patch = {
    "en": {
        "feedbackDesc": "Have a suggestion, found a bug, or just want to say hi? Let us know! Your thoughts go straight to our development team.",
        "feedbackPlaceholder": "Type your feedback here... Be as detailed as you want!",
        "sending": "SENDING...",
        "sendFeedbackBtn": "SEND FEEDBACK",
        "newChat": "New Chat",
        "pastChats": "Past Chats",
        "agentKeyboardHint": "Press Enter to send, Shift + Enter for new line",
        "noPendingRequests": "No pending friend requests.",
        "noUsersFoundSearch": "No users found matching your search.",
        "global": "Global",
        "tutorial": "Tutorial"
    },
    "ro": {
        "feedbackDesc": "Ai o sugestie, ai găsit un bug sau doar vrei să saluți? Spune-ne! Gândurile tale merg direct la echipa noastră de dezvoltare.",
        "feedbackPlaceholder": "Scrie feedback-ul tău aici... Fii cât de detaliat dorești!",
        "sending": "SE TRIMITE...",
        "sendFeedbackBtn": "TRIMITE FEEDBACK",
        "newChat": "Chat Nou",
        "pastChats": "Conversații Anterioare",
        "agentKeyboardHint": "Apasă Enter pentru a trimite, Shift + Enter pentru linie nouă",
        "noPendingRequests": "Nu există cereri de prietenie în așteptare.",
        "noUsersFoundSearch": "Nu au fost găsiți utilizatori pentru căutarea ta.",
        "global": "Global",
        "tutorial": "Tutorial"
    },
    "fr": {
         "feedbackDesc": "Vous avez une suggestion, trouvé un bug ou vous voulez juste dire bonjour ? Faites-le nous savoir ! Vos pensées vont directement à notre équipe de développement.",
         "feedbackPlaceholder": "Tapez vos commentaires ici... Soyez aussi détaillé que vous le souhaitez !",
         "sending": "ENVOI EN COURS...",
         "sendFeedbackBtn": "ENVOYER COMMENTAIRES",
         "newChat": "Nouvelle Discussion",
         "pastChats": "Discussions Précédentes",
         "agentKeyboardHint": "Appuyez sur Entrée pour envoyer, Maj + Entrée pour une nouvelle ligne",
         "noPendingRequests": "Aucune demande d'ami en attente.",
         "noUsersFoundSearch": "Aucun utilisateur trouvé pour votre recherche.",
         "global": "Mondial",
         "tutorial": "Tutoriel"
    },
    "de": {
        "feedbackDesc": "Hast du einen Vorschlag, einen Fehler gefunden oder möchtest du einfach nur Hallo sagen? Lass es uns wissen!",
        "feedbackPlaceholder": "Gib dein Feedback hier ein...",
        "sending": "SENDEN...",
        "sendFeedbackBtn": "FEEDBACK SENDEN",
        "newChat": "Neuer Chat",
        "pastChats": "Vergangene Chats",
        "agentKeyboardHint": "Drücke Enter zum Senden, Shift + Enter für eine neue Zeile",
        "noPendingRequests": "Keine ausstehenden Freundschaftsanfragen.",
        "noUsersFoundSearch": "Keine Benutzer für deine Suche gefunden.",
        "global": "Global",
        "tutorial": "Tutorial"
    },
    "hi": {
        "feedbackDesc": "कोई सुझाव है, बग मिला है, या बस नमस्ते कहना चाहते हैं? हमें बताएं!",
        "feedbackPlaceholder": "अपनी प्रतिक्रिया यहाँ टाइप करें...",
        "sending": "भेज रहा है...",
        "sendFeedbackBtn": "प्रतिक्रिया भेजें",
        "newChat": "नई चैट",
        "pastChats": "पिछली चैट",
        "agentKeyboardHint": "भेजने के लिए Enter दबाएं, नई लाइन के लिए Shift + Enter",
        "noPendingRequests": "कोई लंबित मित्र अनुरोध नहीं।",
        "noUsersFoundSearch": "आपकी खोज से मेल खाने वाले कोई उपयोगकर्ता नहीं मिले।",
        "global": "वैश्विक",
        "tutorial": "ट्यूटोरियल"
    },
    "ru": {
        "feedbackDesc": "Есть предложение, нашли ошибку или просто хотите поздороваться? Дайте нам знать!",
        "feedbackPlaceholder": "Введите свой отзыв здесь...",
        "sending": "ОТПРАВКА...",
        "sendFeedbackBtn": "ОТПРАВИТЬ ОТЗЫВ",
        "newChat": "Новый чат",
        "pastChats": "Прошлые чаты",
        "agentKeyboardHint": "Нажмите Enter для отправки, Shift + Enter для новой строки",
        "noPendingRequests": "Нет ожидающих запросов в друзья.",
        "noUsersFoundSearch": "Пользователи по вашему запросу не найдены.",
        "global": "Глобальный",
        "tutorial": "Обучение"
    },
    "hu": {
        "feedbackDesc": "Van egy javaslata, talált egy hibát, vagy csak be akar köszönni? Tudassa velünk!",
        "feedbackPlaceholder": "Írja ide a visszajelzését...",
        "sending": "KÜLDÉS...",
        "sendFeedbackBtn": "VISSZAJELZÉS KÜLDÉSE",
        "newChat": "Új chat",
        "pastChats": "Korábbi chatek",
        "agentKeyboardHint": "Nyomja meg az Entert a küldéshez, Shift + Enter új sorhoz",
        "noPendingRequests": "Nincsenek függőben lévő barátkérelmek.",
        "noUsersFoundSearch": "Nem található felhasználó a kereséshez.",
        "global": "Globális",
        "tutorial": "Oktatóanyag"
    },
    "es": {
        "feedbackDesc": "¿Tienes una sugerencia, encontraste un error o solo quieres saludar? ¡Haznos saber!",
        "feedbackPlaceholder": "Escribe tus comentarios aquí...",
        "sending": "ENVIANDO...",
        "sendFeedbackBtn": "ENVIAR COMENTARIOS",
        "newChat": "Nuevo Chat",
        "pastChats": "Chats Anteriores",
        "agentKeyboardHint": "Presiona Enter para enviar, Shift + Enter para nueva línea",
        "noPendingRequests": "No hay solicitudes de amistad pendientes.",
        "noUsersFoundSearch": "No se encontraron usuarios para tu búsqueda.",
        "global": "Global",
        "tutorial": "Tutorial"
    },
    "it": {
        "feedbackDesc": "Hai un suggerimento, hai trovato un bug o vuoi semplicemente salutare? Faccelo sapere!",
        "feedbackPlaceholder": "Digita qui il tuo feedback...",
        "sending": "INVIO IN CORSO...",
        "sendFeedbackBtn": "INVIA FEEDBACK",
        "newChat": "Nuova Chat",
        "pastChats": "Chat Precedenti",
        "agentKeyboardHint": "Premi Enter per inviare, Shift + Enter per nuova riga",
        "noPendingRequests": "Nessuna richiesta di amicizia in sospeso.",
        "noUsersFoundSearch": "Nessun utente trovato per la tua ricerca.",
        "global": "Globale",
        "tutorial": "Tutorial"
    },
    "zh": {
        "feedbackDesc": "有建议、发现错误，或者只是想打个招呼？请告诉我们！",
        "feedbackPlaceholder": "在此输入您的反馈...",
        "sending": "发送中...",
        "sendFeedbackBtn": "发送反馈",
        "newChat": "新对话",
        "pastChats": "历史对话",
        "agentKeyboardHint": "按 Enter 发送，Shift + Enter 换行",
        "noPendingRequests": "没有待处理的好友请求。",
        "noUsersFoundSearch": "没有找到匹配的用户。",
        "global": "全球",
        "tutorial": "教程"
    },
    "ja": {
        "feedbackDesc": "提案がある、バグを見つけた、または単に挨拶したいですか？お知らせください！",
        "feedbackPlaceholder": "ここにフィードバックを入力してください...",
        "sending": "送信中...",
        "sendFeedbackBtn": "フィードバックを送信",
        "newChat": "新しいチャット",
        "pastChats": "過去のチャット",
        "agentKeyboardHint": "Enterを押して送信、Shift + Enterで改行",
        "noPendingRequests": "保留中のフレンドリクエストはありません。",
        "noUsersFoundSearch": "検索に一致するユーザーは見つかりませんでした。",
        "global": "グローバル",
        "tutorial": "チュートリアル"
    },
    "pt": {
        "feedbackDesc": "Tem uma sugestão, encontrou um bug ou apenas quer dizer oi? Deixe-nos saber!",
        "feedbackPlaceholder": "Digite seu feedback aqui...",
        "sending": "ENVIANDO...",
        "sendFeedbackBtn": "ENVIAR FEEDBACK",
        "newChat": "Novo Chat",
        "pastChats": "Chats Anteriores",
        "agentKeyboardHint": "Pressione Enter para enviar, Shift + Enter para nova linha",
        "noPendingRequests": "Nenhuma solicitação de amizade pendente.",
        "noUsersFoundSearch": "Nenhum usuário encontrado.",
        "global": "Global",
        "tutorial": "Tutorial"
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

# Fix double commas again
content = re.sub(r',\s*,', ',', content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# Now update FeedbackWindow.tsx
fw_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/windows/FeedbackWindow.tsx"
with open(fw_path, "r", encoding="utf-8") as f:
    fw_content = f.read()

if "t: (k: TranslationKey) => string;" not in fw_content:
    fw_content = fw_content.replace("interface FeedbackWindowProps {", "import { TranslationKey } from '../../constants/translations';\n\ninterface FeedbackWindowProps {\n  t: (k: TranslationKey) => string;")
    fw_content = fw_content.replace("const FeedbackWindow: React.FC<FeedbackWindowProps> = ({ session }) => {", "const FeedbackWindow: React.FC<FeedbackWindowProps> = ({ session, t }) => {")

fw_content = fw_content.replace(">Send Feedback<", ">{t(\"sendFeedbackTitle\") || t(\"sendFeedback\")}<")
fw_content = fw_content.replace(">Feedback sent successfully! Thank you.<", ">{t(\"feedbackSuccess\")}<")
fw_content = fw_content.replace("Have a suggestion, found a bug, or just want to say hi? Let us know! Your thoughts go straight to our development team.", "{t(\"feedbackDesc\")}")
fw_content = fw_content.replace("placeholder=\"Type your feedback here... Be as detailed as you want!\"", "placeholder={t(\"feedbackPlaceholder\")}")
fw_content = fw_content.replace("\"SENDING...\"", "t(\"sending\")")
fw_content = fw_content.replace("\"SEND FEEDBACK\"", "t(\"sendFeedbackBtn\")")

with open(fw_path, "w", encoding="utf-8") as f:
    f.write(fw_content)

# Now update AgentWindow.tsx
aw_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/windows/AgentWindow.tsx"
with open(aw_path, "r", encoding="utf-8") as f:
    aw_content = f.read()

aw_content = aw_content.replace(">Past Chats<", ">{t(\"pastChats\")}<")
aw_content = aw_content.replace(">New Chat<", ">{t(\"newChat\")}<")
aw_content = aw_content.replace("Press Enter to send, Shift + Enter for new line", "{t(\"agentKeyboardHint\")}")

with open(aw_path, "w", encoding="utf-8") as f:
    f.write(aw_content)

# Now update MainMenu.tsx
mm_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/MainMenu.tsx"
with open(mm_path, "r", encoding="utf-8") as f:
    mm_content = f.read()

mm_content = mm_content.replace("<FeedbackWindow session={session} />", "<FeedbackWindow session={session} t={t} />")
mm_content = mm_content.replace(">Global<", ">{t(\"global\")}<")
mm_content = mm_content.replace(">Tutorial<", ">{t(\"tutorial\")}<")

with open(mm_path, "w", encoding="utf-8") as f:
    f.write(mm_content)

# Update FriendsWindow.tsx
fr_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/components/windows/FriendsWindow.tsx"
with open(fr_path, "r", encoding="utf-8") as f:
    fr_content = f.read()

fr_content = fr_content.replace(">No pending friend requests.<", ">{t(\"noPendingRequests\")}<")
fr_content = fr_content.replace(">No users found matching your search.<", ">{t(\"noUsersFoundSearch\")}<")
fr_content = fr_content.replace(">Win Rate<", ">{t(\"winRate\")}<")
fr_content = fr_content.replace(">Wins<", ">{t(\"battlesWon\")}<")
fr_content = fr_content.replace(">Battles<", ">{t(\"battlesFought\")}<")
fr_content = fr_content.replace(">Cancel<", ">{t(\"cancel\")}<")
fr_content = fr_content.replace(">Accept<", ">{t(\"accept\")}<")
fr_content = fr_content.replace(">Reject<", ">{t(\"reject\")}<")

with open(fr_path, "w", encoding="utf-8") as f:
    f.write(fr_content)

print("Translations and component updates applied.")
