```react
import React, { useState, useEffect, useRef } from 'react';
import { LucideTerminal, LucideZap, LucideCat, LucideSkull, LucideAlertTriangle, LucideShieldAlert, LucideEye, LucideCpu, LucideChevronRight } from 'lucide-react';

/**
 * SEKTOR 4 ENGINE - [PROTOTYP V2.5]
 * Autor der Vorlage: Murat Zengin
 */

// Falls du dies auf GitHub hochlädst, nutze: import.meta.env.VITE_GEMINI_API_KEY
const apiKey = "AIzaSyDVjbQP-QgBKJ4e-soNxJp-zD2fXiecrts"; 

const SYSTEM_PROMPT = `
SYSTEM-ANWEISUNG: SEKTOR 4 ENGINE – [LOCKDOWN PROTOKOLL V2.5]
Du bist ein deterministisches Inferenz-System. Stil: Eiskalt, analytisch, zynisch.

AUSGABE-REIHENFOLGE (STRIKT):
1. 📷 Kamera-Feed: Technischer Status-Satz.
2. 🕹️ Narrativ: Max. 3 Sätze (Zeitdruck!).
3. 🐈 Kater-Log: 1-2 zynische Sätze (Hilfestellung!).
4. ❓ Entscheidung: 2-4 Optionen. 
   Format: A) [Text] (Kapital: [X] | Habitus: [Y])
