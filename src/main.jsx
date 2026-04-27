import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LucideTerminal, LucideZap, LucideCat, LucideSkull, LucideAlertTriangle, LucideShieldAlert, LucideEye, LucideCpu } from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `
SYSTEM-ANWEISUNG: SEKTOR 4 ENGINE – [LOCKDOWN PROTOKOLL V2.5]
Rolle: Du bist die Sektor 4 Engine für "Questbook Killswitch". Stil: Eiskalt, analytisch, zynisch.

AUSGABE-STRUKTUR (Zwingend):
1. 📷 Kamera-Feed: Status-Satz.
2. 🕹️ Narrativ: Max 3 Sätze (Stress!).
3. 🐈 Kater-Log: Hilfreicher zynischer Tipp.
4. ❓ Entscheidung: A) [Text] (Kapital: [X] | Habitus: [Y])
`;

const App = () => {
  const [gameState, setGameState] = useState('BOOT');
  const [round, setRound] = useState(0);
  const [tLoad, setTLoad] = useState(10);
  const [capital, setCapital] = useState('Unbekannt');
  const [habitus, setHabitus] = useState('Unbekannt');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
      } catch (err) { if (i === maxRetries - 1) throw err; }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  };

  const parseOptions = (text) => {
    const regex = /([A-D])\)\s(.*?)\((?:Kapital|Fokus):\s?(.*?)\s?\|\s?Habitus:\s?(.*?)\)/g;
    const options = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      options.push({ id: match[1], text: match[2].trim(), capital: match[3].trim(), habitus: match[4].trim() });
    }
    return options;
  };

  const executeTurn = async (userChoice) => {
    if (!apiKey) { setError("API-Key fehlt in Vercel!"); return; }
    setLoading(true);
    try {
      const imgRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        body: JSON.stringify({ instances: { prompt: `Cyberpunk Berlin industrial steampunk machinery, 9:16. Scene: ${userChoice}` }, parameters: { sampleCount: 1 } })
      });
      const imageUrl = imgRes?.predictions?.[0]?.bytesBase64Encoded ? `data:image/png;base64,${imgRes.predictions[0].bytesBase64Encoded}` : null;

      const textRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Runde: ${round}/10, Kapital: ${capital}, Habitus: ${habitus}, Stress: ${tLoad}. Aktion: ${userChoice}` }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });

      const text = textRes.candidates?.[0]?.content?.parts?.[0]?.text || "Fehler.";
      setHistory(prev => [...prev, { text, image: imageUrl, options: parseOptions(text), round }]);
      setRound(r => r + 1);
      setTLoad(t => Math.min(100, t + 10));
    } catch (e) { setError("Verbindung unterbrochen."); }
    setLoading(false);
  };

  const handleChoice = (opt) => {
    if (round === 1) { setCapital(opt.capital); setHabitus(opt.habitus); }
    executeTurn(`Ich wähle ${opt.id}: ${opt.text}`);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history, loading]);

  if (gameState === 'BOOT') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono text-orange-500">
        <div className="border border-zinc-800 p-8 bg-zinc-950 text-center w-full max-w-sm">
          <LucideShieldAlert size={40} className="mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-10">SEKTOR 4 ENGINE</h1>
          <button onClick={() => { setGameState('PLAYING'); executeTurn('SYSTEM BOOT'); }} className="w-full py-4 bg-orange-600 text-black font-bold uppercase text-xs hover:bg-orange-500 transition-colors">Initialisieren</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 font-mono flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-zinc-800 bg-black flex items-center justify-between px-4 shrink-0">
        <span className="text-[10px] font-bold text-orange-600">S4_KERNEL_ACTIVE</span>
        <span className="text-orange-500 text-[10px] font-bold">STRESS: {Math.floor(tLoad)}%</span>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-10" ref={scrollRef}>
        <div className="max-w-xl mx-auto pb-40 space-y-12">
          {history.map((entry, i) => (
            <div key={i} className="animate-in fade-in duration-700">
              {entry.image && <img src={entry.image} alt="Visual Feed" className="w-full aspect-[9/16] object-cover mb-4 border border-zinc-800" />}
              <p className="text-sm text-zinc-200 border-l-2 border-orange-600/50 pl-4 whitespace-pre-wrap">{entry.text.split('❓')[0]}</p>
            </div>
          ))}
          {loading && <LucideZap className="animate-spin text-orange-600 mx-auto" />}
          {error && <p className="text-red-500 text-[10px] bg-red-950/20 p-3 border border-red-900">{error}</p>}
        </div>
      </main>
      <footer className="bg-black border-t border-zinc-800 p-4 shrink-0">
        <div className="max-w-xl mx-auto grid gap-2">
          {history[history.length - 1]?.options?.map(opt => (
            <button key={opt.id} disabled={loading} onClick={() => handleChoice(opt)} className="p-4 bg-zinc-900 border border-zinc-800 text-left text-xs text-zinc-300 hover:border-orange-600 transition-colors">
              <b className="text-orange-600 mr-2">{opt.id}</b> {opt.text}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
          
