'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Sparkles, Bookmark, 
  Keyboard, Compass, Mic, Atom, BookOpen, Grid, Layers, ArrowRight, ArrowLeft,
  Check, Copy, Trash2, X, ScrollText, Feather, Activity,
  Workflow, Table, BookMarked, ShieldAlert, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Upasarga {
  sanskrit: string;
  iast: string;
  meaning: string;
  nuance: string;
  isNone?: boolean;
}

interface Dhatu {
  sanskrit: string;
  iast: string;
  meaning: string;
  gana: string;
  type: 'nama' | 'kriya'; // nominal noun root vs verb root
  canHavePrefix: boolean; // Pāṇini 1.4.59 "उपसर्गाः क्रियायोगे"
  baseVerb?: string;
  atmanepada?: boolean;
  baseNoun?: string;
  nounGender?: 'masc' | 'neut' | 'fem';
}

interface SuffixOption {
  id: string;
  sanskrit: string;
  iast: string;
  meaning: string;
  context: string;
  tag: string; // e.g. "घञ्", "ल्युट्", "क्त", "लट्", "लोट्"
  category: 'tinanta' | 'krdanta' | 'subanta';
  targetType: 'kriya' | 'nama';
  gender?: 'masc' | 'neut' | 'fem';
  tenseMood?: string; // e.g. "Present (Laṭ)", "Imperative (Loṭ)"
  atmanepada?: boolean;
}

interface DerivationStep {
  step: number;
  title: string;
  sutraRule: string;
  description: string;
  intermediate: string;
}

interface EtymologyData {
  sutra: string;
  sutraNumber: string;
  sutraType: string;
  sutraExplanation: string;
  derivationSteps: DerivationStep[];
  poeticNuance: string;
  literaryContext: string;
  exampleSentence: {
    sanskrit: string;
    iast: string;
    translation: string;
    source: string;
  };
}

interface SavedExpression {
  id: string;
  sanskrit: string;
  iast: string;
  meaning: string;
  sourceType: 'equation' | 'matrix' | 'etymology';
  details: string;
  savedAt: string;
}

// -------------------------------------------------------------
// The 22 Traditional Pāṇinian Upasargas (प्रादयः) + None option
// -------------------------------------------------------------
const STANDARD_22_UPASARGAS: Upasarga[] = [
  { sanskrit: "प्र", iast: "pra", meaning: "Forward, forth, intensive, preeminent", nuance: "Denotes motion forward, excess (प्रकर्ष), manifestation or superior excellence in action." },
  { sanskrit: "परा", iast: "parā", meaning: "Away, back, far away, gone, reversal", nuance: "Signifies reversal (पराभव), opposition, defeat, or departure away from origin." },
  { sanskrit: "अप", iast: "apa", meaning: "Away, away from, off, negative, deviation", nuance: "Denotes taking away, deterioration, offense (अपकार), loss or negative deflection." },
  { sanskrit: "सम्", iast: "sam", meaning: "Together, completely, full, perfected, harmony", nuance: "Signifies perfection, auspicious union (सम्यक्), comprehensive completeness or sacred refinement." },
  { sanskrit: "अनु", iast: "anu", meaning: "After, along, following, in accordance with", nuance: "Denotes imitation, succession, subordination, or continuous harmonious accompaniment (अनुगमन)." },
  { sanskrit: "अव", iast: "ava", meaning: "Down, downward, off, under, comprehension", nuance: "Indicates descent (अवतार), thorough comprehension (अवगम), or depreciation." },
  { sanskrit: "निस्", iast: "nis", meaning: "Out, out of, away (becomes निर् nir / निश्)", nuance: "Represents motion outwards (निर्गमन), absence, certainty, or complete elimination." },
  { sanskrit: "निर्", iast: "nir", meaning: "Out, away, without, completely, free from", nuance: "Signifies total extraction, being devoid of (निर्धन), definitive certainty, or liberation." },
  { sanskrit: "दुस्", iast: "dus", meaning: "Bad, difficult, hard, wicked (becomes दुर्/दुश्)", nuance: "Denotes evil, hardship (दुष्कर), pain, moral difficulty, or reprobation." },
  { sanskrit: "दुर्", iast: "dur", meaning: "Bad, hard, difficult, troublesome", nuance: "Indicates adversity (दुर्लभ), corruption, affliction, or strenuous obstacle." },
  { sanskrit: "वि", iast: "vi", meaning: "Apart, separate, distinct, intensive, without", nuance: "Implies distribution, analytical distinction (विशेष), variance, or peaceful cessation." },
  { sanskrit: "आ", iast: "ā (āṅ)", meaning: "Here, near, towards, up to, reversal, all around", nuance: "Indicates spatial reversal (आङ् मर्यादाभिविध्योः), inward arrival, or all-pervading scope." },
  { sanskrit: "नि", iast: "ni", meaning: "In, into, down, inward, firmly settled", nuance: "Implies downward fixation (नितराम्), inward depth, residence (निवास), or quiet meditative composure." },
  { sanskrit: "अधि", iast: "adhi", meaning: "Above, over, upon, superior, sovereign mastery", nuance: "Denotes sovereignty, presiding authority (आधिपत्य), scholarly attainment, or mastery." },
  { sanskrit: "अपि", iast: "api", meaning: "Close to, proximate, also, over, covered", nuance: "Represents concealment (अपिधान), proximity, closure, or intimate attachment." },
  { sanskrit: "अति", iast: "ati", meaning: "Beyond, over, excessive, very, surpassing", nuance: "Signifies transcending natural limits (अतिक्रमण), intensity, excess, or supreme degree." },
  { sanskrit: "सु", iast: "su", meaning: "Good, well, easy, auspicious, pleasant", nuance: "Denotes auspiciousness (सुकृत), ease, sweetness, or moral excellence." },
  { sanskrit: "उत्", iast: "ut (ud)", meaning: "Up, upwards, out, elevation, emergence", nuance: "Signifies upward elevation (उत्थान), sudden release of energy, or emergence of power." },
  { sanskrit: "अभि", iast: "abhi", meaning: "Towards, to, into, facing, intensely confronting", nuance: "Indicates direct confrontation (आभिमुख्य), facing frontally (अभिमुख), or honoring." },
  { sanskrit: "प्रति", iast: "prati", meaning: "Against, back, towards, in return, each", nuance: "Represents reflection, opposition, reciprocity (प्रतिदान), or rhythmic repetition." },
  { sanskrit: "परि", iast: "pari", meaning: "Around, about, fully, completely, encircling", nuance: "Indicates comprehensive encirclement (समन्तात्), thorough inspection (परीक्षा), or total transformation." },
  { sanskrit: "उप", iast: "upa", meaning: "Near, towards, by the side of, subordinate, assisting", nuance: "Denotes proximity (उपहार), discipleship (उपनिषद्), service, or gentle beginning." }
];

const NONE_UPASARGA: Upasarga = {
  sanskrit: "—",
  iast: "none",
  meaning: "No Prefix (उपसर्गरहित / केवल)",
  nuance: "Nominal stems cannot take verbal Upasargas per Pāṇini 1.4.59 ('उपसर्गाः क्रियायोगे'). Unprefixed base root.",
  isNone: true
};

// -------------------------------------------------------------
// Canonical Roots & Nominal Stems
// -------------------------------------------------------------
const DHATUS: Dhatu[] = [
  { 
    sanskrit: "रम्", 
    iast: "ram", 
    meaning: "to delight, sport, rest, revel", 
    gana: "1st Class (Bhvādi ०१.०९०६)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "रमते", 
    atmanepada: true,
    baseNoun: "रामः",
    nounGender: "masc"
  },
  { 
    sanskrit: "पठ्", 
    iast: "paṭh", 
    meaning: "to read, recite, study aloud", 
    gana: "1st Class (Bhvādi ०१.०३८१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "पठति", 
    atmanepada: false,
    baseNoun: "पाठः",
    nounGender: "masc"
  },
  { 
    sanskrit: "गम्", 
    iast: "gam", 
    meaning: "to go, move, attain, walk", 
    gana: "1st Class (Bhvādi ०१.११३१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "गच्छति", 
    atmanepada: false,
    baseNoun: "गमनम्",
    nounGender: "neut"
  },
  { 
    sanskrit: "लिख्", 
    iast: "likh", 
    meaning: "to write, delineate, carve", 
    gana: "6th Class (Tudādi ०६.०००४)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "लिखति", 
    atmanepada: false,
    baseNoun: "लेखः",
    nounGender: "masc"
  },
  { 
    sanskrit: "दृश्", 
    iast: "dṛś", 
    meaning: "to see, behold, perceive directly", 
    gana: "4th/1st Class (Divādi/Bhvādi)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "पश्यति", 
    atmanepada: false,
    baseNoun: "दर्शनम्",
    nounGender: "neut"
  },
  { 
    sanskrit: "कृ", 
    iast: "kṛ", 
    meaning: "to do, make, fashion, accomplish", 
    gana: "8th Class (Tanādi ०८.००१०)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "करोति", 
    atmanepada: false,
    baseNoun: "कार्यम्",
    nounGender: "neut"
  },
  { 
    sanskrit: "भू", 
    iast: "bhū", 
    meaning: "to be, exist, arise, become", 
    gana: "1st Class (Bhvādi ०१.०००१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "भवति", 
    atmanepada: false,
    baseNoun: "भावः",
    nounGender: "masc"
  },
  { 
    sanskrit: "स्था", 
    iast: "sthā", 
    meaning: "to stand, abide, remain, endure", 
    gana: "1st Class (Bhvādi ०१.१०७७)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "तिष्ठति", 
    atmanepada: false,
    baseNoun: "स्थानम्",
    nounGender: "neut"
  },
  { 
    sanskrit: "दा", 
    iast: "dā", 
    meaning: "to give, bestow, impart", 
    gana: "3rd Class (Juhotyādi ०३.०००९)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "ददाति", 
    atmanepada: false,
    baseNoun: "दानम्",
    nounGender: "neut"
  },
  { 
    sanskrit: "ज्ञा", 
    iast: "jñā", 
    meaning: "to know, understand, realize", 
    gana: "9th Class (Kryādi ०९.००३६)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "जानाति", 
    atmanepada: false,
    baseNoun: "ज्ञानम्",
    nounGender: "neut"
  },
  // Nominal Noun Stems (Prātipadika)
  { 
    sanskrit: "राम", 
    iast: "rāma", 
    meaning: "Noble person, charming one (Rama)", 
    gana: "Ajanta Puṃliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false,
    baseNoun: "रामः",
    nounGender: "masc"
  },
  { 
    sanskrit: "देव", 
    iast: "deva", 
    meaning: "Luminous being, celestial light, deity", 
    gana: "Ajanta Puṃliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false,
    baseNoun: "देवः",
    nounGender: "masc"
  },
  { 
    sanskrit: "ज्ञान", 
    iast: "jñāna", 
    meaning: "Direct gnosis, illumined insight", 
    gana: "Ajanta Napuṃsakaliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false,
    baseNoun: "ज्ञानम्",
    nounGender: "neut"
  }
];

