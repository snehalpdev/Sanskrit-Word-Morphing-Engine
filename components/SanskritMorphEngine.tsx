'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Sparkles, RefreshCw, Bookmark, 
  Keyboard, Compass, Mic, Atom, BookOpen, Grid, Layers, ArrowRight, ArrowLeft,
  Check, Copy, Trash2, X, ScrollText, Feather,
  Workflow, Table, BookMarked, ShieldAlert, CheckCircle2, ChevronDown
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
}

interface SuffixResult {
  sanskrit: string;
  iast: string;
  meaning: string;
  context: string;
  category: 'tinanta' | 'krdanta' | 'subanta';
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
  { 
    sanskrit: "प्र", 
    iast: "pra", 
    meaning: "Forward, forth, intensive, preeminent", 
    nuance: "Denotes motion forward, excess (प्रकर्ष), manifestation or superior excellence in action." 
  },
  { 
    sanskrit: "परा", 
    iast: "parā", 
    meaning: "Away, back, far away, gone, reversal", 
    nuance: "Signifies reversal (पराभव), opposition, defeat, or departure away from origin." 
  },
  { 
    sanskrit: "अप", 
    iast: "apa", 
    meaning: "Away, away from, off, negative, deviation", 
    nuance: "Denotes taking away, deterioration, offense (अपकार), loss or negative deflection." 
  },
  { 
    sanskrit: "सम्", 
    iast: "sam", 
    meaning: "Together, completely, full, perfected, harmony", 
    nuance: "Signifies perfection, auspicious union (सम्यक्), comprehensive completeness or sacred refinement." 
  },
  { 
    sanskrit: "अनु", 
    iast: "anu", 
    meaning: "After, along, following, in accordance with", 
    nuance: "Denotes imitation, succession, subordination, or continuous harmonious accompaniment (अनुगमन)." 
  },
  { 
    sanskrit: "अव", 
    iast: "ava", 
    meaning: "Down, downward, off, under, comprehension", 
    nuance: "Indicates descent (अवतार), thorough comprehension (अवगम), or depreciation." 
  },
  { 
    sanskrit: "निस्", 
    iast: "nis", 
    meaning: "Out, out of, away (becomes निर् nir / निश्)", 
    nuance: "Represents motion outwards (निर्गमन), absence, certainty, or complete elimination." 
  },
  { 
    sanskrit: "निर्", 
    iast: "nir", 
    meaning: "Out, away, without, completely, free from", 
    nuance: "Signifies total extraction, being devoid of (निर्धन), definitive certainty, or liberation." 
  },
  { 
    sanskrit: "दुस्", 
    iast: "dus", 
    meaning: "Bad, difficult, hard, wicked (becomes दुर्/दुश्)", 
    nuance: "Denotes evil, hardship (दुष्कर), pain, moral difficulty, or reprobation." 
  },
  { 
    sanskrit: "दुर्", 
    iast: "dur", 
    meaning: "Bad, hard, difficult, troublesome", 
    nuance: "Indicates adversity (दुर्लभ), corruption, affliction, or strenuous obstacle." 
  },
  { 
    sanskrit: "वि", 
    iast: "vi", 
    meaning: "Apart, separate, distinct, intensive, without", 
    nuance: "Implies distribution, analytical distinction (विशेष), variance, or peaceful cessation." 
  },
  { 
    sanskrit: "आ", 
    iast: "ā (āṅ)", 
    meaning: "Here, near, towards, up to, reversal, all around", 
    nuance: "Indicates spatial reversal (आङ् मर्यादाभिविध्योः), inward arrival, or all-pervading scope." 
  },
  { 
    sanskrit: "नि", 
    iast: "ni", 
    meaning: "In, into, down, inward, firmly settled", 
    nuance: "Implies downward fixation (नितराम्), inward depth, residence (निवास), or quiet meditative composure." 
  },
  { 
    sanskrit: "अधि", 
    iast: "adhi", 
    meaning: "Above, over, upon, superior, sovereign mastery", 
    nuance: "Denotes sovereignty, presiding authority (आधिपत्य), scholarly attainment, or mastery." 
  },
  { 
    sanskrit: "अपि", 
    iast: "api", 
    meaning: "Close to, proximate, also, over, covered", 
    nuance: "Represents concealment (अपिधान), proximity, closure, or intimate attachment." 
  },
  { 
    sanskrit: "अति", 
    iast: "ati", 
    meaning: "Beyond, over, excessive, very, surpassing", 
    nuance: "Signifies transcending natural limits (अतिक्रमण), intensity, excess, or supreme degree." 
  },
  { 
    sanskrit: "सु", 
    iast: "su", 
    meaning: "Good, well, easy, auspicious, pleasant", 
    nuance: "Denotes auspiciousness (सुकृत), ease, sweetness, or moral excellence." 
  },
  { 
    sanskrit: "उत्", 
    iast: "ut (ud)", 
    meaning: "Up, upwards, out, elevation, emergence", 
    nuance: "Signifies upward elevation (उत्थान), sudden release of energy, or emergence of power." 
  },
  { 
    sanskrit: "अभि", 
    iast: "abhi", 
    meaning: "Towards, to, into, facing, intensely confronting", 
    nuance: "Indicates direct confrontation (आभिमुख्य), facing frontally (अभिमुख), or honoring." 
  },
  { 
    sanskrit: "प्रति", 
    iast: "prati", 
    meaning: "Against, back, towards, in return, each", 
    nuance: "Represents reflection, opposition, reciprocity (प्रतिदान), or rhythmic repetition." 
  },
  { 
    sanskrit: "परि", 
    iast: "pari", 
    meaning: "Around, about, fully, completely, encircling", 
    nuance: "Indicates comprehensive encirclement (समन्तात्), thorough inspection (परीक्षा), or total transformation." 
  },
  { 
    sanskrit: "उप", 
    iast: "upa", 
    meaning: "Near, towards, by the side of, subordinate, assisting", 
    nuance: "Denotes proximity (उपहार), discipleship (उपनिषद्), service, or gentle beginning." 
  }
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
    atmanepada: true 
  },
  { 
    sanskrit: "पठ्", 
    iast: "paṭh", 
    meaning: "to read, recite, study aloud", 
    gana: "1st Class (Bhvādi ०१.०३८१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "पठति", 
    atmanepada: false 
  },
  { 
    sanskrit: "गम्", 
    iast: "gam", 
    meaning: "to go, move, attain, walk", 
    gana: "1st Class (Bhvādi ०१.११३१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "गच्छति", 
    atmanepada: false 
  },
  { 
    sanskrit: "लिख्", 
    iast: "likh", 
    meaning: "to write, delineate, carve", 
    gana: "6th Class (Tudādi ०६.०००४)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "लिखति", 
    atmanepada: false 
  },
  { 
    sanskrit: "दृश्", 
    iast: "dṛś", 
    meaning: "to see, behold, perceive directly", 
    gana: "4th/1st Class (Divādi/Bhvādi)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "पश्यति", 
    atmanepada: false 
  },
  { 
    sanskrit: "कृ", 
    iast: "kṛ", 
    meaning: "to do, make, fashion, accomplish", 
    gana: "8th Class (Tanādi ०८.००१०)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "करोति", 
    atmanepada: false 
  },
  { 
    sanskrit: "भू", 
    iast: "bhū", 
    meaning: "to be, exist, arise, become", 
    gana: "1st Class (Bhvādi ०१.०००१)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "भवति", 
    atmanepada: false 
  },
  { 
    sanskrit: "स्था", 
    iast: "sthā", 
    meaning: "to stand, abide, remain, endure", 
    gana: "1st Class (Bhvādi ०१.१०७७)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "तिष्ठति", 
    atmanepada: false 
  },
  { 
    sanskrit: "दा", 
    iast: "dā", 
    meaning: "to give, bestow, impart", 
    gana: "3rd Class (Juhotyādi ०३.०००९)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "ददाति", 
    atmanepada: false 
  },
  { 
    sanskrit: "ज्ञा", 
    iast: "jñā", 
    meaning: "to know, understand, realize", 
    gana: "9th Class (Kryādi ०९.००३६)", 
    type: "kriya", 
    canHavePrefix: true, 
    baseVerb: "जानाति", 
    atmanepada: false 
  },
  // Nominal Noun Stems (Prātipadika) - CANNOT have Upasargas per Pāṇini 1.4.59
  { 
    sanskrit: "राम", 
    iast: "rāma", 
    meaning: "Noble person, charming one (Rama)", 
    gana: "Ajanta Puṃliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false 
  },
  { 
    sanskrit: "देव", 
    iast: "deva", 
    meaning: "Luminous being, celestial light, deity", 
    gana: "Ajanta Puṃliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false 
  },
  { 
    sanskrit: "ज्ञान", 
    iast: "jñāna", 
    meaning: "Direct gnosis, illumined insight", 
    gana: "Ajanta Napuṃsakaliṅga (Prātipadika)", 
    type: "nama", 
    canHavePrefix: false 
  }
];

