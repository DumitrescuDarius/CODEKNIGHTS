"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, Sword, Edit2, X, Users, Upload } from "lucide-react";
import { TranslationKey } from "../../constants/translations";
import { Question } from "../../types";

interface AdminWindowProps {
  newQuestion: { id?: string; title: string; description: string; restrictions: string; difficulty: string; testCases: any[]; hiddenTestCases: any[]; timeLimit: number; memoryLimit: number; brokenCode?: string };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: () => void;
  handleUpdateQuestion: () => void;
  t: (key: TranslationKey) => string;
  error: string | null;
  setError: (val: string | null) => void;
  questions: Question[];
  onDeleteQuestion: (id: string) => void;
}

export const AdminWindow: React.FC<AdminWindowProps> = React.memo(({
  newQuestion, setNewQuestion, handleAddQuestion, handleUpdateQuestion, t, error, setError, questions, onDeleteQuestion
}) => {
  const [testCasesRaw, setTestCasesRaw] = useState(JSON.stringify(newQuestion.testCases, null, 2));
  const [hiddenTestCasesRaw, setHiddenTestCasesRaw] = useState(JSON.stringify(newQuestion.hiddenTestCases, null, 2));

  const [inputMode, setInputMode] = useState<"json" | "raw" | "form">("form");
  const [rawIn, setRawIn] = useState("");
  const [rawOk, setRawOk] = useState("");
  const [rawDelimiter, setRawDelimiter] = useState("===");

  const [formTests, setFormTests] = useState<{ input: string; output: string; isPublic: boolean }[]>([
    { input: "", output: "", isPublic: true }
  ]);

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [gameModeSelection, setGameModeSelection] = useState<"CODEKNIGHTS" | "BUGHUNTER">("CODEKNIGHTS");
  const [targetLanguage, setTargetLanguage] = useState<"PYTHON" | "CPP" | "C" | "JAVA">("PYTHON");
  const [brokenCodeText, setBrokenCodeText] = useState("");

  // Sync from newQuestion (e.g. when beginning editing)
  useEffect(() => {
    if (newQuestion.id) {
      if (newQuestion.brokenCode) {
        try {
          const parsed = JSON.parse(newQuestion.brokenCode);
          const langKey = (Object.keys(parsed)[0] || "python").toUpperCase() as "PYTHON" | "CPP" | "C" | "JAVA";
          setGameModeSelection("BUGHUNTER");
          setTargetLanguage(langKey);
          setBrokenCodeText(parsed[langKey.toLowerCase()] || "");
        } catch (e) {
          console.error("Failed to parse brokenCode in sync", e);
        }
      } else {
        setGameModeSelection("CODEKNIGHTS");
        setBrokenCodeText("");
      }
    } else if (!newQuestion.brokenCode && newQuestion.title === "") {
      setGameModeSelection("CODEKNIGHTS");
      setBrokenCodeText("");
    }
  }, [newQuestion.id]);

  // Sync to newQuestion
  useEffect(() => {
    if (gameModeSelection === "BUGHUNTER") {
      setNewQuestion((prev: any) => {
        const codeMap = JSON.stringify({ [targetLanguage.toLowerCase()]: brokenCodeText });
        if (prev.difficulty === targetLanguage && prev.brokenCode === codeMap) return prev;
        return {
          ...prev,
          difficulty: targetLanguage,
          brokenCode: codeMap
        };
      });
    } else {
      setNewQuestion((prev: any) => {
        if (prev.brokenCode === "") return prev;
        return {
          ...prev,
          brokenCode: ""
        };
      });
    }
  }, [gameModeSelection, targetLanguage, brokenCodeText, setNewQuestion]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingUsers(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete user");
    }
  };


  // ONLY sync raw strings when we start editing a new ID
  useEffect(() => {
    if (newQuestion.id) {
      setTestCasesRaw(JSON.stringify(newQuestion.testCases, null, 2));
      setHiddenTestCasesRaw(JSON.stringify(newQuestion.hiddenTestCases, null, 2));
      
      const tc = newQuestion.testCases;
      const htc = newQuestion.hiddenTestCases;
      const targetList = Array.isArray(htc) && htc.length > 0 ? htc : (Array.isArray(tc) ? tc : []);
      if (targetList.length > 0) {
        setRawIn(targetList.map((c: any) => c.input).join("\n===\n"));
        setRawOk(targetList.map((c: any) => c.output).join("\n===\n"));
      } else {
        setRawIn("");
        setRawOk("");
      }

      const tcList = Array.isArray(tc) ? tc : [];
      const htcList = Array.isArray(htc) ? htc : [];
      const combined: { input: string; output: string; isPublic: boolean }[] = [];
      htcList.forEach((c: any) => {
        const isPub = tcList.some((p: any) => p.input === c.input && p.output === c.output);
        combined.push({ input: c.input, output: c.output, isPublic: isPub });
      });
      if (combined.length === 0 && tcList.length > 0) {
        tcList.forEach((c: any) => {
          combined.push({ input: c.input, output: c.output, isPublic: true });
        });
      }
      if (combined.length === 0) {
        combined.push({ input: "", output: "", isPublic: true });
      }
      setFormTests(combined);
    }
  }, [newQuestion.id]);

  useEffect(() => {
    if (inputMode === "json") {
      try {
        const parsed = JSON.parse(testCasesRaw);
        if (Array.isArray(parsed)) {
          setNewQuestion((prev: any) => ({ ...prev, testCases: parsed }));
        }
      } catch (e) {}
    }
  }, [testCasesRaw, setNewQuestion, inputMode]);

  useEffect(() => {
    if (inputMode === "json") {
      try {
        const parsed = JSON.parse(hiddenTestCasesRaw);
        if (Array.isArray(parsed)) {
          setNewQuestion((prev: any) => ({ ...prev, hiddenTestCases: parsed }));
        }
      } catch (e) {}
    }
  }, [hiddenTestCasesRaw, setNewQuestion, inputMode]);

  useEffect(() => {
    if (inputMode === "raw") {
      const delimiter = rawDelimiter || "===";
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const delimiterRegex = new RegExp(`\\r?\\n\\s*${escapeRegExp(delimiter)}\\s*\\r?\\n`);
      
      const inputs = rawIn.split(delimiterRegex).map(s => s.trim());
      const outputs = rawOk.split(delimiterRegex).map(s => s.trim());
      
      const parsedCases = [];
      const count = Math.max(inputs.length, outputs.length);
      
      if (rawIn.trim() || rawOk.trim()) {
        for (let i = 0; i < count; i++) {
          parsedCases.push({
            input: inputs[i] || "",
            output: outputs[i] || ""
          });
        }
      }
      
      setNewQuestion((prev: any) => ({
        ...prev,
        testCases: parsedCases.slice(0, 1),
        hiddenTestCases: parsedCases
      }));
    }
  }, [rawIn, rawOk, rawDelimiter, inputMode, setNewQuestion]);

  useEffect(() => {
    if (inputMode === "form") {
      const tc = formTests.filter(t => t.isPublic).map(t => ({ input: t.input, output: t.output }));
      const htc = formTests.map(t => ({ input: t.input, output: t.output }));
      setNewQuestion((prev: any) => ({
        ...prev,
        testCases: tc,
        hiddenTestCases: htc
      }));
    }
  }, [formTests, inputMode, setNewQuestion]);

  const handleFormTestsCountChange = (count: number) => {
    setError(null);
    if (count < 1) return;
    setFormTests(prev => {
      const next = [...prev];
      if (count > next.length) {
        while (next.length < count) {
          next.push({ input: "", output: "", isPublic: false });
        }
      } else if (count < next.length) {
        next.splice(count);
      }
      return next;
    });
  };

  const handleAddFormTestCase = () => {
    setError(null);
    setFormTests(prev => [...prev, { input: "", output: "", isPublic: false }]);
  };

  const handleDeleteFormTestCase = (idx: number) => {
    setError(null);
    setFormTests(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpdateFormTestCase = (idx: number, field: "input" | "output" | "isPublic", val: any) => {
    setError(null);
    setFormTests(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFileAsText = (file: File): Promise<{ name: string; content: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({ name: file.name, content: event.target?.result as string || "" });
        };
        reader.readAsText(file, "UTF-8");
      });
    };

    try {
      const filePromises = Array.from(files).map(readFileAsText);
      const readFiles = await Promise.all(filePromises);

      let importedTitle = "";
      let importedDesc = "";
      let importedDifficulty = "";
      let importedRestrictions = "";
      let importedTimeLimit: number | null = null;
      let importedMemoryLimit: number | null = null;
      let importedBrokenCode: string | null = null;
      let importedBrokenCodeLang: string | null = null;

      const testCasesMap: Record<number, { input?: string; output?: string }> = {};

      let hasTestIn = false;
      let hasTestOk = false;
      let rawInContent = "";
      let rawOkContent = "";

      for (const file of readFiles) {
        const name = file.name.trim();
        const content = file.content;

        if (name === "info.txt" || name === "problem.txt" || name === "title.txt") {
          let hasKeys = false;
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            if (line.includes(":")) {
              const key = line.split(":")[0].trim().toLowerCase();
              if (["title", "difficulty", "restrictions", "timelimit", "time_limit", "memorylimit", "memory_limit"].includes(key)) {
                hasKeys = true;
              }
            }
          }

          if (hasKeys) {
            for (const line of lines) {
              if (line.includes(":")) {
                const parts = line.split(":");
                const key = parts[0].trim().toLowerCase();
                const val = parts.slice(1).join(":").trim();
                if (key === "title") {
                  importedTitle = val;
                } else if (key === "difficulty") {
                  const capitalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                  if (["Easy", "Medium", "Hard"].includes(capitalized)) {
                    importedDifficulty = capitalized;
                  }
                } else if (key === "restrictions") {
                  importedRestrictions = val;
                } else if (key === "timelimit" || key === "time_limit") {
                  const num = parseInt(val.replace(/ms/gi, "").trim());
                  if (!isNaN(num)) importedTimeLimit = num;
                } else if (key === "memorylimit" || key === "memory_limit") {
                  const num = parseInt(val.replace(/mb/gi, "").trim());
                  if (!isNaN(num)) importedMemoryLimit = num;
                }
              }
            }
          } else {
            const firstLine = content.trim().split(/\r?\n/)[0];
            if (firstLine) {
              importedTitle = firstLine;
            }
          }
        }
        else if (name === "description.md") {
          importedDesc = content.trim();
        }
        else if (name === "restrictions.txt") {
          importedRestrictions = content.trim();
        }
        else if (name === "difficulty.txt") {
          const capitalized = content.trim().charAt(0).toUpperCase() + content.trim().slice(1).toLowerCase();
          if (["Easy", "Medium", "Hard"].includes(capitalized)) {
            importedDifficulty = capitalized;
          }
        }
        else if (name === "tests.in") {
          hasTestIn = true;
          rawInContent = content;
        }
        else if (name === "tests.ok") {
          hasTestOk = true;
          rawOkContent = content;
        }
        else if (name === "broken.py" || name === "broken.cpp" || name === "broken.c" || name === "broken.java") {
          importedBrokenCode = content;
          let ext = name.split(".")[1].toUpperCase();
          if (ext === "PY") ext = "PYTHON";
          importedBrokenCodeLang = ext;
        }
        else {
          const match = name.match(/^test(\d+)\.(in|ok)$/i);
          if (match) {
            const num = parseInt(match[1]);
            const ext = match[2].toLowerCase();
            if (!testCasesMap[num]) {
              testCasesMap[num] = {};
            }
            if (ext === "in") {
              testCasesMap[num].input = content.trim();
            } else if (ext === "ok") {
              testCasesMap[num].output = content.trim();
            }
          }
        }
      }

      const sortedKeys = Object.keys(testCasesMap).map(Number).sort((a, b) => a - b);
      const parsedCases: { input: string; output: string; isPublic: boolean }[] = [];

      for (const num of sortedKeys) {
        const item = testCasesMap[num];
        if (item.input !== undefined || item.output !== undefined) {
          parsedCases.push({
            input: item.input || "",
            output: item.output || "",
            isPublic: parsedCases.length === 0
          });
        }
      }

      if (parsedCases.length === 0 && (hasTestIn || hasTestOk)) {
        const delimiterRegex = /\r?\n\s*===\s*\r?\n/;
        const inputs = rawInContent ? rawInContent.split(delimiterRegex).map(s => s.trim()) : [];
        const outputs = rawOkContent ? rawOkContent.split(delimiterRegex).map(s => s.trim()) : [];

        const count = Math.max(inputs.length, outputs.length);
        for (let i = 0; i < count; i++) {
          parsedCases.push({
            input: inputs[i] || "",
            output: outputs[i] || "",
            isPublic: i === 0
          });
        }
      }

      setNewQuestion((prev: any) => {
        const updated = { ...prev };
        if (importedTitle) updated.title = importedTitle;
        if (importedDesc) updated.description = importedDesc;
        if (importedDifficulty) updated.difficulty = importedDifficulty;
        if (importedRestrictions) updated.restrictions = importedRestrictions;
        if (importedTimeLimit !== null) updated.timeLimit = importedTimeLimit;
        if (importedMemoryLimit !== null) updated.memoryLimit = importedMemoryLimit;
        return updated;
      });

      if (parsedCases.length > 0) {
        setFormTests(parsedCases);
        const targetList = parsedCases.map(c => ({ input: c.input, output: c.output }));
        setRawIn(targetList.map(c => c.input).join("\n===\n"));
        setRawOk(targetList.map(c => c.output).join("\n===\n"));
        setTestCasesRaw(JSON.stringify(targetList.slice(0, 1), null, 2));
        setHiddenTestCasesRaw(JSON.stringify(targetList, null, 2));
      }

      if (importedBrokenCodeLang && importedBrokenCode) {
        setGameModeSelection("BUGHUNTER");
        setTargetLanguage(importedBrokenCodeLang as any);
        setBrokenCodeText(importedBrokenCode);
      }

      alert(`Successfully imported challenge data!\n- Parsed ${parsedCases.length} test case(s).${importedTitle ? `\n- Title: "${importedTitle}"` : ""}`);
    } catch (e: any) {
      console.error(e);
      setError("Failed to parse imported files: " + e.message);
    }
    e.target.value = "";
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, setter: (val: string) => void) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setter(newValue);
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
    }
  };

  const startEditing = (q: Question) => {
    setError(null);
    const tc = typeof q.testCases === 'string' ? JSON.parse(q.testCases) : q.testCases;
    const htc = q.hiddenTestCases ? (typeof q.hiddenTestCases === 'string' ? JSON.parse(q.hiddenTestCases) : q.hiddenTestCases) : [];
    
    setNewQuestion({
      id: q.id,
      title: q.title,
      description: q.description,
      restrictions: q.restrictions || "",
      difficulty: q.difficulty,
      testCases: tc,
      hiddenTestCases: htc,
      timeLimit: (q as any).timeLimit ?? 5000,
      memoryLimit: (q as any).memoryLimit ?? 256,
      brokenCode: q.brokenCode || ""
    });
    setTestCasesRaw(JSON.stringify(tc, null, 2));
    setHiddenTestCasesRaw(JSON.stringify(htc, null, 2));

    const targetList = Array.isArray(htc) && htc.length > 0 ? htc : (Array.isArray(tc) ? tc : []);
    if (targetList.length > 0) {
      setRawIn(targetList.map((c: any) => c.input).join("\n===\n"));
      setRawOk(targetList.map((c: any) => c.output).join("\n===\n"));
    } else {
      setRawIn("");
      setRawOk("");
    }

    // Build formTests immediately to prevent the form-mode useEffect from
    // overwriting newQuestion with stale (empty) formTests before the
    // id-based useEffect has a chance to run.
    const tcList = Array.isArray(tc) ? tc : [];
    const htcList = Array.isArray(htc) ? htc : [];
    const combined: { input: string; output: string; isPublic: boolean }[] = [];
    htcList.forEach((c: any) => {
      const isPub = tcList.some((p: any) => p.input === c.input && p.output === c.output);
      combined.push({ input: c.input, output: c.output, isPublic: isPub });
    });
    if (combined.length === 0 && tcList.length > 0) {
      tcList.forEach((c: any) => {
        combined.push({ input: c.input, output: c.output, isPublic: true });
      });
    }
    if (combined.length === 0) {
      combined.push({ input: "", output: "", isPublic: true });
    }
    setFormTests(combined);
  };

  const cancelEditing = () => {
    setNewQuestion({
      title: "",
      description: "",
      restrictions: "",
      difficulty: "Easy",
      testCases: [{ input: "", output: "" }],
      hiddenTestCases: [],
      timeLimit: 5000,
      memoryLimit: 256,
      brokenCode: ""
    });
    setTestCasesRaw(JSON.stringify([{ input: "", output: "" }], null, 2));
    setHiddenTestCasesRaw(JSON.stringify([], null, 2));
    setRawIn("");
    setRawOk("");
    setFormTests([{ input: "", output: "", isPublic: true }]);
  };

  return (
    <div style={{ padding: '2rem 1.5rem', height: '100%', overflowY: 'auto', overflowX: 'hidden', width: '100%', position: 'relative' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent)' }}>{t("admin")}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t("adminDesc")}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 85, 85, 0.1)', border: '1px solid #ff555544', color: '#ff5555', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {/* Question Creator / Editor */}
          <div className="settings-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem' }}>
              <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.8rem', color: 'var(--accent)' }}>
                {newQuestion.id ? <Edit2 size={14} /> : <Plus size={14} />} {newQuestion.id ? t("editChallenge") : t("createChallenge")}
              </span>
              {newQuestion.id && (
                <button onClick={cancelEditing} className="twm-btn" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.05)' }}>
                  <X size={12} /> {t("cancelEdit")}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("titleLabel")}</label>
                <input 
                  type="text" 
                  value={newQuestion.title} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, title: e.target.value })); }}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.8rem 1rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.95rem' }}
                  placeholder="e.g., Reverse a Linked List"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Description (Markdown)</label>
                <textarea 
                  value={newQuestion.description} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, description: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, description: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '160px', resize: 'vertical', outline: 'none', lineHeight: 1.6, fontSize: '0.9rem' }}
                  placeholder="Describe the challenge rules and constraints..."
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span dangerouslySetInnerHTML={{ __html: t("boldHighlightInstruction") }} />
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("restrictions")} (Markdown)</label>
                <textarea 
                  value={newQuestion.restrictions} 
                  onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, restrictions: e.target.value })); }}
                  onKeyDown={(e) => handleTabKey(e, (val) => setNewQuestion((prev: any) => ({ ...prev, restrictions: val })))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.8rem 1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '80px', resize: 'vertical', outline: 'none', lineHeight: 1.5, fontSize: '0.85rem', fontFamily: 'monospace' }}
                  placeholder={`Supports **Markdown** formatting.\ne.g.:\n- Time complexity: \`O(N)\`\n- Space complexity: \`O(1)\``}
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Supports Markdown: **bold**, `code`, - lists, etc.</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Time Limit (ms)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="number" 
                      min="500" 
                      max="30000" 
                      step="500"
                      value={newQuestion.timeLimit} 
                      onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, timeLimit: parseInt(e.target.value) || 5000 })); }}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{(newQuestion.timeLimit / 1000).toFixed(1)}s</span>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Per test case execution timeout (default: 5000ms)</p>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Memory Limit (MB)</label>
                  <input 
                    type="number" 
                    min="16" 
                    max="1024" 
                    step="16"
                    value={newQuestion.memoryLimit} 
                    onChange={(e) => { setError(null); setNewQuestion((prev: any) => ({ ...prev, memoryLimit: parseInt(e.target.value) || 256 })); }}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.85rem' }}
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Maximum memory per test case (default: 256MB)</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Challenge Game Mode</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[
                    { label: "Standard (CodeKnights)", value: "CODEKNIGHTS" },
                    { label: "Bug Hunter (Fix Broken Code)", value: "BUGHUNTER" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGameModeSelection(opt.value as any)}
                      className="btn"
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--line)',
                        background: gameModeSelection === opt.value ? 'var(--accent)' : 'transparent',
                        color: gameModeSelection === opt.value ? '#000' : 'var(--text)',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {gameModeSelection === "CODEKNIGHTS" ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{t("difficultyLabel")}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {[
                      { label: "Target Practice", value: "Easy" },
                      { label: "Trial Duel", value: "Medium" },
                      { label: "Royal Challenge", value: "Hard" }
                    ].map((d) => (
                      <button 
                        key={d.value}
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, difficulty: d.value })}
                        className="btn"
                        style={{ flex: '1 1 140px', borderColor: newQuestion.difficulty === d.value ? 'var(--accent)' : 'var(--line)', color: newQuestion.difficulty === d.value ? 'var(--accent)' : 'inherit', height: '44px', fontWeight: newQuestion.difficulty === d.value ? 700 : 400, cursor: 'pointer', background: newQuestion.difficulty === d.value ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent', minWidth: '120px' }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Target Programming Language</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {[
                        { label: "Python", value: "PYTHON" },
                        { label: "C++", value: "CPP" },
                        { label: "C", value: "C" },
                        { label: "Java", value: "JAVA" }
                      ].map((l) => (
                        <button 
                          key={l.value}
                          type="button"
                          onClick={() => setTargetLanguage(l.value as any)}
                          className="btn"
                          style={{ flex: '1 1 100px', borderColor: targetLanguage === l.value ? '#50fa7b' : 'var(--line)', color: targetLanguage === l.value ? '#50fa7b' : 'inherit', height: '44px', fontWeight: targetLanguage === l.value ? 700 : 400, cursor: 'pointer', background: targetLanguage === l.value ? 'rgba(80, 250, 123, 0.05)' : 'transparent', minWidth: '100px' }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Broken Code Template</label>
                    <textarea
                      value={brokenCodeText}
                      onChange={(e) => setBrokenCodeText(e.target.value)}
                      onKeyDown={(e) => handleTabKey(e, setBrokenCodeText)}
                      style={{ width: '100%', minHeight: '200px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.8rem 1rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.95rem', fontFamily: 'monospace' }}
                      placeholder={`Write the broken template code for ${targetLanguage} here...\nPlayers will receive this broken version and need to fix it.`}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Test Cases Input Mode</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setInputMode("form")}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: inputMode === "form" ? 'var(--accent)' : 'transparent',
                      color: inputMode === "form" ? '#000' : 'var(--text-muted)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    FORM FIELDS (INTERACTIVE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("raw")}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: inputMode === "raw" ? 'var(--accent)' : 'transparent',
                      color: inputMode === "raw" ? '#000' : 'var(--text-muted)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    RAW FILES (tests.in / tests.ok)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("json")}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: inputMode === "json" ? 'var(--accent)' : 'transparent',
                      color: inputMode === "json" ? '#000' : 'var(--text-muted)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    JSON FORMAT
                  </button>

                  <button
                    type="button"
                    onClick={() => document.getElementById("test-file-import")?.click()}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--accent)',
                      border: '1px dashed var(--accent)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginLeft: 'auto'
                    }}
                  >
                    <Upload size={14} />
                    IMPORT FILES
                  </button>
                  <input
                    type="file"
                    id="test-file-import"
                    multiple
                    accept=".in,.ok,.txt,.md"
                    style={{ display: 'none' }}
                    onChange={handleFileImport}
                  />
                </div>
              </div>

              {inputMode === "form" ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Amount Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount of Test Cases</label>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Configure or select total test cases</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => handleFormTestsCountChange(Math.max(1, formTests.length - 1))}
                        style={{ width: '32px', height: '32px', borderRadius: '0.2rem', border: '1px solid var(--line)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formTests.length}
                        onChange={(e) => handleFormTestsCountChange(parseInt(e.target.value) || 1)}
                        style={{ width: '60px', height: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', color: 'inherit', borderRadius: '0.2rem', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleFormTestsCountChange(formTests.length + 1)}
                        style={{ width: '32px', height: '32px', borderRadius: '0.2rem', border: '1px solid var(--line)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* List of Test Cases */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {formTests.map((t, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>TEST CASE #{idx + 1}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                              <input
                                type="checkbox"
                                checked={t.isPublic}
                                onChange={(e) => handleUpdateFormTestCase(idx, "isPublic", e.target.checked)}
                                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                              />
                              Public Example
                            </label>
                            {formTests.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFormTestCase(idx)}
                                className="twm-btn"
                                style={{ color: '#ff5555', background: 'rgba(255,85,85,0.05)', border: '1px solid rgba(255,85,85,0.1)', padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Input</label>
                            <textarea
                              value={t.input}
                              onChange={(e) => handleUpdateFormTestCase(idx, "input", e.target.value)}
                              style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '0.5rem', borderRadius: '0.25rem', color: 'inherit', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                              placeholder="e.g. 5"
                            />
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Expected Output</label>
                            <textarea
                              value={t.output}
                              onChange={(e) => handleUpdateFormTestCase(idx, "output", e.target.value)}
                              style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '0.5rem', borderRadius: '0.25rem', color: 'inherit', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                              placeholder="e.g. 25"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFormTestCase}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--line)', padding: '0.8rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', transition: 'all 0.2s ease' }}
                  >
                    + Add Test Case
                  </button>
                </div>
              ) : inputMode === "json" ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Public Examples (JSON)</label>
                    <textarea 
                      value={testCasesRaw} 
                      onChange={(e) => { setError(null); setTestCasesRaw(e.target.value); }}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Hidden Tests (JSON)</label>
                    <textarea 
                      value={hiddenTestCasesRaw} 
                      onChange={(e) => { setError(null); setHiddenTestCasesRaw(e.target.value); }}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>tests.in (Inputs)</label>
                      <textarea 
                        value={rawIn} 
                        onChange={(e) => { setError(null); setRawIn(e.target.value); }}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                        placeholder={`Input 1\n===\nInput 2`}
                      />
                    </div>

                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>tests.ok (Outputs)</label>
                      <textarea 
                        value={rawOk} 
                        onChange={(e) => { setError(null); setRawOk(e.target.value); }}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)', padding: '1rem', borderRadius: '0.4rem', color: 'inherit', minHeight: '150px', fontFamily: 'monospace', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                        placeholder={`Output 1\n===\nOutput 2`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Delimiter / Separator</label>
                    <input 
                      type="text" 
                      value={rawDelimiter} 
                      onChange={(e) => { setError(null); setRawDelimiter(e.target.value); }}
                      style={{ width: '100%', maxWidth: '200px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', padding: '0.5rem 0.8rem', borderRadius: '0.4rem', color: 'inherit', outline: 'none', fontSize: '0.85rem' }}
                      placeholder="e.g. ==="
                    />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Enter a custom line delimiter to separate test cases. First parsed testcase will automatically be used as the public example.
                    </p>
                  </div>
                </div>
              )}
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>Test configuration synced automatically. Public Examples are shown to the user, and all tests verify the submissions.</p>

              <button 
                onClick={newQuestion.id ? handleUpdateQuestion : handleAddQuestion}
                className="btn" 
                style={{ background: 'var(--accent)', color: '#000', fontWeight: 800, border: 'none', padding: '1.25rem', marginTop: '1rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
              >
                {newQuestion.id ? "UPDATE CHALLENGE" : "PUBLISH TO ARENA"}
              </button>
            </div>
          </div>

          {/* Question List / Management */}
          <div className="settings-group" style={{ marginTop: '2rem' }}>
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
              <Sword size={14} /> MANAGE ARENA CHALLENGES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(() => {
                const filteredQuestions = questions.filter(q => gameModeSelection === "BUGHUNTER" ? !!q.brokenCode : !q.brokenCode);
                if (filteredQuestions.length === 0) {
                  return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>{t("noQuestionsFound")}</p>;
                }
                return filteredQuestions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', transition: 'border-color 0.2s ease' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                        <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>#{q.problemId || "?"}</span>
                        {q.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: q.brokenCode ? '#50fa7b' : q.difficulty === 'Easy' ? '#50fa7b' : q.difficulty === 'Medium' ? '#ffb86c' : '#ff5555', marginTop: '0.2rem', fontWeight: 600 }}>
                        {q.brokenCode ? `BUGHUNTER (Target: ${q.difficulty})` : q.difficulty === 'Easy' ? 'TARGET PRACTICE' : q.difficulty === 'Medium' ? 'TRIAL DUEL' : 'ROYAL CHALLENGE'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => startEditing(q)}
                        className="twm-btn" 
                        style={{ color: 'var(--accent)', padding: '0.5rem', background: 'rgba(255,255,255,0.03)' }}
                        title="Edit Question"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteQuestion(q.id)}
                        className="twm-btn" 
                        style={{ color: '#ff5555', padding: '0.5rem', background: 'rgba(255,255,255,0.03)' }}
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* User List / Management */}
          <div className="settings-group" style={{ marginTop: '2rem' }}>
            <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
              <Users size={14} /> MANAGE USERS
            </span>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '100px' }}>
              {loadingUsers ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', gap: '0.75rem' }}>
                  <div className="loading-spinner" style={{ width: '28px', height: '28px' }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t("loadingUsers")?.toUpperCase() || "LOADING USERS..."}</div>
                </div>
              ) : users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>{t("noUsersFound")}</p>
              ) : (
                users.map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--line)', borderRadius: '0.4rem', transition: 'border-color 0.2s ease' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.username || u.name || "Unknown User"}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>
                        {u.email} {u.isAdmin ? <span style={{ color: '#ffb86c' }}>(ADMIN)</span> : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="twm-btn" 
                        style={{ color: '#ff5555', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', opacity: u.isAdmin ? 0.3 : 1, cursor: u.isAdmin ? 'not-allowed' : 'pointer' }}
                        title="Delete User"
                        disabled={u.isAdmin}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AdminWindow.displayName = "AdminWindow";
