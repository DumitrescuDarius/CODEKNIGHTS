import re

with open("src/constants/translations.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Add translation tokens to English
content = content.replace(
    'notesTitle: "Notes"',
    'notesTitle: "Notes", maximize: "Maximize", restore: "Restore", moveLeft: "Move left", moveRight: "Move right", close: "Close"'
)

# Replace in MainMenu.tsx
with open("src/components/MainMenu.tsx", "r", encoding="utf-8") as f:
    main_menu = f.read()

main_menu = main_menu.replace(
    'title={isMax ? "Restore" : "Maximize"}',
    'title={isMax ? t("restore" as any) : t("maximize" as any)}'
)
main_menu = main_menu.replace(
    'title="Move left"',
    'title={t("moveLeft" as any)}'
)
main_menu = main_menu.replace(
    'title="Move right"',
    'title={t("moveRight" as any)}'
)
main_menu = main_menu.replace(
    'title="Close"',
    'title={t("close" as any)}'
)

with open("src/constants/translations.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/components/MainMenu.tsx", "w", encoding="utf-8") as f:
    f.write(main_menu)