// -------------------------------------------------------------
// Curated Classical Morphological Derivations
// -------------------------------------------------------------
const MORPH_RULES: Record<string, SuffixResult[]> = {
  // Pure un-prefixed verbs
  "none-रम्": [
    { sanskrit: "रमते", iast: "ramate", meaning: "he delights / takes pleasure", context: "Present Indicative (Laṭ, 3rd Person Singular Ātmanepada)", category: "tinanta" },
    { sanskrit: "रमित्वा", iast: "ramitvā", meaning: "having delighted / rested", context: "Absolutive (Ktvā Pratyaya)", category: "krdanta" },
    { sanskrit: "रमणम्", iast: "ramaṇam", meaning: "delight, sporting, pleasing", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "none-पठ्": [
    { sanskrit: "पठति", iast: "paṭhati", meaning: "he reads / recites / studies", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "पठित्वा", iast: "paṭhitvā", meaning: "having read / recited", context: "Absolutive (Ktvā)", category: "krdanta" },
    { sanskrit: "पाठः", iast: "pāṭhaḥ", meaning: "lesson, reading, recital", context: "Action Noun (Ghañ)", category: "subanta" }
  ],
  "none-गम्": [
    { sanskrit: "गच्छति", iast: "gacchati", meaning: "he goes / walks / reaches", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "गत्वा", iast: "gatvā", meaning: "having gone", context: "Absolutive (Ktvā)", category: "krdanta" },
    { sanskrit: "गमनम्", iast: "gamanam", meaning: "going, transit, departure", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "none-कृ": [
    { sanskrit: "करोति", iast: "karoti", meaning: "he does / makes / acts", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "कृत्वा", iast: "kṛtvā", meaning: "having done / performed", context: "Absolutive (Ktvā)", category: "krdanta" },
    { sanskrit: "कार्यम्", iast: "kāryam", meaning: "duty, action to be done", context: "Gerundive (Ṇyat)", category: "subanta" }
  ],
  "none-भू": [
    { sanskrit: "भवति", iast: "bhavati", meaning: "he is / becomes / happens", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "भूत्वा", iast: "bhūtvā", meaning: "having become / existed", context: "Absolutive (Ktvā)", category: "krdanta" },
    { sanskrit: "भावः", iast: "bhāvaḥ", meaning: "existence, state of being, emotion", context: "Action Noun (Ghañ)", category: "subanta" }
  ],
  "none-स्था": [
    { sanskrit: "तिष्ठति", iast: "tiṣṭhati", meaning: "he stands / abides / remains", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "स्थित्वा", iast: "sthitvā", meaning: "having stood / remained", context: "Absolutive (Ktvā)", category: "krdanta" },
    { sanskrit: "स्थानम्", iast: "sthānam", meaning: "place, position, abode", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "none-राम": [
    { sanskrit: "रामः", iast: "rāmaḥ", meaning: "Rama (Nominative Subject)", context: "Prathamā Ekavacana (Nominative Singular)", category: "subanta" },
    { sanskrit: "रामम्", iast: "rāmam", meaning: "Rama (Accusative Object)", context: "Dvitīyā Ekavacana (Accusative Singular)", category: "subanta" },
    { sanskrit: "रामेण", iast: "rāmeṇa", meaning: "By/With Rama (Instrumental Agent)", context: "Tṛtīyā Ekavacana (Instrumental Singular)", category: "subanta" }
  ],
  "none-देव": [
    { sanskrit: "देवः", iast: "devaḥ", meaning: "The luminous deity (Subject)", context: "Prathamā Ekavacana", category: "subanta" },
    { sanskrit: "देवम्", iast: "devam", meaning: "Unto the deity (Object)", context: "Dvitīyā Ekavacana", category: "subanta" }
  ],
  "none-ज्ञान": [
    { sanskrit: "ज्ञानम्", iast: "jñānam", meaning: "Direct knowledge, gnosis", context: "Prathamā Ekavacana (Neuter)", category: "subanta" },
    { sanskrit: "ज्ञानेन", iast: "jñānena", meaning: "Through illumination/knowledge", context: "Tṛtīyā Ekavacana", category: "subanta" }
  ],

  // Specific 22 Upasargas + Roots
  "प्र-रम्": [
    { sanskrit: "प्ररमते", iast: "praramate", meaning: "he delights greatly / rejoices", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "प्ररम्य", iast: "praramya", meaning: "having rejoiced / exceedingly delightful", context: "Absolutive (Lyap Pratyaya)", category: "krdanta" },
    { sanskrit: "प्ररामः", iast: "prarāmaḥ", meaning: "noble delight / ecstatic repose", context: "Primary Nominal Action Noun (Ghañ)", category: "subanta" }
  ],
  "वि-रम्": [
    { sanskrit: "विरमति", iast: "viramati", meaning: "he desists / stops / pauses", context: "Present Indicative (Laṭ, Parasmaipada by व्याङ्परिभ्यो रमः)", category: "tinanta" },
    { sanskrit: "विरामः", iast: "virāmaḥ", meaning: "cessation, pause, tranquil rest", context: "Nominal Derivative (Ghañ)", category: "subanta" },
    { sanskrit: "विरम्य", iast: "viramya", meaning: "having paused / desisted from unrest", context: "Absolutive (Lyap)", category: "krdanta" }
  ],
  "आ-रम्": [
    { sanskrit: "आरभते", iast: "ārabhate", meaning: "he undertakes / commences resolutely", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "आरम्भः", iast: "ārambhaḥ", meaning: "commencement, inception, noble undertaking", context: "Primary Nominal Derivative (Ghañ)", category: "subanta" },
    { sanskrit: "आरब्धवान्", iast: "ārabdhavān", meaning: "one who has commenced", context: "Past Active Participle (Ktavatu)", category: "krdanta" }
  ],
  "सम्-रम्": [
    { sanskrit: "संरमते", iast: "saṃramate", meaning: "he becomes intensely excited / roused", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "संरम्भः", iast: "saṃrambhaḥ", meaning: "vehemence, righteous fervor, enthusiasm", context: "Action Noun (Ghañ)", category: "subanta" }
  ],
  "परि-रम्": [
    { sanskrit: "परिरमते", iast: "pariramate", meaning: "he embraces warmly / revels around", context: "Present Indicative (Laṭ, 3rd Person)", category: "tinanta" },
    { sanskrit: "परिरम्भः", iast: "parirambhaḥ", meaning: "loving embrace, encirclement of joy", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "अनु-रम्": [
    { sanskrit: "अनुरमते", iast: "anuramate", meaning: "he is devoted to / follows with delight", context: "Present Indicative (Laṭ, 3rd Person)", category: "tinanta" },
    { sanskrit: "अनुरागः", iast: "anurāgaḥ", meaning: "deep affectionate attachment, love", context: "Nominal Derivative", category: "subanta" }
  ],
  "उप-रम्": [
    { sanskrit: "उपरमति", iast: "uparamati", meaning: "he ceases from worldly desire / finds quiet", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "उपरमः", iast: "uparamaḥ", meaning: "tranquil cessation, withdrawal of senses", context: "Vedantic Virtue", category: "subanta" }
  ],
  "अभि-रम्": [
    { sanskrit: "अभिरमते", iast: "abhiramate", meaning: "he revels contentedly / finds inward peace", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अभिरामः", iast: "abhirāmaḥ", meaning: "exquisitely charming, delightfully serene", context: "Classical Epithet", category: "subanta" }
  ],

  // गम् combinations
  "आ-गम्": [
    { sanskrit: "आगच्छति", iast: "āgacchati", meaning: "he comes / arrives", context: "Present Indicative (Laṭ, 3rd Person Singular)", category: "tinanta" },
    { sanskrit: "आगमनम्", iast: "āgamanam", meaning: "arrival, incoming presence", context: "Action Noun (Lyut)", category: "subanta" },
    { sanskrit: "आगत्य", iast: "āgatya", meaning: "having arrived / having approached", context: "Absolutive (Lyap)", category: "krdanta" }
  ],
  "अनु-गम्": [
    { sanskrit: "अनुगच्छति", iast: "anugacchati", meaning: "he follows / accompanies discipleship", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अनुगमनम्", iast: "anugamanam", meaning: "following, walking in footsteps", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "सम्-गम्": [
    { sanskrit: "सङ्गच्छते", iast: "saṅgacchate", meaning: "they unite / converge in harmony", context: "Present Indicative (Laṭ, Ātmanepada by समो गम्यृच्छिभ्याम्)", category: "tinanta" },
    { sanskrit: "सङ्गमः", iast: "saṅgamaḥ", meaning: "sacred confluence, meeting of rivers/souls", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "उत्-गम्": [
    { sanskrit: "उद्गच्छति", iast: "udgacchati", meaning: "he rises upward / emerges / ascends", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "उद्गमः", iast: "udgamaḥ", meaning: "emergence, origin, dawn", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "प्रति-गम्": [
    { sanskrit: "प्रतिगच्छति", iast: "pratigacchati", meaning: "he returns / goes back", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "प्रतिगमनम्", iast: "pratigamanam", meaning: "return, coming back", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "अव-गम्": [
    { sanskrit: "अवगच्छति", iast: "avagacchati", meaning: "he understands / grasps / perceives", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अवगतिः", iast: "avagatiḥ", meaning: "comprehension, realization", context: "Action Noun (Ktin)", category: "subanta" }
  ],
  "अधि-गम्": [
    { sanskrit: "अधिगच्छति", iast: "adhigacchati", meaning: "he masters / acquires / attains wisdom", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अधिगमः", iast: "adhigamaḥ", meaning: "attainment, intellectual acquisition", context: "Nominal Derivative", category: "subanta" }
  ],
  "उप-गम्": [
    { sanskrit: "उपगच्छति", iast: "upagacchati", meaning: "he approaches respectfully / draws near", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "उपगमः", iast: "upagamaḥ", meaning: "approach, arrival, agreement", context: "Nominal Derivative", category: "subanta" }
  ],
  "निर्-गम्": [
    { sanskrit: "निर्गच्छति", iast: "nirgacchati", meaning: "he exits / departs / goes forth", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "निर्गमः", iast: "nirgamaḥ", meaning: "exit, departure, outflow", context: "Nominal Derivative", category: "subanta" }
  ],

  // कृ combinations
  "सम्-कृ": [
    { sanskrit: "संस्कुरुते", iast: "saṃskurute", meaning: "he refines / sanctifies / purifies", context: "Present Indicative (Laṭ, Suṭ-āgama by सम्परिभ्यां करोतौ भूषणे)", category: "tinanta" },
    { sanskrit: "संस्कृतम्", iast: "saṃskṛtam", meaning: "refined, perfected, sacred Sanskrit", context: "Past Passive Participle (Kta)", category: "krdanta" },
    { sanskrit: "संस्कारः", iast: "saṃskāraḥ", meaning: "sacrament, subtle mental impression, refinement", context: "Action Noun (Ghañ)", category: "subanta" }
  ],
  "प्र-कृ": [
    { sanskrit: "प्रकरोति", iast: "prakaroti", meaning: "he brings forth / manifests / executes", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "प्रकृतिः", iast: "prakṛtiḥ", meaning: "primal creative matrix, pristine nature", context: "Feminine Action Noun (Ktin)", category: "subanta" }
  ],
  "वि-कृ": [
    { sanskrit: "विकरोति", iast: "vikaroti", meaning: "he alters / transforms / deforms", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "विकारः", iast: "vikāraḥ", meaning: "transformation, emotive variation, alteration", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "उप-कृ": [
    { sanskrit: "उपकरोति", iast: "upakaroti", meaning: "he helps / confers benefit / assists", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "उपकारः", iast: "upakāraḥ", meaning: "benevolence, assistance, kindness", context: "Nominal Derivative", category: "subanta" }
  ],
  "अप-कृ": [
    { sanskrit: "अपकरोति", iast: "apakaroti", meaning: "he injures / offends / acts wrongfully", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अपकारः", iast: "apakāraḥ", meaning: "harm, offense, malice", context: "Nominal Derivative", category: "subanta" }
  ],
  "अनु-कृ": [
    { sanskrit: "अनुकरोति", iast: "anukaroti", meaning: "he imitates / mimics / follows in act", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अनुकरणम्", iast: "anukaraṇam", meaning: "imitation, simulation", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "अधि-कृ": [
    { sanskrit: "अधिकारोति", iast: "adhikaroti", meaning: "he presides over / authorizes / appoints", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अधिकारः", iast: "adhikāraḥ", meaning: "sovereign right, jurisdiction, authority", context: "Nominal Derivative", category: "subanta" }
  ],

  // भू combinations
  "प्र-भू": [
    { sanskrit: "प्रभवति", iast: "prabhavati", meaning: "he originates / holds sovereign mastery", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "प्रभावः", iast: "prabhāvaḥ", meaning: "spiritual majesty, sovereign potency", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "अनु-भू": [
    { sanskrit: "अनुभवति", iast: "anubhavati", meaning: "he experiences / perceives within consciousness", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अनुभवः", iast: "anubhavaḥ", meaning: "direct experience, spiritual realization", context: "Nominal Derivative (Ghañ)", category: "subanta" }
  ],
  "सम्-भू": [
    { sanskrit: "सम्भवति", iast: "sambhavati", meaning: "it happens / becomes possible / coalesces", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "सम्भवः", iast: "sambhavaḥ", meaning: "birth, manifestation, possibility", context: "Nominal Derivative", category: "subanta" }
  ],
  "परा-भू": [
    { sanskrit: "पराभवति", iast: "parābhavati", meaning: "he is defeated / undergoes eclipse", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "पराभवः", iast: "parābhavaḥ", meaning: "defeat, humiliation, downfall", context: "Nominal Derivative", category: "subanta" }
  ],
  "परि-भू": [
    { sanskrit: "परिभवति", iast: "paribhavati", meaning: "he overlooks / despises / insults", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "परिभवः", iast: "paribhavaḥ", meaning: "disregard, contempt, humiliation", context: "Nominal Derivative", category: "subanta" }
  ],
  "अभि-भू": [
    { sanskrit: "अभिभवति", iast: "abhibhavati", meaning: "he overpowers / dominates / overwhelms", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अभिभावकः", iast: "abhibhāvakaḥ", meaning: "guardian, overseer, protector", context: "Agent Noun", category: "subanta" }
  ],
  "उत्-भू": [
    { sanskrit: "उद्भवति", iast: "udbhavati", meaning: "he arises / originates / springs forth", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "उद्भवः", iast: "udbhavaḥ", meaning: "generation, birth, origin", context: "Nominal Derivative", category: "subanta" }
  ],

  // स्था combinations
  "प्र-स्था": [
    { sanskrit: "प्रतिष्ठते", iast: "pratiṣṭhate", meaning: "he departs / sets forth / is established", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "प्रस्थानम्", iast: "prasthānam", meaning: "departure, sacred journey, foundation", context: "Action Noun (Lyut)", category: "subanta" }
  ],
  "अनु-स्था": [
    { sanskrit: "अनुतिष्ठति", iast: "anutiṣṭhati", meaning: "he practices / performs sacred rite", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अनुष्ठानम्", iast: "anuṣṭhānam", meaning: "religious observance, rigorous performance", context: "Action Noun", category: "subanta" }
  ],
  "उत्-स्था": [
    { sanskrit: "उत्तिष्ठति", iast: "uttiṣṭhati", meaning: "he stands up / rises / awakens", context: "Present Indicative (Laṭ by उदः स्थास्तम्भोः पूर्वस्य)", category: "tinanta" },
    { sanskrit: "उत्थानम्", iast: "utthānam", meaning: "uprising, rising, enterprise", context: "Action Noun", category: "subanta" }
  ],
  "अधि-स्था": [
    { sanskrit: "अधितिष्ठति", iast: "adhitiṣṭhati", meaning: "he presides over / occupies / dwells within", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "अधिष्ठानम्", iast: "adhiṣṭhānam", meaning: "substratum, seat, presiding base", context: "Action Noun", category: "subanta" }
  ]
};

const VACANA_HEADERS = [
  { sanskrit: "एकवचनम्", english: "Singular" },
  { sanskrit: "द्विवचनम्", english: "Dual" },
  { sanskrit: "बहुवचनम्", english: "Plural" }
];

// Helper to compute morphophonemics for any of the 22 Upasargas + Dhatu
function synthesizeMorphology(upasarga: Upasarga, dhatu: Dhatu): SuffixResult[] {
  const isNone = upasarga.isNone || !dhatu.canHavePrefix;
  const key = `${isNone ? 'none' : upasarga.sanskrit}-${dhatu.sanskrit}`;

  if (MORPH_RULES[key]) {
    return MORPH_RULES[key];
  }

  // If nominal root (Prātipadika) -> No Upasarga
  if (!dhatu.canHavePrefix || dhatu.type === 'nama') {
    const isNeuter = dhatu.sanskrit === 'ज्ञान';
    const nomSing = isNeuter ? `${dhatu.sanskrit}म्` : `${dhatu.sanskrit}ः`;
    const accSing = `${dhatu.sanskrit}म्`;
    return [
      {
        sanskrit: nomSing,
        iast: isNeuter ? `${dhatu.iast}m` : `${dhatu.iast}ḥ`,
        meaning: `${dhatu.meaning} (Nominative / प्रथमा)`,
        context: "Subanta Pada (प्रातिपदिकार्थलिङ्गपरिमाणवचनमात्रे प्रथमा २.३.४६)",
        category: "subanta"
      },
      {
        sanskrit: accSing,
        iast: `${dhatu.iast}m`,
        meaning: `${dhatu.meaning} (Accusative / द्वितीया)`,
        context: "Subanta Pada (कर्मणि द्वितीया २.३.२)",
        category: "subanta"
      }
    ];
  }

  // If bare verbal root without Upasarga
  if (isNone) {
    const verb = dhatu.baseVerb || `${dhatu.sanskrit}ति`;
    return [
      {
        sanskrit: verb,
        iast: `${dhatu.iast}ti`,
        meaning: `he ${dhatu.meaning.toLowerCase()} (unprefixed base action)`,
        context: "Present Indicative (Laṭ Lakāra, कर्तरी शप्)",
        category: "tinanta"
      },
      {
        sanskrit: `${dhatu.sanskrit}नम्`,
        iast: `${dhatu.iast}nam`,
        meaning: `the process / act of ${dhatu.meaning.toLowerCase()}`,
        context: "Action Noun (Lyut Pratyaya)",
        category: "subanta"
      }
    ];
  }

  // If prefixed verbal root: compute regular Sandhi and morphology
  let prefixDev = upasarga.sanskrit;
  let prefixIast = upasarga.iast.replace(/ \(.*\)/, '');
  const rootVerb = dhatu.baseVerb || `${dhatu.sanskrit}ति`;

  // Sandhi heuristics
  let combinedSanskrit = `${prefixDev}${rootVerb}`;
  let combinedIast = `${prefixIast}${dhatu.iast}ti`;

  if (prefixDev === 'सम्') {
    combinedSanskrit = `सं${rootVerb}`;
    combinedIast = `saṃ${dhatu.iast}ti`;
  } else if (prefixDev === 'उत्') {
    if (['ग', 'भ', 'द'].some(c => rootVerb.startsWith(c))) {
      combinedSanskrit = `उद्${rootVerb}`;
      combinedIast = `ud${dhatu.iast}ti`;
    } else if (rootVerb.startsWith('ल')) {
      combinedSanskrit = `उल्${rootVerb}`;
    }
  } else if (prefixDev === 'निस्') {
    if (['ग', 'भ', 'द'].some(c => rootVerb.startsWith(c))) {
      combinedSanskrit = `निर्${rootVerb}`;
    }
  } else if (prefixDev === 'दुस्') {
    if (['ग', 'भ', 'द'].some(c => rootVerb.startsWith(c))) {
      combinedSanskrit = `दुर्${rootVerb}`;
    }
  }

  return [
    {
      sanskrit: combinedSanskrit,
      iast: combinedIast,
      meaning: `${upasarga.meaning.split(',')[0].toLowerCase()} ${dhatu.meaning.toLowerCase()}`,
      context: `Prefix '${upasarga.sanskrit}' (${upasarga.iast}) + Root '${dhatu.sanskrit}'`,
      category: "tinanta"
    },
    {
      sanskrit: `${prefixDev}${dhatu.sanskrit}नम्`,
      iast: `${prefixIast}${dhatu.iast}nam`,
      meaning: `the act of ${upasarga.meaning.split(',')[0].toLowerCase()} ${dhatu.meaning.toLowerCase()}`,
      context: "Derivative Action Noun",
      category: "subanta"
    }
  ];
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

  // Selected Suffix result index
  const [suffixIndex, setSuffixIndex] = useState<number>(0);

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
      baseVerb: `${customDhatuSanskrit.trim()}ति`
    };
  }, [dhatuMode, dhatuIndex, customDhatuSanskrit, customDhatuIast, customDhatuMeaning, customIsNominal]);

  // DYNAMIC DETERMINATION: If the selected root CANNOT have a prefix, prefix dial is dynamically set to NONE_UPASARGA
  const currentUpasarga: Upasarga = useMemo(() => {
    if (!currentDhatu.canHavePrefix) {
      return NONE_UPASARGA;
    }
    return STANDARD_22_UPASARGAS[savedUpasargaIndex % STANDARD_22_UPASARGAS.length];
  }, [currentDhatu.canHavePrefix, savedUpasargaIndex]);

  // Morphological derivation results
  const availableSuffixes = useMemo(() => {
    return synthesizeMorphology(currentUpasarga, currentDhatu);
  }, [currentUpasarga, currentDhatu]);

  const currentResult = availableSuffixes[suffixIndex % availableSuffixes.length];

  // Dynamic Paradigm Matrix: 7x3 for Nominal, 3x3 for Verbal
  const dynamicMatrixData = useMemo(() => {
    const isNama = currentDhatu.type === 'nama' || !currentDhatu.canHavePrefix;
    const base = currentDhatu.sanskrit;
    const hasPrefix = !currentUpasarga.isNone && currentDhatu.canHavePrefix;
    const prefix = hasPrefix ? currentUpasarga.sanskrit : '';

    if (isNama) {
      // 7 Cases × 3 Numbers (Nominal Subanta Declension without Upasarga)
      const isNeuter = base === 'ज्ञान';
      return {
        type: 'nama' as const,
        title: `${base} (Subanta Nominal Declension)`,
        subtitle: "७ Vibhaktis (Cases) × ३ Vacanas (Numbers) — No Upasarga applicable",
        rows: [
          { 
            name: "Prathamā (Nominative)", 
            sanskritName: "प्रथमा", 
            meaning: "Subject / Kartā", 
            forms: isNeuter 
              ? [`${base}म्`, `${base}े`, `${base}ानि`]
              : [`${base}ः`, `${base}ौ`, `${base}ाः`]
          },
          { 
            name: "Dvitīyā (Accusative)", 
            sanskritName: "द्वितीया", 
            meaning: "Direct Object / Karma", 
            forms: isNeuter
              ? [`${base}म्`, `${base}े`, `${base}ानि`]
              : [`${base}म्`, `${base}ौ`, `${base}ान्`] 
          },
          { 
            name: "Tṛtīyā (Instrumental)", 
            sanskritName: "तृतीया", 
            meaning: "By / With (Karaṇa)", 
            forms: [`${base}ेण`, `${base}ाभ्याम्`, `${base}ैः`] 
          },
          { 
            name: "Caturthī (Dative)", 
            sanskritName: "चतुर्थी", 
            meaning: "For / Unto (Sampradāna)", 
            forms: [`${base}ाय`, `${base}ाभ्याम्`, `${base}ेभ्यः`] 
          },
          { 
            name: "Pañcamī (Ablative)", 
            sanskritName: "पञ्चमी", 
            meaning: "From / Due to (Apādāna)", 
            forms: [`${base}ात्`, `${base}ाभ्याम्`, `${base}ेभ्यः`] 
          },
          { 
            name: "Ṣaṣṭhī (Genitive)", 
            sanskritName: "षष्ठी", 
            meaning: "Of / Belonging to (Sambandha)", 
            forms: [`${base}स्य`, `${base}योः`, `${base}ानाम्`] 
          },
          { 
            name: "Saptamī (Locative)", 
            sanskritName: "सप्तमी", 
            meaning: "In / At / Upon (Adhikaraṇa)", 
            forms: [`${base}े`, `${base}योः`, `${base}ेषु`] 
          }
        ]
      };
    } else {
      // 3 Persons × 3 Numbers (Tiṅanta Verbal Conjugation)
      const isAtmanepada = currentResult.sanskrit.endsWith('ते') || currentDhatu.atmanepada;
      const prefixStem = hasPrefix ? prefix : '';
      const matrixTitle = hasPrefix 
        ? `${prefix} + ${base} (Tiṅanta Verbal Conjugation)`
        : `${base} (Pure Tiṅanta Conjugation — Unprefixed)`;

      return {
        type: 'kriya' as const,
        title: matrixTitle,
        subtitle: isAtmanepada ? "Laṭ Lakāra (Present Ātmanepada)" : "Laṭ Lakāra (Present Parasmaipada)",
        rows: [
          { 
            name: "Prathama Puruṣa (3rd Person)", 
            sanskritName: "प्रथमपुरुषः", 
            meaning: "He / She / They", 
            forms: isAtmanepada 
              ? [`${prefixStem}${base}ते`, `${prefixStem}${base}ेते`, `${prefixStem}${base}न्ते`]
              : [currentResult.sanskrit, `${prefixStem}${base}तः`, `${prefixStem}${base}न्ति`]
          },
          { 
            name: "Madhyama Puruṣa (2nd Person)", 
            sanskritName: "मध्यमपुरुषः", 
            meaning: "You (singular/dual/plural)", 
            forms: isAtmanepada 
              ? [`${prefixStem}${base}से`, `${prefixStem}${base}ेथे`, `${prefixStem}${base}ध्वे`]
              : [`${prefixStem}${base}सि`, `${prefixStem}${base}थः`, `${prefixStem}${base}थ`]
          },
          { 
            name: "Uttama Puruṣa (1st Person)", 
            sanskritName: "उत्तमपुरुषः", 
            meaning: "I / We two / We all", 
            forms: isAtmanepada 
              ? [`${prefixStem}${base}े`, `${prefixStem}${base}ावहे`, `${prefixStem}${base}ामहे`]
              : [`${prefixStem}${base}मि`, `${prefixStem}${base}ावः`, `${prefixStem}${base}ामः`]
          }
        ]
      };
    }
  }, [currentUpasarga, currentDhatu, currentResult]);

  const activeMatrixRow = dynamicMatrixData.rows[selectedRowIndex % dynamicMatrixData.rows.length];
  const activeMatrixCellForm = activeMatrixRow.forms[selectedColIndex % 3];

  // Dynamic Etymology Data
  const currentEtymology: EtymologyData = useMemo(() => {
    // If nominal stem -> Pāṇinian explanation of why Upasargas cannot attach
    if (!currentDhatu.canHavePrefix) {
      return {
        sutra: "उपसर्गाः क्रियायोगे (१.४.५९) & प्रातिपदिकार्थलिङ्गपरिमाणवचनमात्रे प्रथमा (२.३.४६)",
        sutraNumber: "अष्टाध्यायी १.४.५९ / २.३.४६",
        sutraType: "संज्ञा-सूत्रम् (Definition of Scope)",
        sutraExplanation: `Pāṇini defines in sūtra १.४.५९ that the twenty-two particles ('pra', 'parā', etc.) receive the designation 'Upasarga' ONLY when joined with an action/verbal root ('क्रियायोगे'). Because '${currentDhatu.sanskrit}' is an Ajanta Prātipadika (Nominal Noun Stem) and not a Dhātu, it cannot take verbal Upasargas. The prefix dial is dynamically disabled and set to 'None'.`,
        derivationSteps: [
          {
            step: 1,
            title: "Prātipadika Classification",
            sutraRule: "अर्थवदधातुरप्रत्ययः प्रातिपदिकम् (१.२.४५)",
            description: `'${currentDhatu.sanskrit}' is defined as a meaningful noun stem devoid of verbal root affixes.`,
            intermediate: currentDhatu.sanskrit
          },
          {
            step: 2,
            title: "Upasarga Disqualification",
            sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
            description: "Upasargas require 'kriyāyoga' (connection with verbal action). In nominal stems, no Upasarga can be prefixed.",
            intermediate: `विना-उपसर्गम् (None)`
          },
          {
            step: 3,
            title: "Subanta Pada Completion",
            sutraRule: "सुप्तिङन्तं पदम् (१.४.१४)",
            description: `Inflected with nominal case terminations (Sup), producing independent communicative noun padas like '${currentResult.sanskrit}'.`,
            intermediate: currentResult.sanskrit
          }
        ],
        poeticNuance: `A noun stem in Sanskrit is a self-luminous ontological substance, standing in its own dignity without the directional modification of verbal prefixes.`,
        literaryContext: `Found throughout Sanskrit grammar to establish the clear boundary between Nāma (nouns) and Ākhyāta (verbs).`,
        exampleSentence: {
          sanskrit: `${currentDhatu.sanskrit}ः सदा विजयते धर्मरक्षकः।`,
          iast: `${currentDhatu.iast}ḥ sadā vijayate dharmarakṣakaḥ.`,
          translation: `The noble entity shines triumphant as the eternal protector of righteousness.`,
          source: "Classical Traditional Shloka"
        }
      };
    }

    // If verbal root
    const key = `${currentUpasarga.sanskrit}-${currentDhatu.sanskrit}`;
    return {
      sutra: currentUpasarga.isNone 
        ? "भूवादयो धातवः (१.३.१) & कर्तरि शप् (३.१.६८)" 
        : `उपसर्गाः क्रियायोगे (१.४.५९) — [${currentUpasarga.sanskrit}]`,
      sutraNumber: currentUpasarga.isNone ? "अष्टाध्यायी १.३.१" : "अष्टाध्यायी १.४.५९",
      sutraType: currentUpasarga.isNone ? "धातु-संज्ञा / सार्वधातुकम्" : "उपसर्ग-प्रक्रिया (Semantic Shift Rule)",
      sutraExplanation: currentUpasarga.isNone
        ? `The root sound '${currentDhatu.sanskrit}' functions directly as a pure radical verbal base (केवल-धातु) inflecting in the present tense (Laṭ).`
        : `The Upasarga '${currentUpasarga.sanskrit}' (${currentUpasarga.meaning}) combines with root '${currentDhatu.sanskrit}' (${currentDhatu.meaning}), pulling the innate action into novel contextual semantics.`,
      derivationSteps: [
        {
          step: 1,
          title: "Upasarga-Dhātu Saṃyoga",
          sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
          description: `The prefix '${currentUpasarga.sanskrit}' integrates with root '${currentDhatu.sanskrit}'.`,
          intermediate: `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit}`
        },
        {
          step: 2,
          title: "Vikaraṇa & Sandhi Adjustment",
          sutraRule: "कर्तरि शप् (३.१.६८) / अचोऽन्त्यादि",
          description: "Internal phonological harmony adjusts vowels and consonants between prefix and root.",
          intermediate: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}`
        },
        {
          step: 3,
          title: "Pada Completion (सुप्तिङन्तं पदम्)",
          sutraRule: "तिप्तस्झिसिप्थस्थ... (३.४.७८)",
          description: `Inflected into final conjugated form '${currentResult.sanskrit}'.`,
          intermediate: currentResult.sanskrit
        }
      ],
      poeticNuance: `उपसर्गेण धात्वर्थो बलादन्यत्र नीयते — As Patañjali observed, the prefix '${currentUpasarga.sanskrit}' transfigures the root '${currentDhatu.sanskrit}' to embody ${currentUpasarga.meaning}.`,
      literaryContext: `Standard Pāṇinian morphological synthesis across the 22 classical Upasargas.`,
      exampleSentence: {
        sanskrit: `${currentResult.sanskrit} सुधीः धर्ममार्गे।`,
        iast: `${currentResult.iast} sudhīḥ dharmamārge.`,
        translation: `The wise soul walks and perseveres steadfastly on the path of truth.`,
        source: "Classical Sanskrit Synthesis"
      }
    };
  }, [currentUpasarga, currentDhatu, currentResult]);

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
    setSuffixIndex(0);
  };

  // Root cycling
  const cycleDhatu = () => {
    if (dhatuMode === 'dial') {
      const nextIdx = (dhatuIndex + 1) % DHATUS.length;
      setDhatuIndex(nextIdx);
      setSuffixIndex(0);

      const nextDhatu = DHATUS[nextIdx];
      if (!nextDhatu.canHavePrefix) {
        showToast(`'${nextDhatu.sanskrit}' is a Nominal Stem (प्रातिपदिक). Prefix dial set to None.`);
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
        sanskrit: `${prefixStr} + ${currentDhatu.sanskrit} = ${currentResult.sanskrit}`,
        iast: `${currentUpasarga.iast} + ${currentDhatu.iast} -> ${currentResult.iast}`,
        meaning: currentResult.meaning,
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
        sanskrit: `${currentDhatu.sanskrit} : ${currentEtymology.sutra}`,
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
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">22 Upasargas</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                PANINIAN EQUATION · 22 UPASARGAS · DYNAMIC MATRIX
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
                  <span>22 Traditional Upasargas · Dynamic Kriyāyoga Check</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  Morphological Equation Studio
                </h2>
                <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1">
                  Pāṇini 1.4.59: <span className="text-indigo-300 font-serif font-semibold">उपसर्गाः क्रियायोगे</span> — Upasargas attach strictly to Dhātus (verbs). For Nominal stems (Prātipadika), the prefix dial automatically disables to None.
                </p>
              </div>

              {/* The Horizontal Formula Dial Architecture */}
              <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-6 my-4">
                
                {/* 1. UPASARGA (PREFIX) DIAL - With 22 standard prefixes and dynamic None handling */}
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
                        <span className="text-indigo-300 font-semibold">उपसर्गाः क्रियायोगे (१.४.५९):</span> Nominal stems (प्रातिपदिक) do not combine with verbal Upasargas.
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
                          onChange={(e) => setCustomIsNominal(e.target.checked)}
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

                {/* 3. DERIVATIVE RESULT BLOCK (Navigates to Step 2) */}
                <div 
                  onClick={() => setCurrentStep('matrix')}
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-indigo-950/35 via-indigo-900/10 to-transparent border border-indigo-500/35 hover:border-indigo-500/75 transition-all cursor-pointer flex flex-col items-center text-center backdrop-blur-md shadow-2xl"
                  title="Click to view full Paradigm Matrix table"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>STEP 2</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  
                  <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-mono mb-1">
                    Derivative Result (प्रत्यय)
                  </div>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-white my-3 group-hover:scale-105 transition-transform font-serif text-indigo-100">
                    {currentResult.sanskrit}
                  </div>
                  <div className="text-sm font-mono text-indigo-300 mb-1">{currentResult.iast}</div>
                  <div className="text-xs text-slate-200 italic min-h-[32px] flex items-center justify-center">
                    &ldquo;{currentResult.meaning}&rdquo;
                  </div>

                  <div className="mt-3 pt-3 border-t border-indigo-500/20 w-full text-[11px] text-indigo-300/90 flex items-center justify-center gap-1">
                    <Table className="w-3 h-3" />
                    <span>Click to open Paradigm Matrix</span>
                  </div>
                </div>

              </div>

              {/* Quick Cycle Derivation Pill Bar */}
              {availableSuffixes.length > 1 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-500 font-mono">Derivations:</span>
                  {availableSuffixes.map((suffix, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSuffixIndex(idx)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-serif transition-colors ${
                        suffixIndex % availableSuffixes.length === idx 
                          ? 'bg-indigo-600/40 border border-indigo-500/50 text-white' 
                          : 'bg-white/[0.03] text-slate-400 hover:text-white'
                      }`}
                    >
                      {suffix.sanskrit}
                    </button>
                  ))}
                </div>
              )}

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
                  <span>View Paradigm Matrix Table</span>
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
              {/* Matrix Header Navigation Controls */}
              <div className="w-full flex items-center justify-between gap-4 mb-6">
                <button
                  onClick={() => setCurrentStep('equation')}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors text-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step 1: Equation</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
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

              {/* CLUTTER-FREE TRANSPARENT MATRIX GRID: Zero heavy borders, pure ambient aesthetic */}
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
                    SELECTED PARADIGM CELL
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
                  <span>Pāṇinian Aṣṭādhyāyī Analysis</span>
                </div>
              </div>

              {/* Central Title */}
              <div className="text-center mb-8">
                <span className="text-xs tracking-widest text-indigo-400 uppercase font-mono mb-2 block">
                  MORPHOLOGICAL DERIVATION & SŪTRAS
                </span>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  {currentUpasarga.isNone ? "केवल-धातु / प्रातिपदिक" : `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit}`} = {currentResult.sanskrit}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Systematic deconstruction according to canonical grammatical sūtras of Pāṇini.
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
                        setSuffixIndex(0);
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
                  {!currentDhatu.canHavePrefix ? (
                    <>
                      &ldquo;Selected root <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentDhatu.sanskrit}&rsquo;</span> is a Prātipadika (Nominal Stem) and cannot take verbal Upasargas per <span className="text-white font-sans font-bold">उपसर्गाः क्रियायोगे (१.४.५९)</span>. Prefix dial is set to None.&rdquo;
                    </>
                  ) : (
                    <>
                      &ldquo;Root sound <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentDhatu.sanskrit}&rsquo;</span> ({currentDhatu.meaning}) modified by Upasarga <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentUpasarga.sanskrit}&rsquo;</span> ({currentUpasarga.meaning}) engenders <span className="text-white font-sans font-bold">&lsquo;{currentResult.sanskrit}&rsquo;</span>.&rdquo;
                    </>
                  )}
                </>
              )}
              {currentStep === 'matrix' && (
                <>
                  &ldquo;Inspecting <span className="text-indigo-300 font-sans font-semibold">{dynamicMatrixData.title}</span>. Active cell <span className="text-white font-sans font-bold">&lsquo;{activeMatrixCellForm}&rsquo;</span> expresses <span className="text-indigo-300 font-sans font-semibold">{activeMatrixRow.name}</span> in <span className="text-indigo-300 font-sans font-semibold">{VACANA_HEADERS[selectedColIndex].sanskrit}</span>.&rdquo;
                </>
              )}
              {currentStep === 'etymology' && (
                <>
                  &ldquo;Canonical Pāṇinian analysis: governed by <span className="text-indigo-300 font-sans font-semibold">{currentEtymology.sutraNumber}</span> &lsquo;{currentEtymology.sutra}&rsquo;. Demonstrates semantic transformation into <span className="text-white font-sans font-bold">&lsquo;{currentResult.sanskrit}&rsquo;</span>.&rdquo;
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
