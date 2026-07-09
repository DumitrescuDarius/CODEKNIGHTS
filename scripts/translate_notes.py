import os
import re

translations_patch = {
    "en": {
        "newWorkspace": "New Workspace", "newBtn": "NEW", "hideWorkspaces": "Hide Workspaces", "showWorkspaces": "Show Workspaces",
        "deleteWorkspace": "Delete workspace", "newNote": "New Note", "titlePlaceholder": "Title...", "deleteNote": "Delete note", "takeNotePlaceholder": "Take a note..."
    },
    "ro": {
        "newWorkspace": "Spațiu de Lucru Nou", "newBtn": "NOU", "hideWorkspaces": "Ascunde Spațiile de Lucru", "showWorkspaces": "Arată Spațiile de Lucru",
        "deleteWorkspace": "Șterge spațiul de lucru", "newNote": "Notă Nouă", "titlePlaceholder": "Titlu...", "deleteNote": "Șterge nota", "takeNotePlaceholder": "Ia o notiță..."
    },
    "fr": {
        "newWorkspace": "Nouvel Espace de Travail", "newBtn": "NOUVEAU", "hideWorkspaces": "Masquer les Espaces", "showWorkspaces": "Afficher les Espaces",
        "deleteWorkspace": "Supprimer l'espace", "newNote": "Nouvelle Note", "titlePlaceholder": "Titre...", "deleteNote": "Supprimer la note", "takeNotePlaceholder": "Prendre une note..."
    },
    "de": {
        "newWorkspace": "Neuer Arbeitsbereich", "newBtn": "NEU", "hideWorkspaces": "Arbeitsbereiche ausblenden", "showWorkspaces": "Arbeitsbereiche anzeigen",
        "deleteWorkspace": "Arbeitsbereich löschen", "newNote": "Neue Notiz", "titlePlaceholder": "Titel...", "deleteNote": "Notiz löschen", "takeNotePlaceholder": "Notiz schreiben..."
    },
    "hi": {
        "newWorkspace": "नया कार्यस्थान", "newBtn": "नया", "hideWorkspaces": "कार्यस्थान छिपाएं", "showWorkspaces": "कार्यस्थान दिखाएं",
        "deleteWorkspace": "कार्यस्थान हटाएं", "newNote": "नया नोट", "titlePlaceholder": "शीर्षक...", "deleteNote": "नोट हटाएं", "takeNotePlaceholder": "एक नोट लिखें..."
    },
    "ru": {
        "newWorkspace": "Новое Рабочее Пространство", "newBtn": "НОВОЕ", "hideWorkspaces": "Скрыть пространства", "showWorkspaces": "Показать пространства",
        "deleteWorkspace": "Удалить пространство", "newNote": "Новая Заметка", "titlePlaceholder": "Название...", "deleteNote": "Удалить заметку", "takeNotePlaceholder": "Сделать заметку..."
    },
    "hu": {
        "newWorkspace": "Új Munkaterület", "newBtn": "ÚJ", "hideWorkspaces": "Munkaterületek Elrejtése", "showWorkspaces": "Munkaterületek Megjelenítése",
        "deleteWorkspace": "Munkaterület törlése", "newNote": "Új Jegyzet", "titlePlaceholder": "Cím...", "deleteNote": "Jegyzet törlése", "takeNotePlaceholder": "Írjon egy jegyzetet..."
    },
    "es": {
        "newWorkspace": "Nuevo Espacio de Trabajo", "newBtn": "NUEVO", "hideWorkspaces": "Ocultar Espacios", "showWorkspaces": "Mostrar Espacios",
        "deleteWorkspace": "Eliminar espacio", "newNote": "Nueva Nota", "titlePlaceholder": "Título...", "deleteNote": "Eliminar nota", "takeNotePlaceholder": "Tomar una nota..."
    },
    "it": {
        "newWorkspace": "Nuovo Spazio di Lavoro", "newBtn": "NUOVO", "hideWorkspaces": "Nascondi Spazi", "showWorkspaces": "Mostra Spazi",
        "deleteWorkspace": "Elimina spazio", "newNote": "Nuova Nota", "titlePlaceholder": "Titolo...", "deleteNote": "Elimina nota", "takeNotePlaceholder": "Prendi una nota..."
    },
    "zh": {
        "newWorkspace": "新工作区", "newBtn": "新建", "hideWorkspaces": "隐藏工作区", "showWorkspaces": "显示工作区",
        "deleteWorkspace": "删除工作区", "newNote": "新笔记", "titlePlaceholder": "标题...", "deleteNote": "删除笔记", "takeNotePlaceholder": "记笔记..."
    },
    "ja": {
        "newWorkspace": "新しいワークスペース", "newBtn": "新規", "hideWorkspaces": "ワークスペースを隠す", "showWorkspaces": "ワークスペースを表示",
        "deleteWorkspace": "ワークスペースを削除", "newNote": "新しいノート", "titlePlaceholder": "タイトル...", "deleteNote": "ノートを削除", "takeNotePlaceholder": "ノートを取る..."
    },
    "pt": {
        "newWorkspace": "Nova Área de Trabalho", "newBtn": "NOVO", "hideWorkspaces": "Ocultar Áreas", "showWorkspaces": "Mostrar Áreas",
        "deleteWorkspace": "Excluir área de trabalho", "newNote": "Nova Nota", "titlePlaceholder": "Título...", "deleteNote": "Excluir nota", "takeNotePlaceholder": "Fazer uma anotação..."
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
        ('title="New Workspace"', 'title={t("newWorkspace")}'),
        ("> NEW", "> {t(\"newBtn\")} "),
        ('title={showSidebar ? "Hide Workspaces" : "Show Workspaces"}', 'title={showSidebar ? t("hideWorkspaces") : t("showWorkspaces")}'),
        ('title="Delete workspace"', 'title={t("deleteWorkspace")}'),
        (' New Note', ' {t("newNote")}'),
        ('placeholder="Title..."', 'placeholder={t("titlePlaceholder")}'),
        ('title="Delete note"', 'title={t("deleteNote")}'),
        ('placeholder="Take a note..."', 'placeholder={t("takeNotePlaceholder")}')
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

print("Notes translations applied.")
