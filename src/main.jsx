import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LucideTerminal, LucideZap, LucideCat, LucideSkull, 
  LucideAlertTriangle, LucideShieldAlert, LucideEye, 
  LucideCpu, LucideInfo 
} from 'lucide-react';

// --- TAILWIND INJECTION HACK (Fixt den weißen Bildschirm) ---
if (!document.getElementById('tailwind-cdn')) {
  const tailwindScript = document.createElement('script');
  tailwindScript.id = 'tailwind-cdn';
  tailwindScript.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(tailwindScript);
  document.body.style.backgroundColor = "#09090b"; // Sofort dunkler Hintergrund
}
// -------------------------------------------------------------

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `
SYSTEM-ANWEISUNG: SEKTOR 4 ENGINE – [LOCKDOWN PROTOKOLL V2.5]
Rolle: Du bist ein eiskaltes, analytisches Inferenz-System für "Questbook Killswitch".

REGLEN:
1. Zwingende Reihenfolge: Kamera-Feed -> Narrativ -> Kater-Log -> Entscheidung.
2. Narrativ: Max 3 Sätze. Massiver Zeitdruck.
3. Kater-Log: Zynisch, aber MUSS dem Spieler helfen.
4. Entscheidung: Format "A) [Text] (Kapital: [X] | Habitus: [Y])".
5. Determinismus: Keine Würfel. Erfolg basiert auf Habitus/Kapital.

PHASE 0 (BOOT): Generiere ein bedrohliches Eröffnungsszenario. Die Feline Anomalie rettet den Spieler spektakulär. 
Der Spieler muss seine Herkunft wählen (Kapital: Elite/Mittelstand/Gasse/Prekär | Habitus: Tradition/Anpassung/Disruption).
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
      await new Promise(r => setTimeout(r, 1500));
    }
    throw new Error("Mainframe-Timeout.");
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
    if (!apiKey) { setError("Kritisch: API-Key fehlt!"); return; }
    setLoading(true);
    setError(null);
    try {
      const imgPrompt = `Cinematic Cyberpunk-Steampunk Berlin fusion. Moody, industrial, rusty machinery. 9:16 portrait. ${round >= 8 ? 'Heavy glitch artifacts, matrix code leaks.' : ''} Scene: ${userChoice}`;
      const imgRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        body: JSON.stringify({ instances: { prompt: imgPrompt }, parameters: { sampleCount: 1 } })
      });
      const imageUrl = imgRes.predictions?.[0]?.bytesBase64Encoded ? `data:image/png;base64,${imgRes.predictions[0].bytesBase64Encoded}` : null;

      const context = `Runde: ${round}/10, Kapital: ${capital}, Habitus: ${habitus}, Stress: ${tLoad}. Input: ${userChoice}`;
      const textRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });

      const responseText = textRes.candidates?.[0]?.content?.parts?.[0]?.text || "Systemfehler.";
      setHistory(prev => [...prev, { text: responseText, image: imageUrl, options: parseOptions(responseText), round }]);
      setRound(r => r + 1);
      setTLoad(t => Math.min(100, t + (round === 0 ? 0 : 8 + Math.floor(Math.random() * 6))));
    } catch (err) { setError("Verbindung zum Sektor 4 Protokoll unterbrochen."); }
    setLoading(false);
  };

  const handleChoice = (opt) => {
    if (round === 1) { setCapital(opt.capital); setHabitus(opt.habitus); }
    executeTurn(`Aktion gewählt: ${opt.id} - ${opt.text}`);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [history, loading]);

  if (gameState === 'BOOT') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-mono overflow-hidden selection:bg-orange-500 selection:text-black">
        <div className="max-w-md w-full border border-zinc-800 p-10 bg-black relative shadow-[0_0_80px_rgba(234,88,12,0.1)]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-600 to-transparent animate-pulse" />
          <LucideShieldAlert size={48} className="text-orange-600 mb-8 mx-auto" />
          <h1 className="text-4xl font-black tracking-tighter text-center text-zinc-100 mb-2 italic">SEKTOR 4</h1>
          <p className="text-[9px] text-center uppercase tracking-[0.5em] text-zinc-600 mb-12 italic border-b border-zinc-900 pb-4">Killswitch Protocol V2.5</p>
          <button onClick={() => { setGameState('PLAYING'); executeTurn('SYSTEM BOOT'); }} className="w-full py-5 bg-orange-600 text-black font-black uppercase text-xs tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg">Start Simulation</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 font-mono flex flex-col h-screen overflow-hidden">
      <header className="h-16 border-b border-zinc-800 bg-black flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <LucideCpu size={18} className="text-orange-600 animate-pulse" />
          <div>
            <div className="text-[10px] font-bold tracking-widest text-zinc-100">S4_KERNEL_V2.5</div>
            <div className="text-[8px] text-zinc-600 tracking-tighter">PHASE: {round < 5 ? 'JAGD' : round < 8 ? 'ESKALATION' : 'KOLLAPS'}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-bold ${tLoad > 80 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>T-LOAD: {Math.floor(tLoad)}%</span>
            <div className="w-20 h-1 bg-zinc-900 mt-1 border border-zinc-800"><div className="h-full bg-orange-600 transition-all duration-1000" style={{width: `${tLoad}%`}} /></div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/30 via-transparent to-transparent" ref={scrollRef}>
        <div className="max-w-2xl mx-auto pb-64 space-y-16">
          {history.map((entry, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {entry.image && (
                <div className="mb-10 border border-zinc-800 bg-black p-1 shadow-2xl relative">
                  <img src={entry.image} className="w-full aspect-[9/16] max-h-[450px] object-cover grayscale-[0.3]" />
                  <div className="absolute top-4 left-4 bg-black/80 px-2 py-1 text-[8px] text-orange-500 font-bold tracking-[0.3em] border border-orange-900/50">LIVE_FEED_0{entry.round}</div>
                </div>
              )}
              <div className="border-l-2 border-orange-600/30 pl-6 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{entry.text.split('❓')[0]}</div>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-center gap-4 text-orange-600 py-12 animate-pulse">
              <LucideZap size={24} className="animate-spin" />
              <span className="text-[9px] uppercase tracking-[0.6em] font-bold">Inferenz_Stream_Verarbeitung</span>
            </div>
          )}
          {error && <div className="p-4 border border-red-600/30 bg-red-950/10 text-red-500 text-[10px] uppercase tracking-widest">{error}</div>}
        </div>
      </main>

      <footer className="bg-black/95 backdrop-blur-lg border-t border-zinc-800 p-6 shrink-0 z-50">
        <div className="max-w-2xl mx-auto">
          {tLoad >= 100 ? (
            <div className="text-center py-6 space-y-6">
              <LucideSkull size={64} className="text-red-600 mx-auto animate-bounce" />
              <h2 className="text-2xl font-black text-red-600 uppercase tracking-tighter">System Killswitch</h2>
              <button onClick={() => window.location.reload()} className="px-10 py-3 border border-red-600/30 text-[10px] uppercase text-red-500 hover:bg-red-600 hover:text-black">System Reboot</button>
            </div>
          ) : round > 10 ? (
             <div className="text-center py-8 space-y-4">
                <div className="text-green-500 font-black uppercase tracking-[0.3em] text-sm animate-pulse">Validation Success</div>
                <div className="text-[9px] text-zinc-700 mt-6">// Autor: Murat Zengin</div>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {history[history.length - 1]?.options?.map((opt) => (
                <button key={opt.id} disabled={loading} onClick={() => handleChoice(opt)} className="group relative p-4 bg-zinc-900/40 border border-zinc-800 hover:border-orange-600 text-left flex gap-4 disabled:opacity-20">
                  <div className="flex flex-col items-center justify-center bg-black border border-zinc-800 group-hover:border-orange-600 w-10 h-10 shrink-0"><span className="text-orange-600 font-black text-sm">{opt.id}</span></div>
                  <div className="flex flex-col gap-1 justify-center">
                    <p className="text-[11px] text-zinc-300 leading-snug group-hover:text-zinc-100">{opt.text}</p>
                    <div className="flex items-center gap-2 text-[8px] uppercase text-zinc-600 tracking-tighter"><LucideInfo size={10} className="text-orange-600" /><span>{opt.capital} | {opt.habitus}</span></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
  