const VACANA_HEADERS = [
  { sanskrit: "एकवचनम्", english: "Singular" },
  { sanskrit: "द्विवचनम्", english: "Dual" },
  { sanskrit: "बहुवचनम्", english: "Plural" }
];

// -------------------------------------------------------------------
// Synthesizes MULTIPLE Action Word (Tiṅanta) and Name Word (Subanta) Options
// -------------------------------------------------------------------
function getDerivedOptions(upasarga: Upasarga, dhatu: Dhatu): { actionWords: SuffixOption[]; nameWords: SuffixOption[] } {
  const isNone = upasarga.isNone || !dhatu.canHavePrefix;
  const pDev = isNone ? '' : upasarga.sanskrit;
  const pIast = isNone ? '' : upasarga.iast.replace(/ \(.*\)/, '');
  const dDev = dhatu.sanskrit;

  // Inherent nominal stem
  if (dhatu.type === 'nama' || !dhatu.canHavePrefix) {
    const isNeuter = dDev === 'ज्ञान';
    const mainNom = isNeuter ? `${dDev}म्` : `${dDev}ः`;
    return {
      actionWords: [
        {
          id: 'act-1',
          sanskrit: `${dDev}ायते`,
          iast: `${dhatu.iast}āyate`,
          meaning: `acts like ${dhatu.meaning.toLowerCase()} (Present)`,
          context: "Denominative Verb (Nāmadhātu Laṭ, क्योङ् प्रत्ययः ३.१.११)",
          tag: "लट् (Present)",
          category: "tinanta",
          targetType: "kriya",
          tenseMood: "Present Indicative (Laṭ)",
          atmanepada: true
        },
        {
          id: 'act-2',
          sanskrit: `${dDev}ायताम्`,
          iast: `${dhatu.iast}āyatām`,
          meaning: `let him act like ${dhatu.meaning.toLowerCase()} (Imperative)`,
          context: "Denominative Verb (Nāmadhātu Loṭ, Imperative)",
          tag: "लोट् (Imperative)",
          category: "tinanta",
          targetType: "kriya",
          tenseMood: "Imperative (Loṭ)",
          atmanepada: true
        },
        {
          id: 'act-3',
          sanskrit: `${dDev}ायेत`,
          iast: `${dhatu.iast}āyeta`,
          meaning: `may he act like ${dhatu.meaning.toLowerCase()} (Potential)`,
          context: "Denominative Verb (Nāmadhātu Vidčiliṅ, Potential)",
          tag: "विधिलिङ् (Optative)",
          category: "tinanta",
          targetType: "kriya",
          tenseMood: "Optative (Vidčiliṅ)",
          atmanepada: true
        }
      ],
      nameWords: [
        {
          id: 'nom-1',
          sanskrit: mainNom,
          iast: isNeuter ? `${dhatu.iast}m` : `${dhatu.iast}ḥ`,
          meaning: `${dhatu.meaning} (Base Noun / प्रातिपदिक)`,
          context: "Nominal Stem (प्रातिपदिकार्थलिङ्गपरिमाणवचनमात्रे प्रथमा २.३.४६)",
          tag: "मूल-प्रातिपदिकम्",
          category: "subanta",
          targetType: "nama",
          gender: isNeuter ? 'neut' : 'masc'
        },
        {
          id: 'nom-2',
          sanskrit: `${dDev}त्वम्`,
          iast: `${dhatu.iast}tvam`,
          meaning: `the essence / quality of ${dhatu.meaning.toLowerCase()} (Abstract Noun)`,
          context: "Taddhita Abstract Suffix (त्व-प्रत्ययः ५.१.११९)",
          tag: "त्व (Abstract)",
          category: "subanta",
          targetType: "nama",
          gender: 'neut'
        },
        {
          id: 'nom-3',
          sanskrit: `${dDev}मयम्`,
          iast: `${dhatu.iast}mayam`,
          meaning: `replete with / imbued with ${dhatu.meaning.toLowerCase()}`,
          context: "Taddhita Suffix (मयट्-प्रत्ययः ५.४.२१)",
          tag: "मयट् (Imbued)",
          category: "subanta",
          targetType: "nama",
          gender: 'neut'
        }
      ]
    };
  }

  // Pre-mapped combinations for authentic classical forms
  const comboKey = `${pDev || 'none'}-${dDev}`;

  const SPECIAL_MAP: Record<string, { actionWords: SuffixOption[]; nameWords: SuffixOption[] }> = {
    "प्र-रम्": {
      actionWords: [
        { id: 'act-1', sanskrit: "प्ररमते", iast: "praramate", meaning: "he rejoices exceedingly", context: "Present Indicative (Laṭ, 3rd Person Ātmanepada)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: true },
        { id: 'act-2', sanskrit: "प्ररमताम्", iast: "praramatām", meaning: "let him rejoice / celebrate", context: "Imperative Mood (Loṭ, 3rd Person)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: true },
        { id: 'act-3', sanskrit: "प्ररमेत", iast: "prarameta", meaning: "may he take delight in truth", context: "Potential / Optative (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: true },
        { id: 'act-4', sanskrit: "प्ररेमे", iast: "prareme", meaning: "he took profound delight", context: "Perfect Past (Liṭ Lakāra)", tag: "लिट् (Past)", category: "tinanta", targetType: "kriya", tenseMood: "Perfect (Liṭ)", atmanepada: true }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "प्ररामः", iast: "prarāmaḥ", meaning: "transcendent joy, ecstatic repose", context: "Primary Action Noun (Ghañ Pratyaya)", tag: "घञ् (Action Noun)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-2', sanskrit: "प्ररमणम्", iast: "praramaṇam", meaning: "the act of supreme rejoicing", context: "Abstract Action Noun (Lyuṭ Pratyaya)", tag: "ल्युट् (Abstract)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-3', sanskrit: "प्ररम्यः", iast: "praramyaḥ", meaning: "one worthy of being delighted in", context: "Gerundive Adjective (Kṛtya / Yat)", tag: "कृत्य (Gerundive)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-4', sanskrit: "प्ररतिः", iast: "praratiḥ", meaning: "deep devotional joy, spiritual pleasure", context: "Feminine Action Noun (Ktin Pratyaya)", tag: "क्तिन् (Feminine)", category: "subanta", targetType: "nama", gender: "fem" }
      ]
    },
    "वि-रम्": {
      actionWords: [
        { id: 'act-1', sanskrit: "विरमति", iast: "viramati", meaning: "he desists, stops, pauses", context: "Present Indicative (Laṭ, Parasmaipada by व्याङ्परिभ्यो रमः)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: false },
        { id: 'act-2', sanskrit: "विरमतु", iast: "viramatu", meaning: "let him desist from wrongful action", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: false },
        { id: 'act-3', sanskrit: "विरमेत्", iast: "viramet", meaning: "he should pause / desist", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: false },
        { id: 'act-4', sanskrit: "अविरमत्", iast: "aviramat", meaning: "he desisted / paused", context: "Imperfect Past (Laṅ Lakāra)", tag: "लङ् (Past)", category: "tinanta", targetType: "kriya", tenseMood: "Imperfect (Laṅ)", atmanepada: false }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "विरामः", iast: "virāmaḥ", meaning: "cessation, pause, tranquil rest", context: "Nominal Action Noun (Ghañ)", tag: "घञ् (Action Noun)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-2', sanskrit: "विरमणम्", iast: "viramaṇam", meaning: "the act of desisting or pausing", context: "Action Noun (Lyuṭ Pratyaya)", tag: "ल्युट् (Abstract)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-3', sanskrit: "विरतिः", iast: "viratiḥ", meaning: "dispassion, quietude, stopping", context: "Feminine Action Noun (Ktin)", tag: "क्तिन् (Feminine)", category: "subanta", targetType: "nama", gender: "fem" },
        { id: 'nom-4', sanskrit: "विरतः", iast: "virataḥ", meaning: "one who has ceased / turned away", context: "Past Passive Participle (Kta)", tag: "क्त (Participle)", category: "subanta", targetType: "nama", gender: "masc" }
      ]
    },
    "आ-गम्": {
      actionWords: [
        { id: 'act-1', sanskrit: "आगच्छति", iast: "āgacchati", meaning: "he comes, arrives", context: "Present Indicative (Laṭ, 3rd Person)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: false },
        { id: 'act-2', sanskrit: "आगच्छतु", iast: "āgacchatu", meaning: "let him arrive / welcome", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: false },
        { id: 'act-3', sanskrit: "आगच्छेत्", iast: "āgacchet", meaning: "may he arrive soon", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: false },
        { id: 'act-4', sanskrit: "आगमिष्यति", iast: "āgamiṣyati", meaning: "he will arrive in future", context: "Simple Future (Lṛṭ Lakāra)", tag: "लृट् (Future)", category: "tinanta", targetType: "kriya", tenseMood: "Future (Lṛṭ)", atmanepada: false }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "आगमनम्", iast: "āgamanam", meaning: "arrival, advent, coming", context: "Action Noun (Lyuṭ Pratyaya)", tag: "ल्युट् (Arrival)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-2', sanskrit: "आगमः", iast: "āgamaḥ", meaning: "canonical scripture, sacred arrival", context: "Primary Nominal Derivative (Ghañ)", tag: "घञ् (Scripture)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-3', sanskrit: "आगतः", iast: "āgataḥ", meaning: "the one who has arrived / guest", context: "Past Active Participle (Kta)", tag: "क्त (Arrived)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-4', sanskrit: "आगतिः", iast: "āgatiḥ", meaning: "incoming return, arrival path", context: "Feminine Action Noun (Ktin)", tag: "क्तिन् (Feminine)", category: "subanta", targetType: "nama", gender: "fem" }
      ]
    },
    "सम्-कृ": {
      actionWords: [
        { id: 'act-1', sanskrit: "संस्कुरुते", iast: "saṃskurute", meaning: "he refines, sanctifies (Ātmanepada)", context: "Present Indicative (Laṭ, Suṭ-āgama)", tag: "लट् (Ātmanepada)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: true },
        { id: 'act-2', sanskrit: "संस्करोति", iast: "saṃskaroti", meaning: "he purifies, consecrates (Parasmaipada)", context: "Present Indicative (Laṭ)", tag: "लट् (Parasmaipada)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: false },
        { id: 'act-3', sanskrit: "संस्कुरुताम्", iast: "saṃskurutām", meaning: "let him sanctify / purify", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: true },
        { id: 'act-4', sanskrit: "संस्कुर्यात्", iast: "saṃskuryāt", meaning: "he should purify with sacred rite", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: false }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "संस्कारः", iast: "saṃskāraḥ", meaning: "sacrament, spiritual impression, refinement", context: "Action Noun (Ghañ Pratyaya)", tag: "घञ् (Sacrament)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-2', sanskrit: "संस्कृतम्", iast: "saṃskṛtam", meaning: "refined, perfected, sacred Sanskrit", context: "Past Passive Participle (Kta)", tag: "क्त (Refined)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-3', sanskrit: "संस्कृतिः", iast: "saṃskṛtiḥ", meaning: "culture, sacred civilization", context: "Feminine Action Noun (Ktin)", tag: "क्तिन् (Culture)", category: "subanta", targetType: "nama", gender: "fem" },
        { id: 'nom-4', sanskrit: "संस्कर्ता", iast: "saṃskartā", meaning: "consecrator, master refiner", context: "Agent Noun (Tṛc Pratyaya)", tag: "तृच् (Agent)", category: "subanta", targetType: "nama", gender: "masc" }
      ]
    },
    "प्र-भू": {
      actionWords: [
        { id: 'act-1', sanskrit: "प्रभवति", iast: "prabhavati", meaning: "he originates, holds sovereign mastery", context: "Present Indicative (Laṭ)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: false },
        { id: 'act-2', sanskrit: "प्रभवतु", iast: "prabhavatu", meaning: "let it manifest / originate", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: false },
        { id: 'act-3', sanskrit: "प्रभवेत्", iast: "prabhavet", meaning: "may it manifest and command", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: false },
        { id: 'act-4', sanskrit: "प्राभवत्", iast: "prābhavat", meaning: "it originated / manifested", context: "Imperfect Past (Laṅ)", tag: "लङ् (Past)", category: "tinanta", targetType: "kriya", tenseMood: "Imperfect (Laṅ)", atmanepada: false }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "प्रभावः", iast: "prabhāvaḥ", meaning: "spiritual majesty, sovereign power, aura", context: "Action Noun (Ghañ)", tag: "घञ् (Power)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-2', sanskrit: "प्रभवः", iast: "prabhavaḥ", meaning: "fountainhead, place of first origin", context: "Noun of Source (Ap Pratyaya)", tag: "अप् (Source)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-3', sanskrit: "प्रभवनम्", iast: "prabhavanam", meaning: "the process of manifestation", context: "Action Noun (Lyuṭ)", tag: "ल्युट् (Process)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-4', sanskrit: "प्रभुः", iast: "prabhuḥ", meaning: "sovereign master, supreme lord", context: "Agent Noun (Ku Pratyaya)", tag: "कु (Master)", category: "subanta", targetType: "nama", gender: "masc" }
      ]
    },
    "प्र-स्था": {
      actionWords: [
        { id: 'act-1', sanskrit: "प्रतिष्ठते", iast: "pratiṣṭhate", meaning: "he departs, sets forth, abides", context: "Present Indicative (Laṭ)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: true },
        { id: 'act-2', sanskrit: "प्रतिष्ठताम्", iast: "pratiṣṭhatām", meaning: "let him set forth / depart", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: true },
        { id: 'act-3', sanskrit: "प्रतिष्ठेत", iast: "pratiṣṭheta", meaning: "may he be established in truth", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: true }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "प्रस्थानम्", iast: "prasthānam", meaning: "departure, sacred treatise, foundation", context: "Action Noun (Lyuṭ)", tag: "ल्युट् (Treatise)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-2', sanskrit: "प्रतिष्ठा", iast: "pratiṣṭhā", meaning: "prestige, firm foundation, consecration", context: "Feminine Noun (Aṅ)", tag: "अङ् (Prestige)", category: "subanta", targetType: "nama", gender: "fem" },
        { id: 'nom-3', sanskrit: "प्रस्थितः", iast: "prasthitaḥ", meaning: "one who has set forth on journey", context: "Past Participle (Kta)", tag: "क्त (Departed)", category: "subanta", targetType: "nama", gender: "masc" }
      ]
    },
    "none-रम्": {
      actionWords: [
        { id: 'act-1', sanskrit: "रमते", iast: "ramate", meaning: "he delights, rejoices", context: "Present Indicative (Laṭ)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: true },
        { id: 'act-2', sanskrit: "रमताम्", iast: "ramatām", meaning: "let him rejoice", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: true },
        { id: 'act-3', sanskrit: "रमेत", iast: "rameta", meaning: "may he take delight", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: true }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "रामः", iast: "rāmaḥ", meaning: "noble delight, the charming one", context: "Action Noun (Ghañ)", tag: "घञ् (Epithet)", category: "subanta", targetType: "nama", gender: "masc" },
        { id: 'nom-2', sanskrit: "रमणम्", iast: "ramaṇam", meaning: "sporting, act of delighting", context: "Action Noun (Lyuṭ)", tag: "ल्युट् (Delighting)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-3', sanskrit: "रतिः", iast: "ratiḥ", meaning: "pleasure, deep affection", context: "Feminine Noun (Ktin)", tag: "क्तिन् (Pleasure)", category: "subanta", targetType: "nama", gender: "fem" }
      ]
    },
    "none-गम्": {
      actionWords: [
        { id: 'act-1', sanskrit: "गच्छति", iast: "gacchati", meaning: "he goes, moves", context: "Present Indicative (Laṭ)", tag: "लट् (Present)", category: "tinanta", targetType: "kriya", tenseMood: "Present (Laṭ)", atmanepada: false },
        { id: 'act-2', sanskrit: "गच्छतु", iast: "gacchatu", meaning: "let him go", context: "Imperative Mood (Loṭ)", tag: "लोट् (Imperative)", category: "tinanta", targetType: "kriya", tenseMood: "Imperative (Loṭ)", atmanepada: false },
        { id: 'act-3', sanskrit: "गच्छेत्", iast: "gacchet", meaning: "he should go", context: "Potential Mood (Vidčiliṅ)", tag: "विधिलिङ् (Optative)", category: "tinanta", targetType: "kriya", tenseMood: "Optative (Vidčiliṅ)", atmanepada: false }
      ],
      nameWords: [
        { id: 'nom-1', sanskrit: "गमनम्", iast: "gamanam", meaning: "going, departure, transit", context: "Action Noun (Lyuṭ)", tag: "ल्युट् (Transit)", category: "subanta", targetType: "nama", gender: "neut" },
        { id: 'nom-2', sanskrit: "गतिः", iast: "gatiḥ", meaning: "path, movement, spiritual refuge", context: "Feminine Action Noun (Ktin)", tag: "क्तिन् (Path)", category: "subanta", targetType: "nama", gender: "fem" },
        { id: 'nom-3', sanskrit: "गतः", iast: "gataḥ", meaning: "the one who has gone", context: "Past Participle (Kta)", tag: "क्त (Gone)", category: "subanta", targetType: "nama", gender: "masc" }
      ]
    }
  };

  if (SPECIAL_MAP[comboKey]) {
    return SPECIAL_MAP[comboKey];
  }

  // Programmatic generator for other combinations
  let verbStem = dhatu.baseVerb ? dhatu.baseVerb.replace(/(ति|ते)$/, '') : dDev;
  let nounStem = dhatu.baseNoun ? dhatu.baseNoun.replace(/[ःम्]$/, '') : `${dDev}न`;

  if (pDev) {
    if (pDev === 'सम्') {
      verbStem = `सं${verbStem}`;
      nounStem = `सं${nounStem}`;
    } else if (pDev === 'उत्') {
      verbStem = `उद्${verbStem}`;
      nounStem = `उद्${nounStem}`;
    } else {
      verbStem = `${pDev}${verbStem}`;
      nounStem = `${pDev}${nounStem}`;
    }
  }

  const isAtma = dhatu.atmanepada;

  return {
    actionWords: [
      {
        id: 'act-1',
        sanskrit: isAtma ? `${verbStem}ते` : `${verbStem}ति`,
        iast: `${pIast}${dhatu.iast}ti`,
        meaning: `he performs action of ${dhatu.meaning.toLowerCase()} (Present)`,
        context: "Present Indicative (Laṭ Lakāra)",
        tag: "लट् (Present)",
        category: "tinanta",
        targetType: "kriya",
        tenseMood: "Present (Laṭ)",
        atmanepada: isAtma
      },
      {
        id: 'act-2',
        sanskrit: isAtma ? `${verbStem}ताम्` : `${verbStem}तु`,
        iast: `${pIast}${dhatu.iast}tu`,
        meaning: `let him ${dhatu.meaning.toLowerCase()} (Imperative)`,
        context: "Imperative Mood (Loṭ Lakāra)",
        tag: "लोट् (Imperative)",
        category: "tinanta",
        targetType: "kriya",
        tenseMood: "Imperative (Loṭ)",
        atmanepada: isAtma
      },
      {
        id: 'act-3',
        sanskrit: isAtma ? `${verbStem}ेत` : `${verbStem}ेत्`,
        iast: `${pIast}${dhatu.iast}et`,
        meaning: `may he ${dhatu.meaning.toLowerCase()} (Potential)`,
        context: "Potential Mood (Vidčiliṅ)",
        tag: "विधिलिङ् (Optative)",
        category: "tinanta",
        targetType: "kriya",
        tenseMood: "Optative (Vidčiliṅ)",
        atmanepada: isAtma
      }
    ],
    nameWords: [
      {
        id: 'nom-1',
        sanskrit: `${nounStem}म्`,
        iast: `${pIast}${dhatu.iast}nam`,
        meaning: `the act / process of ${dhatu.meaning.toLowerCase()}`,
        context: "Neuter Action Noun (Lyuṭ Pratyaya)",
        tag: "ल्युट् (Action Noun)",
        category: "subanta",
        targetType: "nama",
        gender: "neut"
      },
      {
        id: 'nom-2',
        sanskrit: `${nounStem}ः`,
        iast: `${pIast}${dhatu.iast}aḥ`,
        meaning: `manifestation / entity of ${dhatu.meaning.toLowerCase()}`,
        context: "Masculine Nominal Derivative (Ghañ)",
        tag: "घञ् (Entity)",
        category: "subanta",
        targetType: "nama",
        gender: "masc"
      },
      {
        id: 'nom-3',
        sanskrit: `${pDev}${dDev}तिः`,
        iast: `${pIast}${dhatu.iast}tiḥ`,
        meaning: `the state / condition of ${dhatu.meaning.toLowerCase()}`,
        context: "Feminine Action Noun (Ktin)",
        tag: "क्तिन् (State)",
        category: "subanta",
        targetType: "nama",
        gender: "fem"
      }
    ]
  };
}

export default function SanskritMorphEngine() {
  // Navigation View: 'equation' (Step 1) | 'matrix' (Step 2) | 'etymology' (Step 3)
  const [currentStep, setCurrentStep] = useState<'equation' | 'matrix' | 'etymology'>('equation');

  // Root Selection State
  const [dhatuIndex, setDhatuIndex] = useState<number>(0);
  const [dhatuMode, setDhatuMode] = useState<'dial' | 'type'>('dial');
  const [customDhatuSanskrit, setCustomDhatuSanskrit] = useState<string>("रम्");
  const [customDhatuIast, setCustomDhatuIast] = useState<string>("ram");
  const [customDhatuMeaning, setCustomDhatuMeaning] = useState<string>("to delight, revel");
  const [customIsNominal, setCustomIsNominal] = useState<boolean>(false);

  // Upasarga Selection Index (0 to 21 across STANDARD_22_UPASARGAS)
  const [savedUpasargaIndex, setSavedUpasargaIndex] = useState<number>(0);
  const [isPrefixQuickSelectOpen, setIsPrefixQuickSelectOpen] = useState<boolean>(false);

  // HIGH-LEVEL TOGGLE IN SUFFIX DIAL: 'kriya' (Action Word) vs 'nama' (Name Word)
  const [suffixTargetType, setSuffixTargetType] = useState<'kriya' | 'nama'>('kriya');

  // SUB-OPTION SELECTION: Multiple options available within the selected category!
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>(0);
  const [selectedNameIndex, setSelectedNameIndex] = useState<number>(0);

  // Matrix cell selection
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0);

  // Audio speech synthesis & wave animation
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceActive, setVoiceActive] = useState<boolean>(true);

  // Notebook drawer state
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [savedExpressions, setSavedExpressions] = useState<SavedExpression[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tooltip / Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Active Dhātu
  const currentDhatu: Dhatu = useMemo(() => {
    if (dhatuMode === 'dial') {
      return DHATUS[dhatuIndex];
    }
    return { 
      sanskrit: customDhatuSanskrit.trim() || "रम्", 
      iast: customDhatuIast.trim() || "ram", 
      meaning: customDhatuMeaning.trim() || "action", 
      gana: customIsNominal ? "Custom Nominal (प्रातिपदिक)" : "Custom Root (धातु)", 
      type: customIsNominal ? 'nama' : 'kriya',
      canHavePrefix: !customIsNominal,
      baseVerb: `${customDhatuSanskrit.trim()}ति`,
      baseNoun: `${customDhatuSanskrit.trim()}ः`,
      nounGender: "masc"
    };
  }, [dhatuMode, dhatuIndex, customDhatuSanskrit, customDhatuIast, customDhatuMeaning, customIsNominal]);

  // Dynamic Kriyāyoga Check: If root cannot have prefix, set prefix to None
  const currentUpasarga: Upasarga = useMemo(() => {
    if (!currentDhatu.canHavePrefix) {
      return NONE_UPASARGA;
    }
    return STANDARD_22_UPASARGAS[savedUpasargaIndex % STANDARD_22_UPASARGAS.length];
  }, [currentDhatu.canHavePrefix, savedUpasargaIndex]);

  // Suffix Derivation based on the High-Level Toggle & Multiple Options
  const derivedOptions = useMemo(() => {
    return getDerivedOptions(currentUpasarga, currentDhatu);
  }, [currentUpasarga, currentDhatu]);

  const activeOptionList = useMemo(() => {
    return suffixTargetType === 'kriya' ? derivedOptions.actionWords : derivedOptions.nameWords;
  }, [suffixTargetType, derivedOptions]);

  const activeOptionIndex = suffixTargetType === 'kriya' ? selectedActionIndex : selectedNameIndex;

  const currentResult: SuffixOption = useMemo(() => {
    const list = activeOptionList;
    return list[activeOptionIndex % list.length] || list[0];
  }, [activeOptionList, activeOptionIndex]);

  // Next / Previous cycle within current category
  const cycleOption = (delta: number) => {
    if (suffixTargetType === 'kriya') {
      setSelectedActionIndex((prev) => {
        const next = prev + delta;
        const len = derivedOptions.actionWords.length;
        return (next % len + len) % len;
      });
    } else {
      setSelectedNameIndex((prev) => {
        const next = prev + delta;
        const len = derivedOptions.nameWords.length;
        return (next % len + len) % len;
      });
    }
  };

  // DYNAMIC PARADIGM MATRIX COMPUTATION:
  // Directly computed and displayed based on the SPECIFIC SELECTED OPTION!
  const dynamicMatrixData = useMemo(() => {
    if (suffixTargetType === 'nama') {
      // 7 CASES × 3 NUMBERS (7 × 3 Nominal Grid)
      const nominalWord = currentResult.sanskrit;
      const gender = currentResult.gender || 'masc';

      if (gender === 'neut') {
        let stem = nominalWord.replace(/म्$/, '');
        return {
          type: 'nama' as const,
          title: `${nominalWord} [${currentResult.tag}]`,
          subtitle: "७ Vibhaktis (Cases) × ३ Vacanas (Numbers) — Neuter Nominal Declension",
          rows: [
            { name: "Prathamā (Nominative)", sanskritName: "प्रथमा", meaning: "Subject / Kartā", forms: [`${stem}म्`, `${stem}े`, `${stem}ानि`] },
            { name: "Dvitīyā (Accusative)", sanskritName: "द्वितीया", meaning: "Direct Object / Karma", forms: [`${stem}म्`, `${stem}े`, `${stem}ानि`] },
            { name: "Tṛtīyā (Instrumental)", sanskritName: "तृतीया", meaning: "By / With (Karaṇa)", forms: [`${stem}ेन`, `${stem}ाभ्याम्`, `${stem}ैः`] },
            { name: "Caturthī (Dative)", sanskritName: "चतुर्थी", meaning: "For / Unto (Sampradāna)", forms: [`${stem}ाय`, `${stem}ाभ्याम्`, `${stem}ेभ्यः`] },
            { name: "Pañcamī (Ablative)", sanskritName: "पञ्चमी", meaning: "From / Separation (Apādāna)", forms: [`${stem}ात्`, `${stem}ाभ्याम्`, `${stem}ेभ्यः`] },
            { name: "Ṣaṣṭhī (Genitive)", sanskritName: "षष्ठी", meaning: "Of / Belonging to (Sambandha)", forms: [`${stem}स्य`, `${stem}योः`, `${stem}ानाम्`] },
            { name: "Saptamī (Locative)", sanskritName: "सप्तमी", meaning: "In / At / Upon (Adhikaraṇa)", forms: [`${stem}े`, `${stem}योः`, `${stem}ेषु`] }
          ]
        };
      } else if (gender === 'fem') {
        let stem = nominalWord.replace(/[ःा]$/, '');
        return {
          type: 'nama' as const,
          title: `${nominalWord} [${currentResult.tag}]`,
          subtitle: "७ Vibhaktis (Cases) × ३ Vacanas (Numbers) — Feminine Nominal Declension",
          rows: [
            { name: "Prathamā (Nominative)", sanskritName: "प्रथमा", meaning: "Subject / Kartā", forms: [`${stem}िः`, `${stem}ी`, `${stem}यः`] },
            { name: "Dvitīyā (Accusative)", sanskritName: "द्वितीया", meaning: "Direct Object / Karma", forms: [`${stem}म्`, `${stem}ी`, `${stem}ीः`] },
            { name: "Tṛtīyā (Instrumental)", sanskritName: "तृतीया", meaning: "By / With (Karaṇa)", forms: [`${stem}्या`, `${stem}िभ्याम्`, `${stem}िभिः`] },
            { name: "Caturthī (Dative)", sanskritName: "चतुर्थी", meaning: "For / Unto (Sampradāna)", forms: [`${stem}ये`, `${stem}िभ्याम्`, `${stem}िभ्यः`] },
            { name: "Pañcamī (Ablative)", sanskritName: "पञ्चमी", meaning: "From / Separation", forms: [`${stem}याः`, `${stem}िभ्याम्`, `${stem}िभ्यः`] },
            { name: "Ṣaṣṭhī (Genitive)", sanskritName: "षष्ठी", meaning: "Of / Belonging to", forms: [`${stem}याः`, `${stem}योः`, `${stem}ीनाम्`] },
            { name: "Saptamī (Locative)", sanskritName: "सप्तमी", meaning: "In / At / Upon", forms: [`${stem}याम्`, `${stem}योः`, `${stem}िषु`] }
          ]
        };
      } else {
        // Masculine Akārānta
        let stem = nominalWord.replace(/[ःम्]$/, '');
        return {
          type: 'nama' as const,
          title: `${nominalWord} [${currentResult.tag}]`,
          subtitle: "७ Vibhaktis (Cases) × ३ Vacanas (Numbers) — Masculine Nominal Declension",
          rows: [
            { name: "Prathamā (Nominative)", sanskritName: "प्रथमा", meaning: "Subject / Kartā", forms: [`${stem}ः`, `${stem}ौ`, `${stem}ाः`] },
            { name: "Dvitīyā (Accusative)", sanskritName: "द्वितीया", meaning: "Direct Object / Karma", forms: [`${stem}म्`, `${stem}ौ`, `${stem}ान्`] },
            { name: "Tṛtīyā (Instrumental)", sanskritName: "तृतीया", meaning: "By / With (Karaṇa)", forms: [`${stem}ेण`, `${stem}ाभ्याम्`, `${stem}ैः`] },
            { name: "Caturthī (Dative)", sanskritName: "चतुर्थी", meaning: "For / Unto (Sampradāna)", forms: [`${stem}ाय`, `${stem}ाभ्याम्`, `${stem}ेभ्यः`] },
            { name: "Pañcamī (Ablative)", sanskritName: "पञ्चमी", meaning: "From / Separation", forms: [`${stem}ात्`, `${stem}ाभ्याम्`, `${stem}ेभ्यः`] },
            { name: "Ṣaṣṭhī (Genitive)", sanskritName: "षष्ठी", meaning: "Of / Belonging to", forms: [`${stem}स्य`, `${stem}योः`, `${stem}ानाम्`] },
            { name: "Saptamī (Locative)", sanskritName: "सप्तमी", meaning: "In / At / Upon", forms: [`${stem}े`, `${stem}योः`, `${stem}ेषु`] }
          ]
        };
      }
    } else {
      // 3 PERSONS × 3 NUMBERS (3 × 3 Verbal Grid)
      const actionWord = currentResult.sanskrit;
      const isAtmanepada = currentResult.atmanepada || actionWord.endsWith('ते') || actionWord.endsWith('ताम्') || actionWord.endsWith('ेत');
      const mood = currentResult.tenseMood || "Present (Laṭ)";

      let base = actionWord.replace(/(ति|ते|तु|ताम्|त्|ेत)$/, '');

      let r1: [string, string, string];
      let r2: [string, string, string];
      let r3: [string, string, string];

      if (currentResult.tag.includes('लोट्')) {
        // Imperative
        r1 = isAtmanepada ? [`${base}ताम्`, `${base}ेताम्`, `${base}न्ताम्`] : [`${base}तु`, `${base}ताम्`, `${base}न्तु`];
        r2 = isAtmanepada ? [`${base}स्व`, `${base}ेथाम्`, `${base}ध्वम्`] : [`${base}`, `${base}तम्`, `${base}त`];
        r3 = isAtmanepada ? [`${base}ै`, `${base}ावहै`, `${base}ामहै`] : [`${base}ानि`, `${base}ाव`, `${base}ाम`];
      } else if (currentResult.tag.includes('विधिलिङ्')) {
        // Optative
        r1 = isAtmanepada ? [`${base}ेत`, `${base}ेयाताम्`, `${base}ेरन्`] : [`${base}ेत्`, `${base}ेताम्`, `${base}ेयुः`];
        r2 = isAtmanepada ? [`${base}ेथाः`, `${base}ेयाथाम्`, `${base}ेध्वम्`] : [`${base}ेः`, `${base}ेतम्`, `${base}ेत`];
        r3 = isAtmanepada ? [`${base}ेय`, `${base}ेवहि`, `${base}ेमहि`] : [`${base}ेयम्`, `${base}ेव`, `${base}ेम`];
      } else {
        // Standard Present (Laṭ)
        r1 = isAtmanepada ? [`${base}ते`, `${base}ेते`, `${base}न्ते`] : [`${base}ति`, `${base}तः`, `${base}न्ति`];
        r2 = isAtmanepada ? [`${base}से`, `${base}ेथे`, `${base}ध्वे`] : [`${base}सि`, `${base}थः`, `${base}थ`];
        r3 = isAtmanepada ? [`${base}े`, `${base}ावहे`, `${base}ामहे`] : [`${base}मि`, `${base}ावः`, `${base}ामः`];
      }

      return {
        type: 'kriya' as const,
        title: `${actionWord} [${currentResult.tag}]`,
        subtitle: `३ Puruṣas × ३ Vacanas — ${mood}`,
        rows: [
          { name: "Prathama Puruṣa (3rd Person)", sanskritName: "प्रथमपुरुषः", meaning: "He / She / They", forms: r1 },
          { name: "Madhyama Puruṣa (2nd Person)", sanskritName: "मध्यमपुरुषः", meaning: "You (singular/dual/plural)", forms: r2 },
          { name: "Uttama Puruṣa (1st Person)", sanskritName: "उत्तमपुरुषः", meaning: "I / We two / We all", forms: r3 }
        ]
      };
    }
  }, [suffixTargetType, currentResult]);

  const activeMatrixRow = dynamicMatrixData.rows[selectedRowIndex % dynamicMatrixData.rows.length];
  const activeMatrixCellForm = activeMatrixRow.forms[selectedColIndex % 3];

  // Dynamic Etymology Data
  const currentEtymology: EtymologyData = useMemo(() => {
    const isNama = suffixTargetType === 'nama';
    const sutraTitle = isNama
      ? `कृत्तद्धितसमासाश्च (१.२.४६) — [${currentResult.tag}]`
      : `तिप्तस्झिसिप्थस्थ... (३.४.७८) — [${currentResult.tag}]`;

    return {
      sutra: sutraTitle,
      sutraNumber: isNama ? "अष्टाध्यायी १.२.४६ / ३.३.१८" : "अष्टाध्यायी ३.४.७८ / ३.१.६८",
      sutraType: isNama ? "कृदन्त / सुबन्त प्रक्रिया" : "तिङन्त / सार्वधातुक प्रक्रिया",
      sutraExplanation: isNama
        ? `The root sound '${currentDhatu.sanskrit}' combines with affix '${currentResult.tag}' to create the Name Word '${currentResult.sanskrit}'. Pāṇinian sūtra १.२.४६ grants Prātipadika status, generating the 7 × 3 nominal paradigm table.`
        : `The root '${currentDhatu.sanskrit}' takes the personal inflectional affix '${currentResult.tag}' to create the Action Word '${currentResult.sanskrit}', generating the 3 × 3 verbal conjugation matrix.`,
      derivationSteps: [
        {
          step: 1,
          title: isNama ? `Affixation of ${currentResult.tag}` : `Affixation of ${currentResult.tag}`,
          sutraRule: isNama ? "कृदतिङ् (३.१.९३)" : "कर्तरि शप् (३.१.६८)",
          description: isNama 
            ? `Root takes nominal suffix '${currentResult.tag}' to denote the noun/state: ${currentResult.meaning}.`
            : `Root takes conjugational marker for active voice: ${currentResult.meaning}.`,
          intermediate: `${currentUpasarga.isNone ? '' : currentUpasarga.sanskrit + ' + '}${currentDhatu.sanskrit} + ${currentResult.tag}`
        },
        {
          step: 2,
          title: "Morphophonemic Synthesis",
          sutraRule: "अचोऽन्त्यादि टि / सार्वधातुके",
          description: "Internal phonetic sandhi fuses prefix, radical root sound, and thematic affix.",
          intermediate: currentResult.sanskrit
        },
        {
          step: 3,
          title: isNama ? "7 × 3 Subanta Declension Matrix" : "3 × 3 Tiṅanta Conjugation Matrix",
          sutraRule: "सुप्तिङन्तं पदम् (१.४.१४)",
          description: isNama
            ? `Inflected into 7 cases (Vibhaktis) across singular, dual, and plural.`
            : `Conjugated into 3 persons across 3 numbers for ${currentResult.tenseMood || 'Laṭ'}.`,
          intermediate: dynamicMatrixData.title
        }
      ],
      poeticNuance: isNama
        ? `A Name Word represents established reality (सिद्धभाव) — an enduring ontological substance.`
        : `An Action Word captures unfolding dynamism (साध्यभाव) — the living pulse of movement and will.`,
      literaryContext: `Demonstrates the deep versatility of Sanskrit roots yielding diverse nominal and verbal derivatives.`,
      exampleSentence: {
        sanskrit: isNama 
          ? `${currentResult.sanskrit} मङ्गलं विधत्ते सताम्।` 
          : `${currentResult.sanskrit} धीरो जनः सदा धर्मे।`,
        iast: isNama 
          ? `${currentResult.iast} maṅgalaṃ vidhatte satām.` 
          : `${currentResult.iast} dhīro janaḥ sadā dharme.`,
        translation: isNama
          ? `The sacred derivative '${currentResult.sanskrit}' confers auspicious grace upon the good.`
          : `The noble soul acts and perseveres steadfastly in righteousness.`,
        source: "Classical Sanskrit Formulation"
      }
    };
  }, [suffixTargetType, currentDhatu, currentUpasarga, currentResult, dynamicMatrixData]);

  // Audio Speech Synthesis
  const speakSanskrit = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Upasarga Cycling across ALL 22 STANDARD UPASARGAS
  const cycleUpasarga = () => {
    if (!currentDhatu.canHavePrefix) {
      showToast(`Selected root '${currentDhatu.sanskrit}' is a nominal stem (प्रातिपदिक) and cannot take verbal Upasargas.`);
      return;
    }
    setSavedUpasargaIndex((prev) => (prev + 1) % STANDARD_22_UPASARGAS.length);
  };

  // Root cycling
  const cycleDhatu = () => {
    if (dhatuMode === 'dial') {
      const nextIdx = (dhatuIndex + 1) % DHATUS.length;
      setDhatuIndex(nextIdx);

      const nextDhatu = DHATUS[nextIdx];
      if (!nextDhatu.canHavePrefix) {
        setSuffixTargetType('nama');
        showToast(`'${nextDhatu.sanskrit}' is a Nominal Stem (प्रातिपदिक). Switched to Name Word 7 × 3.`);
      }
    }
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Bookmark / Save to Notebook
  const saveActiveExpression = (type: 'equation' | 'matrix' | 'etymology') => {
    let newEntry: SavedExpression;

    if (type === 'equation') {
      const prefixStr = currentUpasarga.isNone ? "(विना)" : currentUpasarga.sanskrit;
      newEntry = {
        id: `eq-${Date.now()}`,
        sanskrit: `${prefixStr} + ${currentDhatu.sanskrit} = ${currentResult.sanskrit} [${currentResult.tag}]`,
        iast: `${currentUpasarga.iast} + ${currentDhatu.iast} -> ${currentResult.iast}`,
        meaning: `${currentResult.meaning} (${suffixTargetType === 'kriya' ? 'Action Word' : 'Name Word'})`,
        sourceType: 'equation',
        details: currentResult.context,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else if (type === 'matrix') {
      newEntry = {
        id: `mat-${Date.now()}`,
        sanskrit: activeMatrixCellForm,
        iast: `${activeMatrixRow.sanskritName} [${VACANA_HEADERS[selectedColIndex].sanskrit}]`,
        meaning: `${activeMatrixRow.name} (${VACANA_HEADERS[selectedColIndex].english})`,
        sourceType: 'matrix',
        details: dynamicMatrixData.title,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      newEntry = {
        id: `ety-${Date.now()}`,
        sanskrit: `${currentResult.sanskrit} : ${currentEtymology.sutra}`,
        iast: currentEtymology.sutraNumber,
        meaning: currentEtymology.sutraExplanation.slice(0, 75) + "...",
        sourceType: 'etymology',
        details: currentEtymology.sutraType,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    setSavedExpressions(prev => {
      if (prev.some(p => p.sanskrit === newEntry.sanskrit)) return prev;
      return [newEntry, ...prev];
    });
    showToast(`Saved '${newEntry.sanskrit}' to Notebook.`);
  };

  const removeSavedExpression = (id: string) => {
    setSavedExpressions(prev => prev.filter(item => item.id !== id));
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-indigo-600/[0.07] blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-12 right-12 w-[600px] h-[500px] bg-purple-600/[0.05] blur-[170px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 left-10 w-[450px] h-[450px] bg-cyan-600/[0.04] blur-[160px] pointer-events-none rounded-full" />

      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0f17]/75 border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo / Brand Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep('equation')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Atom className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">Sanskrit Morph Engine</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  {suffixTargetType === 'kriya' ? 'Action (3×3)' : 'Name (7×3)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                MORPHOLOGICAL EQUATION · PARADIGM MATRIX · ETYMOLOGY
              </p>
            </div>
          </div>

          {/* THREE UNIFIED FLOATING NAVIGATION TABS */}
          <nav className="flex items-center p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl shadow-inner backdrop-blur-md">
            
            {/* Step 1 Tab */}
            <button
              onClick={() => setCurrentStep('equation')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
                currentStep === 'equation' 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-sm border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-indigo-400" />
              <span>Step 1: Equation Dial</span>
            </button>

            {/* Step 2 Tab */}
            <button
              onClick={() => setCurrentStep('matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
                currentStep === 'matrix' 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-sm border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Step 2: Paradigm Matrix</span>
            </button>

            {/* Step 3 Tab */}
            <button
              onClick={() => setCurrentStep('etymology')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
                currentStep === 'etymology' 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-sm border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Step 3: Etymology & Sūtras</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNotebookOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl transition-all"
              title="Open Saved Notebook Drawer"
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Notebook</span>
              {savedExpressions.length > 0 && (
                <span className="w-4 h-4 text-[10px] rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono">
                  {savedExpressions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                const targetText = currentStep === 'equation' 
                  ? currentResult.sanskrit 
                  : currentStep === 'matrix' 
                    ? activeMatrixCellForm 
                    : currentEtymology.sutra.split(' ')[0];
                speakSanskrit(targetText);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-xl transition-all shadow-sm"
              title="Speak active Sanskrit form"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-bounce text-indigo-200" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSpeaking ? "Speaking..." : "Pronounce"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN VIEWPORT CANVAS */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col items-center z-10">
        
        <AnimatePresence mode="wait">
          
          {/* ================= STEP 1: EQUATION DIAL (WORKFLOW STUDIO) ================= */}
          {currentStep === 'equation' && (
            <motion.div
              key="step1-equation-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Studio Canvas Heading */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono uppercase tracking-widest mb-3">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Explore Multiple Action & Name Word Options Below</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  Morphological Equation Studio
                </h2>
                <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1">
                  Toggle between <span className="text-indigo-300 font-medium">Action Word</span> and <span className="text-purple-300 font-medium">Name Word</span>, then choose from multiple derived forms to visually verify the paradigm matrix.
                </p>
              </div>

              {/* The Horizontal Formula Dial Architecture */}
              <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-6 my-4">
                
                {/* 1. UPASARGA (PREFIX) DIAL */}
                <div 
                  onClick={cycleUpasarga}
                  className={`group relative flex-1 w-full max-w-sm p-6 rounded-2xl border transition-all flex flex-col items-center text-center backdrop-blur-md shadow-2xl ${
                    currentDhatu.canHavePrefix 
                      ? 'bg-gradient-to-b from-white/[0.04] to-transparent border-white/[0.07] hover:border-indigo-500/50 cursor-pointer' 
                      : 'bg-white/[0.015] border-white/[0.04] cursor-not-allowed opacity-80'
                  }`}
                >
                  {/* Top Header Pill */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {currentDhatu.canHavePrefix ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPrefixQuickSelectOpen(true);
                          }}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-colors flex items-center gap-1"
                          title="Open all 22 Upasargas grid"
                        >
                          <span>All 22</span>
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 transition-colors">
                          {savedUpasargaIndex + 1}/22 ⟳
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        Locked: None
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1">
                    {currentDhatu.canHavePrefix ? "Prefix (उपसर्ग)" : "Prefix: Inactive"}
                  </div>

                  {/* Prefix Main Display */}
                  {currentDhatu.canHavePrefix ? (
                    <>
                      <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 group-hover:scale-105 transition-transform font-serif">
                        {currentUpasarga.sanskrit}
                      </div>
                      <div className="text-sm font-mono text-indigo-300 mb-1">{currentUpasarga.iast}</div>
                      <div className="text-xs text-slate-300 italic min-h-[32px] flex items-center">
                        &ldquo;{currentUpasarga.meaning}&rdquo;
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/[0.06] w-full text-[11px] text-slate-400 leading-snug">
                        {currentUpasarga.nuance}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto py-4 flex flex-col items-center">
                      <div className="text-3xl font-bold tracking-tight text-slate-500 my-2 font-mono">
                        — (None)
                      </div>
                      <div className="text-xs font-mono text-slate-400 mb-2">उपसर्गरहित (No Upasarga)</div>
                      <div className="text-[11px] text-slate-500 leading-snug p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-indigo-300 font-semibold">उपसर्गाः क्रियायोगे (१.४.५९):</span> Nominal stems do not take Upasargas.
                      </div>
                    </div>
                  )}

                  {currentDhatu.canHavePrefix && (
                    <div className="mt-2 text-[10px] text-indigo-400/70 font-mono">
                      Click to cycle all 22 Upasargas
                    </div>
                  )}
                </div>

                <div className="text-2xl font-light text-slate-600 select-none self-center">+</div>

                {/* 2. DHĀTU (ROOT SOUND) DIAL */}
                <div className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.07] hover:border-indigo-500/50 transition-all flex flex-col items-center text-center backdrop-blur-md shadow-2xl">
                  
                  {/* Mode switcher toggle */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDhatuMode(dhatuMode === 'dial' ? 'type' : 'dial');
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 transition-colors flex items-center gap-1"
                      title="Switch between Dial and Custom Type mode"
                    >
                      {dhatuMode === 'dial' ? <Keyboard className="w-3 h-3" /> : <Compass className="w-3 h-3" />}
                      <span>{dhatuMode === 'dial' ? 'Type' : 'Dial'}</span>
                    </button>
                    {dhatuMode === 'dial' && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {dhatuIndex + 1}/{DHATUS.length}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1">
                    {currentDhatu.type === 'nama' ? 'Nominal Stem (प्रातिपदिक)' : 'Root (धातु)'}
                  </div>

                  {dhatuMode === 'dial' ? (
                    <div onClick={cycleDhatu} className="w-full cursor-pointer py-1">
                      <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 group-hover:scale-105 transition-transform font-serif">
                        {currentDhatu.sanskrit}
                      </div>
                      <div className="text-sm font-mono text-indigo-300 mb-1">{currentDhatu.iast}</div>
                      <div className="text-xs text-slate-300 italic min-h-[32px] flex items-center justify-center">
                        &ldquo;{currentDhatu.meaning}&rdquo;
                      </div>
                    </div>
                  ) : (
                    <div className="w-full py-1 flex flex-col items-center">
                      <input
                        type="text"
                        value={customDhatuSanskrit}
                        onChange={(e) => setCustomDhatuSanskrit(e.target.value)}
                        placeholder="रम्"
                        className="w-36 text-center text-3xl font-bold bg-transparent border-b border-indigo-500/70 text-white focus:outline-none font-serif my-2"
                      />
                      <div className="flex gap-2 w-full mt-1">
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
                      <label className="flex items-center gap-2 mt-2 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={customIsNominal}
                          onChange={(e) => {
                            setCustomIsNominal(e.target.checked);
                            if (e.target.checked) setSuffixTargetType('nama');
                          }}
                          className="rounded bg-white/5 border-white/10 text-indigo-600 focus:ring-0"
                        />
                        <span>Nominal Noun Stem (No Prefix)</span>
                      </label>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06] w-full text-[11px] text-slate-400">
                    <span className="text-indigo-300 font-mono">{currentDhatu.canHavePrefix ? "Takes Upasargas" : "Upasargas Disabled"}</span> · {currentDhatu.gana}
                  </div>

                  <div className="mt-2 text-[10px] text-indigo-400/70 font-mono">
                    Click to cycle roots
                  </div>
                </div>

                <div className="text-2xl font-light text-slate-600 select-none self-center">=</div>

                {/* 3. SUFFIX DIAL: HIGH-LEVEL TOGGLE + MULTI-OPTION EXPLORATION */}
                <div 
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-indigo-950/35 via-indigo-900/10 to-transparent border border-indigo-500/35 hover:border-indigo-500/75 transition-all flex flex-col items-center text-center backdrop-blur-md shadow-2xl"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
                      {activeOptionIndex + 1}/{activeOptionList.length}
                    </span>
                  </div>
                  
                  <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-mono mb-2">
                    Suffix Dial (प्रत्यय-प्रक्रिया)
                  </div>

                  {/* 1. HIGH-LEVEL TOGGLE: ACTION WORD vs NAME WORD */}
                  <div className="w-full mb-3 p-1 rounded-xl bg-black/40 border border-white/10 flex items-center gap-1 shadow-inner backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSuffixTargetType('kriya');
                        showToast("Switched to Action Word (3 × 3 Verbal Matrix).");
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                        suffixTargetType === 'kriya'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Action Word (क्रिया)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSuffixTargetType('nama');
                        showToast("Switched to Name Word (7 × 3 Nominal Matrix).");
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                        suffixTargetType === 'nama'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Name Word (नाम)</span>
                    </button>
                  </div>

                  {/* 2. MULTI-OPTION EXPLORATION CHIPS (Options available for that specific root!) */}
                  <div className="w-full flex items-center justify-between gap-1 mb-2">
                    <button
                      onClick={() => cycleOption(-1)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Previous Option"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 flex flex-wrap items-center justify-center gap-1.5">
                      {activeOptionList.map((opt, idx) => {
                        const isSelected = (activeOptionIndex % activeOptionList.length) === idx;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              if (suffixTargetType === 'kriya') {
                                setSelectedActionIndex(idx);
                              } else {
                                setSelectedNameIndex(idx);
                              }
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-all ${
                              isSelected
                                ? 'bg-indigo-500/30 border border-indigo-400/60 text-white font-semibold shadow-sm'
                                : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.05]'
                            }`}
                          >
                            <span>{opt.sanskrit}</span>
                            <span className="text-[9px] text-indigo-300/80 ml-1">({opt.tag.split(' ')[0]})</span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => cycleOption(1)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title="Next Option"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Derivative Result Display (Click to cycle options) */}
                  <div 
                    onClick={() => cycleOption(1)}
                    className="cursor-pointer py-1 group/res w-full flex flex-col items-center"
                    title="Click to cycle next available derivative"
                  >
                    <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-1 group-hover/res:scale-105 transition-transform font-serif text-indigo-100">
                      {currentResult.sanskrit}
                    </div>
                    <div className="text-sm font-mono text-indigo-300 mb-0.5">{currentResult.iast}</div>
                    <div className="text-xs text-slate-200 italic min-h-[28px] flex items-center justify-center">
                      &ldquo;{currentResult.meaning}&rdquo;
                    </div>
                  </div>

                  {/* Context and Navigation Pill */}
                  <div className="mt-2 pt-2.5 border-t border-indigo-500/20 w-full flex flex-col items-center gap-1">
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      {suffixTargetType === 'kriya' 
                        ? "Matrix: 3 Persons × 3 Numbers (3 × 3)" 
                        : "Matrix: 7 Cases × 3 Numbers (7 × 3)"}
                    </div>

                    <button
                      onClick={() => setCurrentStep('matrix')}
                      className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Table className="w-3 h-3" />
                      <span>View in Paradigm Matrix Table</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Equation Action Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
                
                {/* Save to Notebook */}
                <button
                  onClick={() => saveActiveExpression('equation')}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all text-slate-300 hover:text-white"
                >
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save to Notebook</span>
                </button>

                {/* Navigate to Step 2 */}
                <button
                  onClick={() => setCurrentStep('matrix')}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/25"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>View Paradigm Matrix ({suffixTargetType === 'kriya' ? '3 × 3' : '7 × 3'})</span>
                </button>

                {/* Navigate to Step 3 */}
                <button
                  onClick={() => setCurrentStep('etymology')}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all text-indigo-300 hover:text-white"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>Explore Etymology & Sūtras</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* ================= STEP 2: PARADIGM MATRIX (DYNAMIC TABLE VIEW) ================= */}
          {currentStep === 'matrix' && (
            <motion.div
              key="step2-matrix-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Matrix Header Navigation Controls & Synced High-Level Toggle */}
              <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <button
                  onClick={() => setCurrentStep('equation')}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1: Equation</span>
                </button>

                {/* SYNCED HIGH-LEVEL TOGGLE & DERIVATIVE SELECTION PILLS */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  
                  {/* Action vs Name toggle */}
                  <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 shadow-inner">
                    <button
                      onClick={() => {
                        setSuffixTargetType('kriya');
                        showToast("Matrix dynamically switched to 3 × 3 Action Word (Verbal) Conjugation.");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                        suffixTargetType === 'kriya'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Action Word (3 × 3)</span>
                    </button>

                    <button
                      onClick={() => {
                        setSuffixTargetType('nama');
                        showToast("Matrix dynamically switched to 7 × 3 Name Word (Nominal) Declension.");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                        suffixTargetType === 'nama'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Name Word (7 × 3)</span>
                    </button>
                  </div>

                  {/* Sub-option pills for that category */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    {activeOptionList.map((opt, idx) => {
                      const isSelected = (activeOptionIndex % activeOptionList.length) === idx;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (suffixTargetType === 'kriya') {
                              setSelectedActionIndex(idx);
                            } else {
                              setSelectedNameIndex(idx);
                            }
                            showToast(`Paradigm Matrix recomputed for '${opt.sanskrit}'.`);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-serif transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {opt.sanskrit}
                        </button>
                      );
                    })}
                  </div>

                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    {dynamicMatrixData.type === 'nama' ? '7 × 3 Nominal Grid' : '3 × 3 Verbal Grid'}
                  </span>
                  <button
                    onClick={() => setCurrentStep('etymology')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors text-indigo-300"
                  >
                    <span>Step 3: Etymology</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Explanatory Lead */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  {dynamicMatrixData.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                  {dynamicMatrixData.subtitle}. Click any cell to update active form, hear pronunciation, and highlight paradigm cell.
                </p>
              </div>

              {/* CLUTTER-FREE TRANSPARENT MATRIX GRID */}
              <div className="w-full overflow-x-auto my-2 pb-4">
                <div className="min-w-[720px] grid grid-cols-4 gap-2 text-sm">
                  
                  {/* Top-Left Header: Category */}
                  <div className="p-3 text-xs font-mono uppercase tracking-wider text-slate-500 border-b border-white/[0.06] flex items-center">
                    {dynamicMatrixData.type === 'nama' ? 'Vibhakti (Case)' : 'Puruṣa (Person)'}
                  </div>

                  {/* Vacana Columns (Singular, Dual, Plural) */}
                  {VACANA_HEADERS.map((header, colIdx) => (
                    <div key={colIdx} className="p-3 text-center border-b border-white/[0.06]">
                      <div className="text-xs font-serif font-semibold text-indigo-300">{header.sanskrit}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{header.english}</div>
                    </div>
                  ))}

                  {/* Matrix Data Rows */}
                  {dynamicMatrixData.rows.map((row, rowIdx) => (
                    <React.Fragment key={rowIdx}>
                      
                      {/* Row Label (Case / Person) */}
                      <div className="p-4 flex flex-col justify-center border-b border-white/[0.03] text-left">
                        <span className="text-sm font-semibold text-white font-serif">{row.sanskritName}</span>
                        <span className="text-[11px] text-slate-400">{row.name}</span>
                        <span className="text-[10px] text-slate-500 italic">{row.meaning}</span>
                      </div>

                      {/* 3 Number Form Cells */}
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
                            className={`group relative p-4 flex flex-col items-center justify-center cursor-pointer transition-all rounded-xl border ${
                              isSelected 
                                ? 'bg-indigo-600/15 border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.25)] text-indigo-100' 
                                : 'border-transparent hover:bg-white/[0.03] text-slate-200'
                            }`}
                          >
                            <span className={`text-2xl md:text-3xl font-serif font-bold tracking-tight transition-transform group-hover:scale-105 ${
                              isSelected ? 'text-indigo-200' : 'text-slate-100'
                            }`}>
                              {form}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 mt-1">
                              {VACANA_HEADERS[colIdx].sanskrit}
                            </span>

                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}

                </div>
              </div>

              {/* Active Matrix Cell Details Card */}
              <div className="w-full max-w-3xl mt-4 p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1">
                    SELECTED PARADIGM CELL ({suffixTargetType === 'kriya' ? 'ACTION' : 'NAME'})
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-serif font-bold text-white">{activeMatrixCellForm}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeMatrixRow.sanskritName} · {VACANA_HEADERS[selectedColIndex].sanskrit} ({VACANA_HEADERS[selectedColIndex].english})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => speakSanskrit(activeMatrixCellForm)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-slate-300 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pronounce</span>
                  </button>

                  <button
                    onClick={() => saveActiveExpression('matrix')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save to Notebook</span>
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* ================= STEP 3: ETYMOLOGY & SŪTRAS ================= */}
          {currentStep === 'etymology' && (
            <motion.div
              key="step3-etymology-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Back to Step 2 and Sub-Header */}
              <div className="w-full flex items-center justify-between gap-4 mb-6">
                <button
                  onClick={() => setCurrentStep('matrix')}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 2: Paradigm Matrix</span>
                </button>

                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Pāṇinian Aṣṭādhyāyī Analysis ({suffixTargetType === 'kriya' ? 'Tiṅanta' : 'Subanta'})</span>
                </div>
              </div>

              {/* Central Title */}
              <div className="text-center mb-8">
                <span className="text-xs tracking-widest text-indigo-400 uppercase font-mono mb-2 block">
                  MORPHOLOGICAL DERIVATION & SŪTRAS
                </span>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  {currentUpasarga.isNone ? "केवल-धातु" : `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit}`} = {currentResult.sanskrit}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Morphological deconstruction for <span className="text-indigo-300 font-semibold">{suffixTargetType === 'kriya' ? 'Action Word (क्रियापदम्)' : 'Name Word (नामपदम्)'}</span> according to Pāṇinian sūtras.
                </p>
              </div>

              {/* THREE-TIER ANALYSIS CARD SYSTEM */}
              <div className="w-full max-w-4xl space-y-6">
                
                {/* 1. PRIMARY PĀṆINIAN SŪTRA CARD */}
                <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.07] backdrop-blur-md shadow-2xl relative">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                      <ScrollText className="w-3.5 h-3.5" />
                      <span>Primary Pāṇinian Sūtra</span>
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40 text-indigo-300">
                      {currentEtymology.sutraNumber}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-wide my-2">
                    &ldquo;{currentEtymology.sutra}&rdquo;
                  </h3>

                  <div className="text-xs text-indigo-300/80 font-mono mb-3">
                    Type: {currentEtymology.sutraType}
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-serif">
                    {currentEtymology.sutraExplanation}
                  </p>
                </div>

                {/* 2. STEP-BY-STEP MORPHOLOGICAL DERIVATION */}
                <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-6">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
                      Step-by-Step Derivation Process
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentEtymology.derivationSteps.map((stepItem) => (
                      <div 
                        key={stepItem.step}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-2">
                            <span>STEP 0{stepItem.step}</span>
                            <span className="text-indigo-400 font-semibold">{stepItem.sutraRule.split(' ')[0]}</span>
                          </div>
                          <h5 className="text-xs font-semibold text-white mb-1.5">
                            {stepItem.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 leading-normal mb-3">
                            {stepItem.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-white/[0.04] text-xs font-mono text-indigo-300 font-bold">
                          {stepItem.intermediate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. POETIC NUANCE & EXAMPLE CONTEXT SENTENCE */}
                <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] backdrop-blur-md space-y-6">
                  
                  {/* Poetic Nuance */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Feather className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
                        Semantic Nuance & Pāṇinian Rule Application
                      </h4>
                    </div>
                    <p className="text-sm text-slate-300 italic font-serif leading-relaxed">
                      &ldquo;{currentEtymology.poeticNuance}&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {currentEtymology.literaryContext}
                    </p>
                  </div>

                  {/* Classical Sentence Example */}
                  <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-1 flex items-center justify-between">
                      <span>LITERARY CONTEXT & USAGE EXAMPLE</span>
                      <span>{currentEtymology.exampleSentence.source}</span>
                    </div>
                    <div className="text-xl font-serif text-white font-bold my-2">
                      {currentEtymology.exampleSentence.sanskrit}
                    </div>
                    <div className="text-xs font-mono text-indigo-300/80 mb-2">
                      {currentEtymology.exampleSentence.iast}
                    </div>
                    <div className="text-xs text-slate-300 italic">
                      &ldquo;{currentEtymology.exampleSentence.translation}&rdquo;
                    </div>
                  </div>

                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
                  <button
                    onClick={() => saveActiveExpression('etymology')}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-slate-300 hover:text-white transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Save Analysis to Notebook</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep('equation')}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    <span>Return to Workflow Studio</span>
                  </button>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* ================= MODAL: ALL 22 UPASARGAS QUICK-SELECT ================= */}
      <AnimatePresence>
        {isPrefixQuickSelectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrefixQuickSelectOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c111a] border border-white/[0.08] rounded-2xl p-6 overflow-y-auto shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">The 22 Sanskrit Upasargas (द्वाविंशति उपसर्गाः)</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Select any prefix to apply to root sound &lsquo;{currentDhatu.sanskrit}&rsquo;
                  </p>
                </div>
                <button
                  onClick={() => setIsPrefixQuickSelectOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {STANDARD_22_UPASARGAS.map((upasarga, idx) => {
                  const isSelected = savedUpasargaIndex === idx && currentDhatu.canHavePrefix;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSavedUpasargaIndex(idx);
                        setIsPrefixQuickSelectOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-indigo-600/20 border-indigo-400/50 shadow-md shadow-indigo-500/10' 
                          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-2xl font-bold font-serif text-white">{upasarga.sanskrit}</span>
                        <span className="text-[11px] font-mono text-indigo-300">{upasarga.iast}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mb-1 line-clamp-1">
                        {upasarga.meaning}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {upasarga.nuance}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= SAVED NOTEBOOK DRAWER / SLIDE-OVER ================= */}
      <AnimatePresence>
        {isNotebookOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotebookOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md h-full bg-[#0d121c] border-l border-white/[0.08] p-6 flex flex-col justify-between shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <BookMarked className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-base font-semibold text-white">Saved Notebook</h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {savedExpressions.length} bookmarked expression{savedExpressions.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsNotebookOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="mt-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                  {savedExpressions.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl p-6">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400 mb-1">Your Notebook is Empty</p>
                      <p className="text-xs text-slate-500">
                        Click &ldquo;Save to Notebook&rdquo; in the Equation Dial, Paradigm Matrix, or Etymology view to store expressions here.
                      </p>
                    </div>
                  ) : (
                    savedExpressions.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-all group flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-indigo-300">
                            {item.sourceType}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.savedAt}
                          </span>
                        </div>

                        <div className="text-lg font-serif font-bold text-white">
                          {item.sanskrit}
                        </div>

                        <div className="text-xs font-mono text-indigo-300/80">
                          {item.iast}
                        </div>

                        <div className="text-xs text-slate-400">
                          {item.meaning}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
                          <button
                            onClick={() => speakSanskrit(item.sanskrit)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/5 transition-colors"
                            title="Pronounce"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => copyToClipboard(item.sanskrit, item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/5 transition-colors"
                            title="Copy text"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => removeSavedExpression(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              {savedExpressions.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => setSavedExpressions([])}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsNotebookOpen(false)}
                    className="px-4 py-2 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= PERSISTENT VOICE GUIDE & WAVEFORM NARRATIVE FOOTER ================= */}
      <footer className="sticky bottom-0 w-full bg-[#070a10]/95 backdrop-blur-xl border-t border-white/[0.06] py-4 px-6 z-30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Audio Waveform Equalizer & Voice Status */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/60 shadow-inner">
              <Mic className="w-4 h-4 text-indigo-400 animate-pulse" />
              {voiceActive && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  VOICE NARRATIVE GUIDE
                </span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${voiceActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>

              {/* Real-time Animated Waveform Equalizer */}
              <div className="flex items-center gap-1.5 mt-1 h-5">
                {[4, 12, 8, 16, 20, 10, 14, 6, 18, 10, 12, 5].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: voiceActive ? [h * 0.4, h * 1.4, h * 0.6, h * 0.4] : 3 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.1 + (i % 3) * 0.2, 
                      ease: "easeInOut",
                      delay: i * 0.08 
                    }}
                    className={`w-1 rounded-full transition-colors ${voiceActive ? 'bg-indigo-400/80' : 'bg-slate-600'}`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Center: Live Dynamic Grammatical Narrative */}
          <div className="flex-1 max-w-2xl px-4 text-center md:text-left">
            <p className="text-xs md:text-sm text-slate-300 font-serif leading-relaxed">
              {currentStep === 'equation' && (
                <>
                  &ldquo;Root <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentDhatu.sanskrit}&rsquo;</span> with prefix <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentUpasarga.sanskrit}&rsquo;</span> derived as {suffixTargetType === 'kriya' ? 'Action Word' : 'Name Word'} <span className="text-white font-sans font-bold">&lsquo;{currentResult.sanskrit}&rsquo;</span> ({currentResult.tag}). Generates {suffixTargetType === 'kriya' ? '3 × 3 verbal matrix' : '7 × 3 nominal matrix'}.&rdquo;
                </>
              )}
              {currentStep === 'matrix' && (
                <>
                  &ldquo;Visualizing <span className="text-indigo-300 font-sans font-semibold">{dynamicMatrixData.title}</span> ({suffixTargetType === 'kriya' ? '3 × 3 Action Conjugation' : '7 × 3 Name Declension'}). Selected cell <span className="text-white font-sans font-bold">&lsquo;{activeMatrixCellForm}&rsquo;</span>.&rdquo;
                </>
              )}
              {currentStep === 'etymology' && (
                <>
                  &ldquo;Pāṇinian analysis for <span className="text-indigo-300 font-sans font-semibold">{currentResult.sanskrit}</span> ({currentResult.tag}): governed by <span className="text-indigo-300 font-sans font-semibold">{currentEtymology.sutraNumber}</span>.&rdquo;
                </>
              )}
            </p>
          </div>

          {/* Right: Audio Pronounce & Voice Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                const textToSpeak = currentStep === 'equation' 
                  ? currentResult.sanskrit 
                  : currentStep === 'matrix' 
                    ? activeMatrixCellForm 
                    : currentEtymology.sutra.split(' ')[0];
                speakSanskrit(textToSpeak);
              }}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>

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
