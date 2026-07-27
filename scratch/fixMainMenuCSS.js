const fs = require('fs');

const path = 'src/components/MainMenu.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/root\.style\.setProperty\('--color-purple', isLightTheme \? '#7c3aed' : 'var\(--color-purple\)'\);/, "root.style.setProperty('--color-purple', isLightTheme ? '#7c3aed' : '#bd93f9');");
content = content.replace(/root\.style\.setProperty\('--color-blue', isLightTheme \? '#2563eb' : 'var\(--color-blue\)'\);/, "root.style.setProperty('--color-blue', isLightTheme ? '#2563eb' : '#38bdf8');");
content = content.replace(/root\.style\.setProperty\('--color-gold', isLightTheme \? '#d4af37' : 'var\(--color-gold\)'\);/, "root.style.setProperty('--color-gold', isLightTheme ? '#d4af37' : '#ffd700');");

// Let's also fix the panel/header backgrounds to be more visible on light mode
// AND fix the circular logic for dark mode by using removeProperty!
const oldBlock = `    root.style.setProperty('--header-bg', isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'var(--header-bg)');
    root.style.setProperty('--panel-bg', isLightTheme ? 'rgba(0, 0, 0, 0.03)' : 'var(--panel-bg)');
    root.style.setProperty('--panel-bg-hover', isLightTheme ? 'rgba(0, 0, 0, 0.06)' : 'var(--panel-bg-hover)');
    root.style.setProperty('--panel-border', isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'var(--panel-bg-hover)');`;

const newBlock = `    if (isLightTheme) {
      root.style.setProperty('--header-bg', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--panel-bg', 'rgba(0, 0, 0, 0.06)');
      root.style.setProperty('--panel-bg-hover', 'rgba(0, 0, 0, 0.12)');
      root.style.setProperty('--panel-border', 'rgba(0, 0, 0, 0.15)');
    } else {
      root.style.removeProperty('--header-bg');
      root.style.removeProperty('--panel-bg');
      root.style.removeProperty('--panel-bg-hover');
      root.style.removeProperty('--panel-border');
    }`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(path, content);
console.log('Fixed MainMenu circular CSS vars');
