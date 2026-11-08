'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Sparkles, RefreshCw, Bookmark, BookmarkCheck, 
  Keyboard, Compass, Mic, Atom, BookOpen, Grid, Layers, ArrowRight, ArrowLeft
} from 'lucide-react';

interface Upasarga {
  sanskrit: string;
  iast: string;
  meaning: string;
  nuance: string;
}

interface Dhatu {
  sanskrit: string;
  iast: string;
  meaning: string;
  gana: string;
  type: 'nama' | 'kriya'; // nominal noun root vs verb root
}

interface SuffixResult {
  sanskrit: string;
  iast: string;
  meaning: string;
  context: string;
}

interface VibhaktiRow {
  name: string;
  sanskritName: string;
  meaning: string;
  forms: [string, string, string];
}

const UPASARGAS: Upasarga[] = [
  { sanskrit: "प्र", iast: "pra", meaning: "forth, forward, intensive", nuance: "Denotes motion forward, excess, or preeminence in action." },
  { sanskrit: "आ", iast: "ā", meaning: "towards, until, all around", nuance: "Indicates reversal, limitation, or expansive movement towards an object." },
  { sanskrit: "सम्", iast: "sam", meaning: "together, complete, thorough", nuance: "Signifies perfection, association, or unification of forces." },
  { sanskrit: "वि", iast: "vi", meaning: "apart, distinct, intense separation", nuance: "Implies distribution, analysis, variance, or special excellence." },
  { sanskrit: "प्रति", iast: "prati", meaning: "against, towards, back, every", nuance: "Represents reflection, opposition, reciprocity, or repetition." },
  { sanskrit: "अनु", iast: "anu", meaning: "along, after, following", nuance: "Denotes imitation, succession, subordination, or continuity." },
  { sanskrit: "उत्", iast: "ut", meaning: "up, upwards, out", nuance: "Signifies elevation, emergence, or sudden release of energy." },
  { sanskrit: "परि", iast: "pari", meaning: "around, fully, about", nuance: "Indicates encirclement, completeness, or exhaustive transformation." },
  { sanskrit: "नि", iast: "ni", meaning: "down, into, inward", nuance: "Implies downward fixation, depth, or quiet interiorization." }
];

const DHATUS: Dhatu[] = [
  { sanskrit: "रम्", iast: "ram", meaning: "to delight, sport, take pleasure", gana: "1st Class (Bhvādi)", type: "kriya" },
  { sanskrit: "पठ्", iast: "paṭh", meaning: "to read, recite, study", gana: "1st Class (Bhvādi)", type: "kriya" },
  { sanskrit: "गम्", iast: "gam", meaning: "to go, move, reach", gana: "1st Class (Bhvādi)", type: "kriya" },
  { sanskrit: "लिख्", iast: "likh", meaning: "to write, scratch, delineate", gana: "6th Class (Tudādi)", type: "kriya" },
  { sanskrit: "दृश्", iast: "dṛś", meaning: "to see, behold, perceive", gana: "4th Class (Divādi)", type: "kriya" },
  { sanskrit: "राम", iast: "rāma", meaning: "Noble person / Rama", gana: "Nominal Stem (Prātipadika)", type: "nama" },
  { sanskrit: "देव", iast: "deva", meaning: "Deity / Light", gana: "Nominal Stem (Prātipadika)", type: "nama" }
];

