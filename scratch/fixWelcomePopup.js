const fs = require('fs');
const file = 'C:/Programming/Projects/fix/CODEKNIGHTS/src/components/MainMenu.tsx';
let code = fs.readFileSync(file, 'utf8');

// Use regex to handle \r\n issues
const oldRegex = /const \[showWelcomePopup, setShowWelcomePopup\] = useState\(false\);\s*useEffect\(\(\) => \{\s*if \(typeof window !== "undefined" && status === "authenticated"\) \{\s*const seen = localStorage\.getItem\("ck-tutorial-seen"\);\s*if \(!seen\) \{\s*setShowWelcomePopup\(true\);\s*\}\s*\}\s*\}, \[status\]\);/;

const newStr = `const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated") {
      const hasUsername = session?.user && (session.user as any).username;
      if (hasUsername) {
        const seen = localStorage.getItem("ck-tutorial-seen");
        if (!seen) {
          setShowWelcomePopup(true);
        }
      }
    }
  }, [status, session]);`;

if (oldRegex.test(code)) {
    code = code.replace(oldRegex, newStr);
    fs.writeFileSync(file, code);
    console.log('Successfully updated the welcome popup logic!');
} else {
    console.log('Could not find the target code string in MainMenu.tsx');
}