5. === HUD ===
`;

const App = () => {
  const [gameState, setGameState] = useState('BOOT');
  const [round, setRound] = useState(0);
  const [tLoad, setTLoad] = useState(10);
  const [capital, setCapital] = useState('Ausstehend');
  const [habitus, setHabitus] = useState('Ausstehend');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
    throw new Error("Verbindung verloren.");
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
    setLoading(true);
    setError(null);
    try {
      // 1. Imagen 4 - Bild
      const imgPrompt = `Cyberpunk-Steampunk Berlin. Industrial machinery, mechanical animals, rusty textures. 9:16 aspect. ${round >= 8 ? 'Digital glitch code artifacts.' : ''} Scene: ${userChoice}`;
      const imgRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
        method: 'POST',
        body: JSON.stringify({ instances: { prompt: imgPrompt }, parameters: { sampleCount: 1 } })
      });
      const imageUrl = imgRes.predictions?.[0]?.bytesBase64Encoded ? `data:image/png;base64,${imgRes.predictions[0].bytesBase64Encoded}` : null;

      // 2. Gemini 2.5 Flash - Text
      const context = `Runde: ${round}/10, Kapital: ${capital}, Habitus: ${habitus}, Stress: ${tLoad}. Aktion: ${userChoice}`;
      const textRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });

      const text = textRes.candidates?.[0]?.content?.parts?.[0]?.text || "Systemfehler.";
      const options = parseOptions(text);

      setHistory(prev => [...prev, { text, image: imageUrl, options, round }]);
      setRound(r => r + 1);
      setTLoad(t => Math.min(100, t + 8 + Math.floor(Math.random() * 5)));
    } catch (err) {
      setError("Mainframe-Timeout. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (opt) => {
    if (round === 1) { setCapital(opt.capital); setHabitus(opt.habitus); }
    executeTurn(`Ich wähle ${opt.id}: ${opt.text}`);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  if (gameState === 'BOOT') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono text-orange-500">
        <div className="max-w-md w-full border border-zinc-800 p-10 bg-zinc-950 shadow-[0_0_60px_rgba(234,88,12,0.15)]">
          <LucideShieldAlert size={40} className="mb-6 animate-pulse" />
          <h1 className="text-4xl font-black tracking-tighter mb-2">SEKTOR 4</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] mb-12 text-zinc-600">Questbook Killswitch Engine</p>
          <button 
            onClick={() => { setGameState('PLAYING'); executeTurn('SYSTEM BOOT'); }}
            className="w-full py-5 bg-orange-600 text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-all active:scale-95"
          >
            System-Initialisierung
          </button>
        </div>
      </div>
    );
  }

  const lastEntry = history[history.length - 1];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-400 font-mono flex flex-col h-screen overflow-hidden">
      {/* HUD Header */}
      <header className="h-14 border-b border-zinc-800 bg-black flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <LucideCpu size={16} className="text-orange-600 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest">S4_CORE_V2.5</span>
        </div>
        <div className="flex gap-6 text-[10px] uppercase font-bold">
          <div className="flex flex-col items-end">
            <span className="text-orange-500">T-LOAD: {Math.floor(tLoad)}%</span>
            <div className="w-16 h-1 bg-zinc-900 mt-1">
              <div className="h-full bg-orange-600 transition-all duration-1000" style={{width: `${tLoad}%`}} />
            </div>
          </div>
          <span className="text-zinc-600">RUNDE {Math.min(10, round)}/10</span>
        </div>
      </header>

      {/* Main Flow */}
      <main className="flex-1 overflow-y-auto p-4 space-y-12 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-950/10 via-transparent to-transparent" ref={scrollRef}>
        <div className="max-w-2xl mx-auto pb-60 space-y-16">
          {history.map((entry, i) => (
            <div key={i} className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
              {entry.image && (
                <div className="mb-8 border border-zinc-800 bg-black p-1 shadow-2xl">
                  <img src={entry.image} alt="Visual Feed" className="w-full aspect-video object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
                  <div className="flex justify-between items-center p-2 bg-zinc-900/50">
                    <span className="text-[8px] uppercase text-zinc-600 tracking-[0.2em]">Live_Capture_S4</span>
                    <LucideEye size={10} className="text-orange-600" />
                  </div>
                </div>
              )}
              <div className="border-l-2 border-orange-600/20 pl-8 space-y-6">
                <p className="text-sm md:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap selection:bg-orange-500 selection:text-black">
                  {entry.text.split('❓')[0]}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-4 text-orange-600 py-10 animate-pulse">
              <LucideZap size={20} className="animate-spin" />
              <span className="text-[10px] uppercase tracking-[0.5em]">Daten-Inferenz läuft...</span>
            </div>
          )}
          {error && <div className="p-4 border border-red-500/30 bg-red-950/10 text-red-500 text-xs flex items-center gap-3"><LucideAlertTriangle size={16}/> {error}</div>}
        </div>
      </main>

      {/* Decision Footer */}
      <footer className="bg-black/95 backdrop-blur-md border-t border-zinc-800 p-6 shrink-0 z-50">
        <div className="max-w-2xl mx-auto">
          {tLoad >= 100 ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-500">
              <LucideSkull size={48} className="text-red-600 mx-auto animate-bounce" />
              <h2 className="text-xl font-black text-red-600 uppercase tracking-widest">System Killswitch</h2>
              <p className="text-[10px] text-zinc-600 italic">Die Simulation wurde aufgrund kritischer Stresswerte terminiert.</p>
              <button onClick={() => window.location.reload()} className="px-8 py-2 border border-zinc-800 text-[10px] uppercase text-zinc-500 hover:text-white hover:border-white transition-all">Reboot</button>
            </div>
          ) : round > 10 ? (
             <div className="text-center py-6 text-green-600 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest">Validierung Abgeschlossen</p>
                <p className="text-[10px] text-zinc-500 italic">// Autor: Murat Zengin</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastEntry?.options?.map((opt) => (
                <button
                  key={opt.id}
                  disabled={loading}
                  onClick={() => handleChoice(opt)}
                  className="group relative p-5 bg-zinc-900/30 border border-zinc-800 hover:border-orange-600 transition-all text-left flex gap-5 disabled:opacity-20 active:scale-[0.98]"
                >
                  <span className="text-orange-600 font-black text-sm shrink-0">{opt.id}</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-zinc-300 leading-snug group-hover:text-white font-medium">{opt.text}</p>
                    <span className="text-[8px] uppercase text-zinc-600 tracking-tighter">Fokus: {opt.capital} | {opt.habitus}</span>
                  </div>
                </button>
              )) || (!loading && (
                <div className="col-span-full py-8 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-700 animate-pulse">Warten auf Mainframe-Impuls...</div>
              ))}
            </div>
          )}
        </div>
      </footer>

      {/* Retro Overlays */}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <div className="absolute top-0 w-full h-[2px] bg-orange-500/10 animate-[scan_6s_linear_infinite]" />
      </div>
      <style>{`@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }`}</style>
    </div>
  );
};

export default App;

```