const MORPH_RULES: Record<string, SuffixResult[]> = {
  "प्र-रम्": [
    { sanskrit: "प्ररमते", iast: "praramate", meaning: "he delights/rejoices greatly", context: "Present Indicative (Lat, 3rd Person Singular)" },
    { sanskrit: "प्रराम", iast: "prarāma", meaning: "he rejoiced", context: "Perfect Past (Lit)" },
    { sanskrit: "प्ररम्य", iast: "praramya", meaning: "having rejoiced / delightful", context: "Absolutive / Gerundive" }
  ],
  "आ-रम्": [
    { sanskrit: "आरभते", iast: "ārabhate", meaning: "he begins / undertakes", context: "Present Indicative (Lat, 3rd Person Singular)" },
    { sanskrit: "आरब्धवान्", iast: "ārabdhavān", meaning: "one who has begun", context: "Past Active Participle" },
    { sanskrit: "आरम्भः", iast: "ārambhaḥ", meaning: "commencement, inception", context: "Primary Nominal Derivative (Ghan)" }
  ],
  "सम्-रम्": [
    { sanskrit: "संरमते", iast: "saṃramate", meaning: "he rages / becomes excited", context: "Present Indicative (Lat, 3rd Person Singular)" },
    { sanskrit: "संरम्भः", iast: "saṃrambhaḥ", meaning: "vehemence, fury, excitement", context: "Nominal Derivative" }
  ],
  "वि-रम्": [
    { sanskrit: "विरमति", iast: "viramati", meaning: "he desists / stops / pauses", context: "Present Indicative (Lat, 3rd Person Singular)" },
    { sanskrit: "विरम्य", iast: "viramya", meaning: "having paused / desisted", context: "Absolutive (Tyap)" },
    { sanskrit: "विरामः", iast: "virāmaḥ", meaning: "cessation, pause, rest", context: "Nominal Derivative" }
  ],
  "आ-गम्": [
    { sanskrit: "आगच्छति", iast: "āgacchati", meaning: "he comes / arrives", context: "Present Indicative (Lat, 3rd Person Singular)" },
    { sanskrit: "आगतवान्", iast: "āgatavān", meaning: "he has arrived", context: "Past Active Participle" },
    { sanskrit: "आगमनम्", iast: "āgamanam", meaning: "arrival, coming", context: "Action Noun (Lut)" }
  ],
  "प्र-पठ्": [
    { sanskrit: "प्रपठति", iast: "prapaṭhati", meaning: "he recites thoroughly / studies", context: "Present Indicative (Lat)" },
    { sanskrit: "प्रपाठकः", iast: "prapāṭhakaḥ", meaning: "reciter / lecturer / reader", context: "Agent Noun (Nvul)" }
  ]
};

const VACANA_HEADERS = ["एकवचनम् (Singular)", "द्विवचनम् (Dual)", "बहुवचनम् (Plural)"];

