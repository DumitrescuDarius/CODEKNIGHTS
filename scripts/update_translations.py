import json
import re
import sys

translations_patch = {
    "en": {
        "exportSettings": "Export Settings", "importSettings": "Import Settings", "editorLabel": "EDITOR", "terminalLabel": "TERMINAL", "windowAngles": "Window Angles", "sharp": "Sharp", "slight": "Slight", "standard": "Standard", "rounded": "Rounded", "roundest": "Roundest", "windowGap": "Window Gap", "none": "None", "tight": "Tight", "loose": "Loose", "spacious": "Spacious", "windowBorder": "Window Border", "thin": "Thin", "thick": "Thick", "navbarStyle": "Navbar Style", "glass": "Glass", "solid": "Solid", "vimModeOn": "Vim Mode: ON", "vimModeOff": "Vim Mode: OFF", "vimModeDesc": "Enable Vim emulations.",
        "agentGreeting": "How can I help you with your code today?", "noFriendsAdded": "No friends added yet.", "accept": "Accept", "reject": "Reject", "remove": "Remove", "removeFriend": "Remove Friend", "typeToSearch": "Type at least 2 characters to search for users.", "sendFeedback": "Send Feedback", "feedbackSuccess": "Feedback sent successfully! Thank you.", "identifierTitle": "IDENTIFIER_TITLE", "addParticipant": "ADD_PARTICIPANT", "invite": "INVITE", "cancelInvite": "CANCEL", "duel": "DUEL!"
    },
    "ro": {
        "exportSettings": "Exportă Setări", "importSettings": "Importă Setări", "editorLabel": "EDITOR", "terminalLabel": "TERMINAL", "windowAngles": "Unghiuri Fereastră", "sharp": "Ascuțit", "slight": "Ușor", "standard": "Standard", "rounded": "Rotunjit", "roundest": "Foarte Rotunjit", "windowGap": "Spațiu Fereastră", "none": "Fără", "tight": "Strâns", "loose": "Lejer", "spacious": "Spațios", "windowBorder": "Margine Fereastră", "thin": "Subțire", "thick": "Gros", "navbarStyle": "Stil Bară Navigare", "glass": "Sticlă", "solid": "Solid", "vimModeOn": "Mod Vim: PORNIT", "vimModeOff": "Mod Vim: OPRIT", "vimModeDesc": "Activează emulările Vim.",
        "agentGreeting": "Cum te pot ajuta cu codul tău astăzi?", "noFriendsAdded": "Niciun prieten adăugat încă.", "accept": "Acceptă", "reject": "Refuză", "remove": "Elimină", "removeFriend": "Elimină Prieten", "typeToSearch": "Scrie cel puțin 2 caractere pentru a căuta utilizatori.", "sendFeedback": "Trimite Feedback", "feedbackSuccess": "Feedback trimis cu succes! Mulțumim.", "identifierTitle": "TITLU_IDENTIFICATOR", "addParticipant": "ADAUGĂ_PARTICIPANT", "invite": "INVITĂ", "cancelInvite": "ANULEAZĂ", "duel": "DUEL!"
    },
    "fr": {
        "exportSettings": "Exporter les paramètres", "importSettings": "Importer les paramètres", "editorLabel": "ÉDITEUR", "terminalLabel": "TERMINAL", "windowAngles": "Angles des fenêtres", "sharp": "Net", "slight": "Léger", "standard": "Standard", "rounded": "Arrondi", "roundest": "Très arrondi", "windowGap": "Espace des fenêtres", "none": "Aucun", "tight": "Serré", "loose": "Lâche", "spacious": "Spacieux", "windowBorder": "Bordure des fenêtres", "thin": "Fin", "thick": "Épais", "navbarStyle": "Style de la barre de navigation", "glass": "Verre", "solid": "Solide", "vimModeOn": "Mode Vim: ACTIF", "vimModeOff": "Mode Vim: INACTIF", "vimModeDesc": "Activer les émulations Vim.",
        "agentGreeting": "Comment puis-je vous aider avec votre code aujourd'hui ?", "noFriendsAdded": "Aucun ami ajouté pour le moment.", "accept": "Accepter", "reject": "Refuser", "remove": "Retirer", "removeFriend": "Retirer l'ami", "typeToSearch": "Tapez au moins 2 caractères pour rechercher des utilisateurs.", "sendFeedback": "Envoyer des commentaires", "feedbackSuccess": "Commentaires envoyés avec succès ! Merci.", "identifierTitle": "TITRE_IDENTIFIANT", "addParticipant": "AJOUTER_PARTICIPANT", "invite": "INVITER", "cancelInvite": "ANNULER", "duel": "DUEL !"
    },
    "de": {
        "exportSettings": "Einstellungen exportieren", "importSettings": "Einstellungen importieren", "editorLabel": "EDITOR", "terminalLabel": "TERMINAL", "windowAngles": "Fensterwinkel", "sharp": "Scharf", "slight": "Leicht", "standard": "Standard", "rounded": "Abgerundet", "roundest": "Sehr abgerundet", "windowGap": "Fensterabstand", "none": "Keiner", "tight": "Eng", "loose": "Locker", "spacious": "Geräumig", "windowBorder": "Fensterrahmen", "thin": "Dünn", "thick": "Dick", "navbarStyle": "Navigationsleisten-Stil", "glass": "Glas", "solid": "Fest", "vimModeOn": "Vim-Modus: EIN", "vimModeOff": "Vim-Modus: AUS", "vimModeDesc": "Vim-Emulationen aktivieren.",
        "agentGreeting": "Wie kann ich dir heute bei deinem Code helfen?", "noFriendsAdded": "Noch keine Freunde hinzugefügt.", "accept": "Akzeptieren", "reject": "Ablehnen", "remove": "Entfernen", "removeFriend": "Freund entfernen", "typeToSearch": "Geben Sie mindestens 2 Zeichen ein, um nach Benutzern zu suchen.", "sendFeedback": "Feedback senden", "feedbackSuccess": "Feedback erfolgreich gesendet! Danke.", "identifierTitle": "KENNUNG_TITEL", "addParticipant": "TEILNEHMER_HINZUFÜGEN", "invite": "EINLADEN", "cancelInvite": "ABBRECHEN", "duel": "DUELL!"
    },
    "hi": {
        "exportSettings": "सेटिंग्स निर्यात करें", "importSettings": "सेटिंग्स आयात करें", "editorLabel": "संपादक", "terminalLabel": "टर्मिनल", "windowAngles": "विंडो कोण", "sharp": "तेज़", "slight": "हल्का", "standard": "मानक", "rounded": "गोल", "roundest": "सबसे गोल", "windowGap": "विंडो गैप", "none": "कोई नहीं", "tight": "तंग", "loose": "ढीला", "spacious": "विशाल", "windowBorder": "विंडो सीमा", "thin": "पतला", "thick": "मोटा", "navbarStyle": "नेविगेशन बार शैली", "glass": "ग्लास", "solid": "ठोस", "vimModeOn": "विम मोड: चालू", "vimModeOff": "विम मोड: बंद", "vimModeDesc": "विम एमुलेशन सक्षम करें।",
        "agentGreeting": "आज मैं आपके कोड में आपकी कैसे मदद कर सकता हूँ?", "noFriendsAdded": "अभी तक कोई मित्र नहीं जोड़ा गया।", "accept": "स्वीकार करें", "reject": "अस्वीकार करें", "remove": "हटाएं", "removeFriend": "मित्र हटाएं", "typeToSearch": "उपयोगकर्ताओं को खोजने के लिए कम से कम 2 वर्ण टाइप करें।", "sendFeedback": "प्रतिक्रिया भेजें", "feedbackSuccess": "प्रतिक्रिया सफलतापूर्वक भेजी गई! धन्यवाद।", "identifierTitle": "पहचानकर्ता_शीर्षक", "addParticipant": "प्रतिभागी_जोड़ें", "invite": "आमंत्रित करें", "cancelInvite": "रद्द करें", "duel": "द्वंद्व!"
    },
    "ru": {
        "exportSettings": "Экспорт настроек", "importSettings": "Импорт настроек", "editorLabel": "РЕДАКТОР", "terminalLabel": "ТЕРМИНАЛ", "windowAngles": "Углы окна", "sharp": "Острые", "slight": "Слегка", "standard": "Стандартные", "rounded": "Закругленные", "roundest": "Сильно закругленные", "windowGap": "Зазор окна", "none": "Нет", "tight": "Узкий", "loose": "Свободный", "spacious": "Просторный", "windowBorder": "Рамка окна", "thin": "Тонкая", "thick": "Толстая", "navbarStyle": "Стиль панели", "glass": "Стекло", "solid": "Сплошной", "vimModeOn": "Режим Vim: ВКЛ", "vimModeOff": "Режим Vim: ВЫКЛ", "vimModeDesc": "Включить эмуляцию Vim.",
        "agentGreeting": "Чем я могу помочь вам с кодом сегодня?", "noFriendsAdded": "Друзья еще не добавлены.", "accept": "Принять", "reject": "Отклонить", "remove": "Удалить", "removeFriend": "Удалить друга", "typeToSearch": "Введите минимум 2 символа для поиска.", "sendFeedback": "Отправить отзыв", "feedbackSuccess": "Отзыв успешно отправлен! Спасибо.", "identifierTitle": "ЗАГОЛОВОК_ИДЕНТИФИКАТОРА", "addParticipant": "ДОБАВИТЬ_УЧАСТНИКА", "invite": "ПРИГЛАСИТЬ", "cancelInvite": "ОТМЕНА", "duel": "ДУЭЛЬ!"
    },
    "hu": {
        "exportSettings": "Beállítások exportálása", "importSettings": "Beállítások importálása", "editorLabel": "SZERKESZTŐ", "terminalLabel": "TERMINÁL", "windowAngles": "Ablak sarkok", "sharp": "Éles", "slight": "Enyhe", "standard": "Normál", "rounded": "Lekerekített", "roundest": "Nagyon lekerekített", "windowGap": "Ablak távolság", "none": "Nincs", "tight": "Szoros", "loose": "Laza", "spacious": "Tágas", "windowBorder": "Ablak keret", "thin": "Vékony", "thick": "Vastag", "navbarStyle": "Navigációs sáv stílus", "glass": "Üveg", "solid": "Tömör", "vimModeOn": "Vim mód: BE", "vimModeOff": "Vim mód: KI", "vimModeDesc": "Vim emulációk engedélyezése.",
        "agentGreeting": "Miben segíthetek ma a kódoddal?", "noFriendsAdded": "Még nincsenek barátok hozzáadva.", "accept": "Elfogad", "reject": "Elutasít", "remove": "Eltávolít", "removeFriend": "Barát eltávolítása", "typeToSearch": "Írjon be legalább 2 karaktert a kereséshez.", "sendFeedback": "Visszajelzés küldése", "feedbackSuccess": "Visszajelzés sikeresen elküldve! Köszönjük.", "identifierTitle": "AZONOSÍTÓ_CÍM", "addParticipant": "RÉSZTVEVŐ_HOZZÁADÁSA", "invite": "MEGHÍVÁS", "cancelInvite": "MÉGSE", "duel": "PÁRBAJ!"
    },
    "es": {
        "exportSettings": "Exportar ajustes", "importSettings": "Importar ajustes", "editorLabel": "EDITOR", "terminalLabel": "TERMINAL", "windowAngles": "Ángulos de ventana", "sharp": "Afilado", "slight": "Ligero", "standard": "Estándar", "rounded": "Redondeado", "roundest": "Muy redondeado", "windowGap": "Espacio de ventana", "none": "Ninguno", "tight": "Apretado", "loose": "Suelto", "spacious": "Espacioso", "windowBorder": "Borde de ventana", "thin": "Delgado", "thick": "Grueso", "navbarStyle": "Estilo de barra de navegación", "glass": "Cristal", "solid": "Sólido", "vimModeOn": "Modo Vim: ENCENDIDO", "vimModeOff": "Modo Vim: APAGADO", "vimModeDesc": "Habilitar emulaciones Vim.",
        "agentGreeting": "¿En qué puedo ayudarte con tu código hoy?", "noFriendsAdded": "Aún no hay amigos agregados.", "accept": "Aceptar", "reject": "Rechazar", "remove": "Eliminar", "removeFriend": "Eliminar amigo", "typeToSearch": "Escribe al menos 2 caracteres para buscar usuarios.", "sendFeedback": "Enviar comentarios", "feedbackSuccess": "¡Comentarios enviados con éxito! Gracias.", "identifierTitle": "TÍTULO_IDENTIFICADOR", "addParticipant": "AÑADIR_PARTICIPANTE", "invite": "INVITAR", "cancelInvite": "CANCELAR", "duel": "¡DUELO!"
    },
    "it": {
        "exportSettings": "Esporta impostazioni", "importSettings": "Importa impostazioni", "editorLabel": "EDITOR", "terminalLabel": "TERMINALE", "windowAngles": "Angoli finestra", "sharp": "Spigoloso", "slight": "Leggero", "standard": "Standard", "rounded": "Arrotondato", "roundest": "Molto arrotondato", "windowGap": "Spazio finestra", "none": "Nessuno", "tight": "Stretto", "loose": "Largo", "spacious": "Spazioso", "windowBorder": "Bordo finestra", "thin": "Sottile", "thick": "Spesso", "navbarStyle": "Stile barra di navigazione", "glass": "Vetro", "solid": "Solido", "vimModeOn": "Modalità Vim: ON", "vimModeOff": "Modalità Vim: OFF", "vimModeDesc": "Abilita emulazioni Vim.",
        "agentGreeting": "Come posso aiutarti con il tuo codice oggi?", "noFriendsAdded": "Nessun amico aggiunto ancora.", "accept": "Accetta", "reject": "Rifiuta", "remove": "Rimuovi", "removeFriend": "Rimuovi amico", "typeToSearch": "Digita almeno 2 caratteri per cercare utenti.", "sendFeedback": "Invia feedback", "feedbackSuccess": "Feedback inviato con successo! Grazie.", "identifierTitle": "TITOLO_IDENTIFICATORE", "addParticipant": "AGGIUNGI_PARTECIPANTE", "invite": "INVITA", "cancelInvite": "ANNULLA", "duel": "DUELLO!"
    },
    "zh": {
        "exportSettings": "导出设置", "importSettings": "导入设置", "editorLabel": "编辑器", "terminalLabel": "终端", "windowAngles": "窗口圆角", "sharp": "直角", "slight": "微圆", "standard": "标准", "rounded": "圆角", "roundest": "超圆", "windowGap": "窗口间距", "none": "无", "tight": "紧凑", "loose": "宽松", "spacious": "宽敞", "windowBorder": "窗口边框", "thin": "细", "thick": "粗", "navbarStyle": "导航栏样式", "glass": "毛玻璃", "solid": "纯色", "vimModeOn": "Vim 模式：开", "vimModeOff": "Vim 模式：关", "vimModeDesc": "启用 Vim 模拟。",
        "agentGreeting": "今天我能在代码上帮到你什么吗？", "noFriendsAdded": "暂无好友。", "accept": "接受", "reject": "拒绝", "remove": "移除", "removeFriend": "删除好友", "typeToSearch": "输入至少2个字符以搜索用户。", "sendFeedback": "发送反馈", "feedbackSuccess": "反馈发送成功！谢谢。", "identifierTitle": "标识符_标题", "addParticipant": "添加_参与者", "invite": "邀请", "cancelInvite": "取消", "duel": "对决！"
    },
    "ja": {
        "exportSettings": "設定のエクスポート", "importSettings": "設定のインポート", "editorLabel": "エディタ", "terminalLabel": "ターミナル", "windowAngles": "ウィンドウの角", "sharp": "シャープ", "slight": "少し丸い", "standard": "標準", "rounded": "丸い", "roundest": "とても丸い", "windowGap": "ウィンドウの隙間", "none": "なし", "tight": "狭い", "loose": "広い", "spacious": "とても広い", "windowBorder": "ウィンドウの境界線", "thin": "細い", "thick": "太い", "navbarStyle": "ナビゲーションバーのスタイル", "glass": "ガラス", "solid": "ソリッド", "vimModeOn": "Vimモード：オン", "vimModeOff": "Vimモード：オフ", "vimModeDesc": "Vimエミュレーションを有効にします。",
        "agentGreeting": "今日はコードについてどうお手伝いしましょうか？", "noFriendsAdded": "フレンドはまだ追加されていません。", "accept": "承認", "reject": "拒否", "remove": "削除", "removeFriend": "フレンドを削除", "typeToSearch": "ユーザーを検索するには、少なくとも2文字入力してください。", "sendFeedback": "フィードバックを送信", "feedbackSuccess": "フィードバックが正常に送信されました！ありがとうございます。", "identifierTitle": "識別子のタイトル", "addParticipant": "参加者を追加", "invite": "招待する", "cancelInvite": "キャンセル", "duel": "デュエル！"
    },
    "pt": {
        "exportSettings": "Exportar Configurações", "importSettings": "Importar Configurações", "editorLabel": "EDITOR", "terminalLabel": "TERMINAL", "windowAngles": "Ângulos da Janela", "sharp": "Afiado", "slight": "Leve", "standard": "Padrão", "rounded": "Arredondado", "roundest": "Muito Arredondado", "windowGap": "Espaço da Janela", "none": "Nenhum", "tight": "Apertado", "loose": "Solto", "spacious": "Espaçoso", "windowBorder": "Borda da Janela", "thin": "Fino", "thick": "Grosso", "navbarStyle": "Estilo da Barra de Navegação", "glass": "Vidro", "solid": "Sólido", "vimModeOn": "Modo Vim: LIGADO", "vimModeOff": "Modo Vim: DESLIGADO", "vimModeDesc": "Habilitar emulações Vim.",
        "agentGreeting": "Como posso ajudar com seu código hoje?", "noFriendsAdded": "Nenhum amigo adicionado ainda.", "accept": "Aceitar", "reject": "Rejeitar", "remove": "Remover", "removeFriend": "Remover Amigo", "typeToSearch": "Digite pelo menos 2 caracteres para buscar usuários.", "sendFeedback": "Enviar Feedback", "feedbackSuccess": "Feedback enviado com sucesso! Obrigado.", "identifierTitle": "TÍTULO_IDENTIFICADOR", "addParticipant": "ADICIONAR_PARTICIPANTE", "invite": "CONVIDAR", "cancelInvite": "CANCELAR", "duel": "DUELO!"
    }
}

file_path = "/home/darius/Programming/Projects/CODEKNIGHTS/src/constants/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

for lang, words in translations_patch.items():
    # Find the language block: 'lang: { ... },'
    # We will insert the words right before the closing brace of the language.
    # regex to find the end of the language block
    pattern = r"(" + lang + r": \{)(.*?)(\n\s*\},?)"
    
    match = re.search(pattern, content, flags=re.DOTALL)
    if match:
        prefix = match.group(1)
        inner = match.group(2)
        suffix = match.group(3)
        
        # Build the new string
        new_inner = inner
        for key, value in words.items():
            if f"{key}:" not in inner:
                new_inner += f', {key}: "{value}"'
                
        # Replace in content
        content = content[:match.start()] + prefix + new_inner + suffix + content[match.end():]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Translations updated successfully.")