export default function SanskritMorphEngine() {
  // Step Workflow: 'equation' | 'matrix'
  const [viewMode, setViewMode] = useState<'equation' | 'matrix'>('equation');

  // Dial states
  const [upasargaIndex, setUpasargaIndex] = useState<number>(0);
  const [dhatuIndex, setDhatuIndex] = useState<number>(0);
  
  const [dhatuMode, setDhatuMode] = useState<'dial' | 'type'>('dial');
  const [customDhatuSanskrit, setCustomDhatuSanskrit] = useState<string>("रम्");
  const [customDhatuIast, setCustomDhatuIast] = useState<string>("ram");
  const [customDhatuMeaning, setCustomDhatuMeaning] = useState<string>("to delight");

  const [suffixIndex, setSuffixIndex] = useState<number>(0);

  // Matrix cell selection states
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0);

  // Audio speech synthesis & wave animation
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceActive, setVoiceActive] = useState<boolean>(true);

  // Saved / Favorites
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'workflow' | 'presets'>('workflow');

  const currentUpasarga = UPASARGAS[upasargaIndex];
  
  const currentDhatu: Dhatu = useMemo(() => {
    if (dhatuMode === 'dial') {
      return DHATUS[dhatuIndex];
    }
    return { sanskrit: customDhatuSanskrit, iast: customDhatuIast, meaning: customDhatuMeaning, gana: "Custom Root", type: 'kriya' };
  }, [dhatuMode, dhatuIndex, customDhatuSanskrit, customDhatuIast, customDhatuMeaning]);

  const keyString = `${currentUpasarga.sanskrit}-${currentDhatu.sanskrit}`;
  const availableSuffixes = useMemo(() => {
    return MORPH_RULES[keyString] || [
      { sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}ति`, iast: `${currentUpasarga.iast}${currentDhatu.iast}ti`, meaning: `derived action of ${currentDhatu.meaning}`, context: "Standard Present Derivative" },
      { sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}मः`, iast: `${currentUpasarga.iast}${currentDhatu.iast}maḥ`, meaning: `we ${currentDhatu.meaning.toLowerCase()}`, context: "1st Person Plural" },
      { sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}नम्`, iast: `${currentUpasarga.iast}${currentDhatu.iast}nam`, meaning: `the act of ${currentDhatu.meaning.toLowerCase()}`, context: "Nominal Action Noun" }
    ];
  }, [currentUpasarga, currentDhatu, keyString]);

  const currentResult = availableSuffixes[suffixIndex % availableSuffixes.length];

  // Dynamically generate 7x3 or 3x3 matrix based on active root type
  const dynamicMatrixData = useMemo(() => {
    const isNama = currentDhatu.type === 'nama' || currentDhatu.sanskrit === 'राम' || currentDhatu.sanskrit === 'देव';
    const base = currentDhatu.sanskrit;

    if (isNama) {
      // 7 x 3 Nominal Declension Matrix
      return {
        type: 'nama' as const,
        title: `${currentUpasarga.sanskrit} + ${base} (Nominal Paradigm)`,
        rows: [
          { name: "Prathamā (Nominative)", sanskritName: "प्रथमा", meaning: "Subject / Who does action", forms: [`${currentUpasarga.sanskrit}${base}ः`, `${currentUpasarga.sanskrit}${base}ौ`, `${currentUpasarga.sanskrit}${base}ः`] },
          { name: "Dvitīyā (Accusative)", sanskritName: "द्वितीया", meaning: "Object / Goal", forms: [`${currentUpasarga.sanskrit}${base}म्`, `${currentUpasarga.sanskrit}${base}ौ`, `${currentUpasarga.sanskrit}${base}ान्`] },
          { name: "Tṛtīyā (Instrumental)", sanskritName: "तृतीया", meaning: "By / With", forms: [`${currentUpasarga.sanskrit}${base}ेण`, `${currentUpasarga.sanskrit}${base}ाभ्याम्`, `${currentUpasarga.sanskrit}${base}ैः`] },
          { name: "Caturthī (Dative)", sanskritName: "चतुर्थी", meaning: "To / For", forms: [`${currentUpasarga.sanskrit}${base}ाय`, `${currentUpasarga.sanskrit}${base}ाभ्याम्`, `${currentUpasarga.sanskrit}${base}ेभ्यः`] },
          { name: "Pañcamī (Ablative)", sanskritName: "पञ्चमी", meaning: "From / Separation", forms: [`${currentUpasarga.sanskrit}${base}ात्`, `${currentUpasarga.sanskrit}${base}ाभ्याम्`, `${currentUpasarga.sanskrit}${base}ेभ्यः`] },
          { name: "Ṣaṣṭhī (Genitive)", sanskritName: "षष्ठी", meaning: "Of / Belonging to", forms: [`${currentUpasarga.sanskrit}${base}स्य`, `${currentUpasarga.sanskrit}${base}योः`, `${currentUpasarga.sanskrit}${base}ानाम्`] },
          { name: "Saptamī (Locative)", sanskritName: "सप्तमी", meaning: "In / On / At", forms: [`${currentUpasarga.sanskrit}${base}े`, `${currentUpasarga.sanskrit}${base}योः`, `${currentUpasarga.sanskrit}${base}ेषु`] }
        ]
      };
    } else {
      // 3 x 3 Verbal Conjugation Matrix (Lat-lakara)
      return {
        type: 'kriya' as const,
        title: `${currentUpasarga.sanskrit} + ${base} (Verbal Conjugation)`,
        rows: [
          { name: "Prathama Puruṣa (3rd Person)", sanskritName: "प्रथमपुरुषः", meaning: "He / She / It does", forms: [currentResult.sanskrit, `${currentUpasarga.sanskrit}${base}तः`, `${currentUpasarga.sanskrit}${base}न्ति`] },
          { name: "Madhyama Puruṣa (2nd Person)", sanskritName: "मध्यमपुरुषः", meaning: "You do", forms: [`${currentUpasarga.sanskrit}${base}सि`, `${currentUpasarga.sanskrit}${base}थः`, `${currentUpasarga.sanskrit}${base}थ`] },
          { name: "Uttama Puruṣa (1st Person)", sanskritName: "उत्तमपुरुषः", meaning: "I do / We do", forms: [`${currentUpasarga.sanskrit}${base}मि`, `${currentUpasarga.sanskrit}${base}ावः`, `${currentUpasarga.sanskrit}${base}ामः`] }
        ]
      };
    }
  }, [currentUpasarga, currentDhatu, currentResult]);

  const activeMatrixRow = dynamicMatrixData.rows[selectedRowIndex % dynamicMatrixData.rows.length];
  const activeMatrixCellForm = activeMatrixRow.forms[selectedColIndex % 3];

  const cycleUpasarga = () => {
    setUpasargaIndex((prev) => (prev + 1) % UPASARGAS.length);
    setSuffixIndex(0);
  };

  const cycleDhatu = () => {
    if (dhatuMode === 'dial') {
      setDhatuIndex((prev) => (prev + 1) % DHATUS.length);
      setSuffixIndex(0);
    }
  };

  const cycleSuffix = () => {
    setSuffixIndex((prev) => (prev + 1) % availableSuffixes.length);
  };

  const speakSanskrit = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleFavorite = () => {
    const item = viewMode === 'equation'
      ? `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit} = ${currentResult.sanskrit}`
      : `${dynamicMatrixData.title} -> ${activeMatrixRow.sanskritName} [${VACANA_HEADERS[selectedColIndex].split(' ')[0]}]: ${activeMatrixCellForm}`;
    
    if (favorites.includes(item)) {
      setFavorites(favorites.filter(f => f !== item));
    } else {
      setFavorites([...favorites, item]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col justify-between overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-900/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-900/10 blur-[160px] pointer-events-none rounded-full" />

      {/* Top Header / Contract */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8 z-10 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Atom className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
              Sanskrit Morphological Workflow
            </h1>
            <p className="text-[11px] text-slate-400 font-mono tracking-wide">
              PANINIAN EQUATION & PARADIGM MATRIX
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
          <button 
            onClick={() => setActiveTab('workflow')} 
            className={`hover:text-white transition-colors whitespace-nowrap ${activeTab === 'workflow' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            Workflow Studio
          </button>
          <button 
            onClick={() => setActiveTab('presets')} 
            className={`hover:text-white transition-colors whitespace-nowrap ${activeTab === 'presets' ? 'text-indigo-400 font-semibold' : ''}`}
          >
            Saved Notebook ({favorites.length})
          </button>
        </nav>

        {/* Primary Action / Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => speakSanskrit(viewMode === 'equation' ? currentResult.sanskrit : activeMatrixCellForm)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 rounded-lg hover:bg-indigo-900/60 transition-colors whitespace-nowrap shadow-sm"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-bounce" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? "Speaking..." : "Pronounce"}</span>
          </button>
        </div>
      </header>

      {/* Main Content: Step-by-Step Workflow */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col items-center z-10">
        
        {/* Workflow Step Indicator / Switcher */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-md">
          <button
            onClick={() => setViewMode('equation')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${viewMode === 'equation' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <span>Step 1: Equation Dial</span>
          </button>
          <div className="text-slate-600">→</div>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <span>Step 2: Paradigm Matrix</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'workflow' && viewMode === 'equation' && (
            <motion.div
              key="step1-equation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-8">
                <span className="text-xs tracking-widest text-indigo-400 uppercase font-mono mb-2 block">
                  Click any element to cycle dials. Click Result Block to generate Matrix.
                </span>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                  Morphological Equation
                </h2>
              </div>

              {/* The Central Equation Layout */}
              <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 my-6">
                
                {/* 1. Prefix (Upasarga) */}
                <div 
                  onClick={cycleUpasarga}
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col items-center text-center shadow-2xl backdrop-blur-sm"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 transition-colors">
                    [ UPASARGA ] ⟳
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Prefix (उपसर्ग)</div>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 group-hover:scale-105 transition-transform font-serif">
                    {currentUpasarga.sanskrit}
                  </div>
                  <div className="text-sm font-mono text-indigo-300 mb-1">{currentUpasarga.iast}</div>
                  <div className="text-xs text-slate-400 italic">&ldquo;{currentUpasarga.meaning}&rdquo;</div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] w-full text-[11px] text-slate-500">
                    {currentUpasarga.nuance}
                  </div>
                </div>

                <div className="text-2xl font-light text-slate-600 select-none">+</div>

                {/* 2. Root Sound (Dhātu) */}
                <div className="flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] hover:border-indigo-500/40 transition-all flex flex-col items-center text-center shadow-2xl backdrop-blur-sm relative">
                  
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDhatuMode(dhatuMode === 'dial' ? 'type' : 'dial');
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-indigo-300 transition-colors flex items-center gap-1"
                      title="Switch between Dial and Custom Type mode"
                    >
                      {dhatuMode === 'dial' ? <Keyboard className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                      <span>{dhatuMode === 'dial' ? 'Type Mode' : 'Dial Mode'}</span>
                    </button>
                  </div>

                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Root (धातु)</div>

                  {dhatuMode === 'dial' ? (
                    <div onClick={cycleDhatu} className="w-full cursor-pointer py-2">
                      <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 hover:scale-105 transition-transform font-serif">
                        {currentDhatu.sanskrit}
                      </div>
                      <div className="text-sm font-mono text-indigo-300 mb-1">{currentDhatu.iast}</div>
                      <div className="text-xs text-slate-400 italic">&ldquo;{currentDhatu.meaning}&rdquo;</div>
                    </div>
                  ) : (
                    <div className="w-full py-2 flex flex-col items-center">
                      <input
                        type="text"
                        value={customDhatuSanskrit}
                        onChange={(e) => setCustomDhatuSanskrit(e.target.value)}
                        placeholder="रम्"
                        className="w-36 text-center text-3xl font-bold bg-transparent border-b border-indigo-500 text-white focus:outline-none font-serif my-2"
                      />
                      <div className="flex gap-2 w-full mt-2">
                        <input
                          type="text"
                          value={customDhatuIast}
                          onChange={(e) => setCustomDhatuIast(e.target.value)}
                          placeholder="iast"
                          className="w-1/2 text-xs text-center bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 focus:outline-none font-mono"
                        />
                        <input
                          type="text"
                          value={customDhatuMeaning}
                          onChange={(e) => setCustomDhatuMeaning(e.target.value)}
                          placeholder="meaning"
                          className="w-1/2 text-xs text-center bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06] w-full text-[11px] text-slate-500">
                    {currentDhatu.gana}
                  </div>
                </div>

                <div className="text-2xl font-light text-slate-600 select-none">=</div>

                {/* 3. Derivative Result / Suffix Preview (Click to transition to Matrix) */}
                <div 
                  onClick={() => setViewMode('matrix')}
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-indigo-900/10 border border-indigo-500/30 hover:border-indigo-500/80 transition-all cursor-pointer flex flex-col items-center text-center shadow-2xl backdrop-blur-sm"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-indigo-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>EXPLORE MATRIX</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-indigo-300 mb-1">Derivative Result (प्रत्यय)</div>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 group-hover:scale-105 transition-transform font-serif text-indigo-200">
                    {currentResult.sanskrit}
                  </div>
                  <div className="text-sm font-mono text-indigo-400 mb-1">{currentResult.iast}</div>
                  <div className="text-xs text-slate-300 italic">&ldquo;{currentResult.meaning}&rdquo;</div>
                  <div className="mt-3 pt-3 border-t border-indigo-500/20 w-full text-[11px] text-indigo-300/80 flex items-center justify-center gap-1">
                    <span>Click to open full paradigm table</span>
                  </div>
                </div>

              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={toggleFavorite}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors text-slate-300"
                >
                  {favorites.includes(`${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit} = ${currentResult.sanskrit}`) ? (
                    <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  <span>Save to Notebook</span>
                </button>

                <button
                  onClick={() => setViewMode('matrix')}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
                >
                  <Grid className="w-4 h-4" />
                  <span>View Paradigm Matrix Table</span>
                </button>
              </div>

            </motion.div>
          )}

          {activeTab === 'workflow' && viewMode === 'matrix' && (
            <motion.div
              key="step2-matrix"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              {/* Back to Equation Button */}
              <div className="w-full flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMode('equation')}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Equation Dial</span>
                </button>

                <span className="text-xs font-mono text-indigo-400">
                  {dynamicMatrixData.type === 'nama' ? '7 × 3 Nominal Grid' : '3 × 3 Verbal Grid'}
                </span>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  {dynamicMatrixData.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Click any cell to highlight form, hear pronunciation, and update context
                </p>
              </div>

              {/* SEAMLESS TRANSPARENT MATRIX GRID: Zero borders, zero boxes */}
              <div className="w-full overflow-x-auto my-2 pb-4">
                <div className="min-w-[700px] grid grid-cols-4 gap-2 text-sm">
                  
                  {/* Header Row */}
                  <div className="p-3 text-xs font-mono uppercase tracking-wider text-slate-500 border-b border-white/[0.06]">
                    {dynamicMatrixData.type === 'nama' ? 'Vibhakti (Case)' : 'Puruṣa (Person)'}
                  </div>
                  {VACANA_HEADERS.map((header, colIdx) => (
                    <div key={colIdx} className="p-3 text-xs font-mono uppercase tracking-wider text-indigo-300 text-center border-b border-white/[0.06]">
                      {header}
                    </div>
                  ))}

                  {/* Matrix Rows */}
                  {dynamicMatrixData.rows.map((row, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      {/* Row Label */}
                      <div className="p-4 flex flex-col justify-center border-b border-white/[0.03] text-left">
                        <span className="text-sm font-semibold text-white">{row.sanskritName}</span>
                        <span className="text-[11px] text-slate-400">{row.name}</span>
                      </div>

                      {/* 3 Vacana Columns */}
                      {row.forms.map((form, colIdx) => {
                        const isSelected = selectedRowIndex === rowIdx && selectedColIndex === colIdx;
                        return (
                          <div 
                            key={colIdx}
                            onClick={() => {
                              setSelectedRowIndex(rowIdx);
                              setSelectedColIndex(colIdx);
                              speakSanskrit(form);
                            }}
                            className={`group relative p-4 flex flex-col items-center justify-center cursor-pointer transition-all border-b border-white/[0.03] rounded-xl ${isSelected ? 'bg-indigo-600/25 border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'hover:bg-white/[0.03]'}`}
                          >
                            <span className={`text-2xl md:text-3xl font-serif font-bold tracking-tight transition-transform group-hover:scale-105 ${isSelected ? 'text-indigo-200' : 'text-slate-100'}`}>
                              {form}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 mt-1">
                              {VACANA_HEADERS[colIdx].split(' ')[0]}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}

                </div>
              </div>

              {/* Active Matrix Cell Details Bar */}
              <div className="w-full max-w-2xl mt-6 p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1">
                    ACTIVE MATRIX CELL FORM
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-serif font-bold text-white">{activeMatrixCellForm}</span>
                    <span className="text-xs text-slate-400">({activeMatrixRow.sanskritName} · {VACANA_HEADERS[selectedColIndex]})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFavorite}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl transition-colors text-slate-300 whitespace-nowrap"
                  >
                    {favorites.includes(`${dynamicMatrixData.title} -> ${activeMatrixRow.sanskritName} [${VACANA_HEADERS[selectedColIndex].split(' ')[0]}]: ${activeMatrixCellForm}`) ? (
                      <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    <span>Save to Notebook</span>
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-md shadow-2xl"
            >
              <h3 className="text-xl font-medium text-white mb-2">Saved Notebook Expressions</h3>
              <p className="text-xs text-slate-400 mb-6">Your bookmarked equation dials and matrix cells</p>

              {favorites.length === 0 ? (
                <div className="py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                  No bookmarks saved yet. Click &ldquo;Save to Notebook&rdquo; in either view to store items here.
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((fav, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="font-serif text-lg text-white">{fav}</span>
                      <button
                        onClick={() => setFavorites(favorites.filter((_, i) => i !== index))}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Voice-Driven Train-of-Thought Narrative & Live Audio Waveform Footer */}
      <footer className="w-full bg-[#070a10] border-t border-white/[0.06] py-6 px-6 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Audio Waveform Indicator & Status */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60">
              <Mic className="w-4 h-4 text-indigo-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400">
                  VOICE NARRATIVE ACTIVE
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {[4, 12, 8, 16, 20, 10, 14, 6, 18, 10, 12, 5].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: voiceActive ? [h, h * 1.8, h * 0.6, h] : 4 }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                    className="w-1 bg-indigo-500/70 rounded-full"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Center: Live Grammatical Narrative */}
          <div className="flex-1 max-w-2xl px-4 text-center md:text-left">
            <p className="text-xs md:text-sm text-slate-300 font-serif leading-relaxed">
              {viewMode === 'equation' ? (
                <>
                  &ldquo;Exploring root sound <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentDhatu.sanskrit}&rsquo;</span> ({currentDhatu.meaning}) modified by prefix <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentUpasarga.sanskrit}&rsquo;</span> ({currentUpasarga.meaning}). Resulting in <span className="text-white font-sans font-bold">&lsquo;{currentResult.sanskrit}&rsquo;</span>. Click to explore matrix.&rdquo;
                </>
              ) : (
                <>
                  &ldquo;Analyzing <span className="text-indigo-300 font-sans font-semibold">{dynamicMatrixData.title}</span>. Selected cell <span className="text-white font-sans font-bold">&lsquo;{activeMatrixCellForm}&rsquo;</span> corresponds to <span className="text-indigo-300 font-sans font-semibold">{activeMatrixRow.name}</span> in <span className="text-indigo-300 font-sans font-semibold">{VACANA_HEADERS[selectedColIndex]}</span>.&rdquo;
                </>
              )}
            </p>
          </div>

          {/* Right: Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVoiceActive(!voiceActive)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
            >
              {voiceActive ? "Pause Voice" : "Resume Voice"}
            </button>
          </div>

        </div>
      </footer>
    </div>
  );
}
