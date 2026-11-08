'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, VolumeX, Sparkles, RefreshCw, Bookmark, BookmarkCheck, 
  Keyboard, Compass, Mic, Atom, BookOpen, Grid, Layers, ArrowRight, ArrowLeft,
  Check, Copy, Trash2, ExternalLink, X, ScrollText, Feather, Lightbulb,
  Workflow, Table, BookMarked
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

const UPASARGAS: Upasarga[] = [
  { sanskrit: "प्र", iast: "pra", meaning: "forth, forward, intensive, excellent", nuance: "Denotes motion forward, excess (प्रकर्ष), or preeminence in action." },
  { sanskrit: "आ", iast: "ā", meaning: "towards, until, reversal, all around", nuance: "Indicates reversal (आङ् मर्यादाभिविध्योः), inward direction, or expansive movement." },
  { sanskrit: "सम्", iast: "sam", meaning: "together, complete, thorough, refined", nuance: "Signifies perfection, auspicious union (सम्यक्), or unification of forces." },
  { sanskrit: "वि", iast: "vi", meaning: "apart, distinct, variation, cessation", nuance: "Implies distribution, analysis (विशेष), divergence, or tranquil separation." },
  { sanskrit: "प्रति", iast: "prati", meaning: "towards, against, in return, each", nuance: "Represents reflection, opposition, reciprocity, or rhythmic return." },
  { sanskrit: "अनु", iast: "anu", meaning: "along, after, following, agreeable", nuance: "Denotes imitation, succession, subordination, or continuous harmony." },
  { sanskrit: "उत्", iast: "ut", meaning: "up, upwards, out, elevation", nuance: "Signifies elevation, emergence, or sudden release of upward potential." },
  { sanskrit: "परि", iast: "pari", meaning: "around, fully, completely, encircling", nuance: "Indicates comprehensive encirclement (समन्तात्) or total transformation." },
  { sanskrit: "नि", iast: "ni", meaning: "down, into, inward, firmly settled", nuance: "Implies downward fixation (नितराम्), inward depth, or meditative composure." },
  { sanskrit: "अधि", iast: "adhi", meaning: "over, above, supreme, master of", nuance: "Denotes sovereignty, presiding authority (आधिपत्य), or higher elevation." }
];

const DHATUS: Dhatu[] = [
  { sanskrit: "रम्", iast: "ram", meaning: "to delight, sport, rest, revel", gana: "1st Class (Bhvādi ०१.०९०६)", type: "kriya" },
  { sanskrit: "पठ्", iast: "paṭh", meaning: "to read, recite, study aloud", gana: "1st Class (Bhvādi ०१.०३८१)", type: "kriya" },
  { sanskrit: "गम्", iast: "gam", meaning: "to go, move, attain, walk", gana: "1st Class (Bhvādi ०१.११३१)", type: "kriya" },
  { sanskrit: "लिख्", iast: "likh", meaning: "to write, delineate, carve", gana: "6th Class (Tudādi ०६.०००४)", type: "kriya" },
  { sanskrit: "दृश्", iast: "dṛś", meaning: "to see, behold, perceive directly", gana: "4th/1st Class (Divādi/Bhvādi)", type: "kriya" },
  { sanskrit: "कृ", iast: "kṛ", meaning: "to do, make, fashion, accomplish", gana: "8th Class (Tanādi ०८.००१०)", type: "kriya" },
  { sanskrit: "भू", iast: "bhū", meaning: "to be, exist, arise, become", gana: "1st Class (Bhvādi ०१.०००१)", type: "kriya" },
  { sanskrit: "स्था", iast: "sthā", meaning: "to stand, abide, remain, endure", gana: "1st Class (Bhvādi ०१.१०७७)", type: "kriya" },
  { sanskrit: "राम", iast: "rāma", meaning: "Noble, charming, source of joy", gana: "Ajanta Puṃliṅga (Prātipadika)", type: "nama" },
  { sanskrit: "देव", iast: "deva", meaning: "Luminous being, celestial light", gana: "Ajanta Puṃliṅga (Prātipadika)", type: "nama" },
  { sanskrit: "ज्ञान", iast: "jñāna", meaning: "Direct gnosis, illumined insight", gana: "Ajanta Napuṃsakaliṅga (Prātipadika)", type: "nama" }
];

const MORPH_RULES: Record<string, SuffixResult[]> = {
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
  "प्र-पठ्": [
    { sanskrit: "प्रपठति", iast: "prapaṭhati", meaning: "he recites thoroughly / studies with devotion", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "प्रपाठकः", iast: "prapāṭhakaḥ", meaning: "master reciter, canonical lesson, lecturer", context: "Agent Noun (Ṇvul)", category: "subanta" }
  ],
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
  "आ-लिख्": [
    { sanskrit: "आलिखति", iast: "ālikhati", meaning: "he paints / sketches / delineates", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "आलेख्यम्", iast: "ālekhyam", meaning: "a painting, visual depiction, portrait", context: "Gerundive Noun (Ṇyat)", category: "subanta" }
  ],
  "वि-लिख्": [
    { sanskrit: "विलिखति", iast: "vilikhati", meaning: "he scratches, engraves, inscribes", context: "Present Indicative (Laṭ)", category: "tinanta" },
    { sanskrit: "विलेखनम्", iast: "vilekhanam", meaning: "engraving, incision, inscription", context: "Action Noun (Lyut)", category: "subanta" }
  ]
};

const ETYMOLOGY_DATABASE: Record<string, EtymologyData> = {
  "प्र-रम्": {
    sutra: "व्याङ्परिभ्यो रमः (१.३.८३) & समासेऽनञ्पूर्वे क्त्वो ल्यप् (७.१.३७)",
    sutraNumber: "अष्टाध्यायी १.३.८३ / ७.१.३७",
    sutraType: "विधि-सूत्रम् (Operational Transformation Rule)",
    sutraExplanation: "The root 'रम्' (to sport, delight) ordinarily takes Ātmanepada endings; however, when compounded with an Upasarga, specific morphosyntactic shifts occur: the absolutive suffix 'क्त्वा' obligatorily yields to 'ल्यप्', and semantic nuance shifts to heightened rejoicing.",
    derivationSteps: [
      {
        step: 1,
        title: "Prakṛti-Upasarga Saṃyoga",
        sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
        description: "The particle 'प्र' (pra, signifying excellence/intensity) joins the Dhātu root sound 'रम्' (ram).",
        intermediate: "प्र + रम्"
      },
      {
        step: 2,
        title: "Sarvadhātuka / Vikaraṇa Application",
        sutraRule: "कर्तरि शप् (३.१.६८)",
        description: "In the active voice (kartari prayoga), the thematic affix 'शप्' (a) is introduced between root and inflection.",
        intermediate: "प्र + रम् + अ"
      },
      {
        step: 3,
        title: "Lyap Substitution for Absolutive / Pada Nirmiti",
        sutraRule: "समासेऽनञ्पूर्वे क्त्वो ल्यप् (७.१.३७)",
        description: "When forming the gerundive, 'क्त्वा' transforms to 'ल्यप्' (ya). For verbal inflection, ātmanepada suffix 'ते' unites to complete the pada.",
        intermediate: "प्र + रम् + अ + ते = प्ररमते / प्ररम्य"
      }
    ],
    poeticNuance: "उपसर्गेण धात्वर्थो बलादन्यत्र नीयते — As Patañjali notes, an Upasarga pulls root semantics like water through a sluice. Here, the serene quietude of 'रम्' is intensified by 'प्र' into luminous, spiritual joy.",
    literaryContext: "Classical Kavya tradition frequently uses 'प्ररमते' to depict enlightened ascetics or lovers finding boundless solace in sacred groves.",
    exampleSentence: {
      sanskrit: "प्ररमते सतां सङ्गे धीरो जनः सदा।",
      iast: "praramate satāṃ saṅge dhīro janaḥ sadā.",
      translation: "The serene and steadfast person delights constantly in the exalted assembly of the wise.",
      source: "हितोपदेशः (Hitopadeśa)"
    }
  },
  "वि-रम्": {
    sutra: "व्याङ्परिभ्यो रमः (१.३.८३)",
    sutraNumber: "अष्टाध्यायी १.३.८३",
    sutraType: "नियम-सूत्रम् (Affix Classification Exception)",
    sutraExplanation: "This critical Pāṇinian sūtra prescribes that when the root 'रम्' is preceded by the prefixes 'वि', 'आङ्', or 'परि', it takes Parasmaipada terminations instead of its usual Ātmanepada, meaning to desist, stop, or pause completely.",
    derivationSteps: [
      {
        step: 1,
        title: "Prefix Integration & Semantic Inversion",
        sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
        description: "The upasarga 'वि' (separation, cessation) governs the root sound 'रम्'.",
        intermediate: "वि + रम्"
      },
      {
        step: 2,
        title: "Parasmaipada Rule Exception",
        sutraRule: "व्याङ्परिभ्यो रमः (१.३.८३)",
        description: "Unlike solitary 'रमते', the prefix 'वि' forces Parasmaipada affix 'तिप्' (ti).",
        intermediate: "वि + रम् + शप् + तिप्"
      },
      {
        step: 3,
        title: "Pada Completion (सुप्तिङन्तं पदम्)",
        sutraRule: "सुप्तिङन्तं पदम् (१.४.१४)",
        description: "The elements fuse seamlessly to form the indicative verb 'विरमति' and noun 'विरामः' (cessation, punctuation pause).",
        intermediate: "वि + रम् + अ + ति = विरमति"
      }
    ],
    poeticNuance: "The particle 'वि' splits the movement of joy into peaceful cessation. It is the holy silence that follows music, the quietude where worldly agitation ceases.",
    literaryContext: "Widely used in ethical literature (Nītiśāstra) to signify turning away from wrongful conduct towards Dharma.",
    exampleSentence: {
      sanskrit: "विरमति दुष्कृतात् सज्जनः सर्वदा।",
      iast: "viramati duṣkṛtāt sajjanaḥ sarvadā.",
      translation: "The noble being permanently desists from destructive and unrighteous actions.",
      source: "भर्तृहरि नीतिशतकम् (Bhartṛhari's Nītiśatakam)"
    }
  },
  "सम्-कृ": {
    sutra: "सम्परिभ्यां करोतौ भूषणे (६.१.१३७)",
    sutraNumber: "अष्टाध्यायी ६.१.१३७",
    sutraType: "आगम-सूत्रम् (Augment Insertion Rule)",
    sutraExplanation: "When the Dhātu 'कृ' follows the upasargas 'सम्' or 'परि' with the meaning of decorating, refining, or sanctifying (भूषणे), the augment 'सुट्' (s) is obligatorily inserted before the root.",
    derivationSteps: [
      {
        step: 1,
        title: "Prefix Junction & Augment Trigger",
        sutraRule: "सम्परिभ्यां करोतौ भूषणे (६.१.१३७)",
        description: "The root 'कृ' (kṛ) connects with 'सम्' (sam). The concept of sacred refinement triggers the 'सुट्' (s) augment.",
        intermediate: "सम् + स् + कृ"
      },
      {
        step: 2,
        title: "Anusvāra Euphonic Mutation",
        sutraRule: "मोऽनुस्वारः (८.३.२३)",
        description: "The final padānta nasal 'म्' of 'सम्' mutates into Anusvāra before the following sibilant 'स्'.",
        intermediate: "सं + स् + कृ = संस्कृ"
      },
      {
        step: 3,
        title: "Affixation of Kta (Past Participle)",
        sutraRule: "निष्ठा (३.२.१०२)",
        description: "The past participle affix 'क्त' (ta) joins the refined base to produce the foundational word of Indian civilisation: 'संस्कृतम्'.",
        intermediate: "संस्कृ + त = संस्कृतम्"
      }
    ],
    poeticNuance: "Here lies the metaphysical birth of the Sanskrit language itself: raw matter (kṛ) sculpted through holy balance (sam) and sibilant brilliance (suṭ) into diamond clarity.",
    literaryContext: "Celebrated in classical linguistics as the archetypal example of phonetic symmetry and moral transformation.",
    exampleSentence: {
      sanskrit: "वाणी एका समलंकरोति पुरुषं या संस्कृता धार्यते।",
      iast: "vāṇī ekā samalaṅkaroti puruṣaṃ yā saṃskṛtā dhāryate.",
      translation: "Speech alone truly adorns a person, provided it is polished and cultivated with wisdom.",
      source: "भर्तृहरि (Bhartṛhari, Vāṇī-vandana)"
    }
  },
  "आ-गम्": {
    sutra: "इषिगमिमसां छः (७.३.७७) & छे च (६.१.७३)",
    sutraNumber: "अष्टाध्यायी ७.३.७७ / ६.१.७३",
    sutraType: "आदेश-सूत्रम् (Morphological Substitution Rule)",
    sutraExplanation: "Before a Śit affix like Śap, the final consonant of the root 'गम्' (gam) is replaced by 'छ्' (ch). Subsequently, by 'छे च', a short vowel receives the augment 'तुक्' (t), yielding the geminate 'च्छ्' (cch).",
    derivationSteps: [
      {
        step: 1,
        title: "Vector Reversal with Āṅ",
        sutraRule: "आङ् मर्यादाभिविध्योः (२.१.१३)",
        description: "The directional particle 'आ' reverses the centrifugal vector of 'गम्' (going) into centripetal motion (coming / arrival).",
        intermediate: "आ + गम्"
      },
      {
        step: 2,
        title: "Consonant Substitution (Gam -> Gacch)",
        sutraRule: "इषिगमिमसां छः (७.३.७७)",
        description: "The root 'गम्' undergoes phonetic substitution to 'गच्छ्' before the active present thematic affix.",
        intermediate: "आ + गच्छ्"
      },
      {
        step: 3,
        title: "Conjugational Completion",
        sutraRule: "तिप्तस्झिसिप्थस्थ... (३.४.७८)",
        description: "Affix 'तिप्' joins to finalize 'आगच्छति' (he arrives) and 'आगत्य' (having arrived).",
        intermediate: "आ + गच्छ् + अ + ति = आगच्छति"
      }
    ],
    poeticNuance: "Movement is redirected home. What was outward wanderlust becomes arrival, presence, and intimate communion.",
    literaryContext: "Found universally across Epics whenever an avatar or honoured guest steps across the threshold.",
    exampleSentence: {
      sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्।",
      iast: "yadā yadā hi dharmasya glānir bhavati bhārata...",
      translation: "Whenever righteousness declines, I manifest and arrive to restore harmony.",
      source: "श्रीमद्भगवद्गीता (Bhagavad Gītā ४.७)"
    }
  },
  "प्र-भू": {
    sutra: "भुवः प्रभवः (१.४.३१)",
    sutraNumber: "अष्टाध्यायी १.४.३१",
    sutraType: "कारक-सूत्रम् (Case-Governing Sūtra)",
    sutraExplanation: "The source or place of first manifestation from which something arises through the root 'भू' compounded with 'प्र' takes the Apādāna (Ablative) relation.",
    derivationSteps: [
      {
        step: 1,
        title: "Cosmological Emergence",
        sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
        description: "The primordial root 'भू' (to exist/be) takes 'प्र' (forward dawn, origin).",
        intermediate: "प्र + भू"
      },
      {
        step: 2,
        title: "Guṇa & Av-Ādeśa",
        sutraRule: "सार्वधातुकार्धधातुकयोः (७.३.८४) & एचोऽयवायावः (६.१.७८)",
        description: "The radical vowel 'ऊ' undergoes Guṇa to 'ओ', which converts to 'अव्' before the vowel of Śap.",
        intermediate: "प्र + भो + अ -> प्र + भव् + अ"
      },
      {
        step: 3,
        title: "Final Verb & Noun Generation",
        sutraRule: "सुप्तिङन्तं पदम् (१.४.१४)",
        description: "Forms 'प्रभवति' (originates / commands authority) and 'प्रभावः' (transcendent aura).",
        intermediate: "प्रभवति / प्रभावः"
      }
    ],
    poeticNuance: "Not merely existence, but sovereignty. To arise as the master and spring of vitality.",
    literaryContext: "Cited by Patañjali to explain the birth of sacred rivers descending from mountain glaciers.",
    exampleSentence: {
      sanskrit: "हिमवतो गङ्गा प्रभवति सागराभिमुखी।",
      iast: "himavato gaṅgā prabhavati sāgarābhimukhī.",
      translation: "From the snow-crowned Himalayas the holy river Gaṅgā originates, coursing towards the sea.",
      source: "महाभाष्यम् (Mahābhāṣya of Patañjali)"
    }
  }
};

const VACANA_HEADERS = [
  { sanskrit: "एकवचनम्", english: "Singular" },
  { sanskrit: "द्विवचनम्", english: "Dual" },
  { sanskrit: "बहुवचनम्", english: "Plural" }
];

export default function SanskritMorphEngine() {
  // Navigation View: 'equation' (Step 1) | 'matrix' (Step 2) | 'etymology' (Step 3)
  const [currentStep, setCurrentStep] = useState<'equation' | 'matrix' | 'etymology'>('equation');

  // Dial Selection State
  const [upasargaIndex, setUpasargaIndex] = useState<number>(0);
  const [dhatuIndex, setDhatuIndex] = useState<number>(0);
  
  // Custom Dhātu mode
  const [dhatuMode, setDhatuMode] = useState<'dial' | 'type'>('dial');
  const [customDhatuSanskrit, setCustomDhatuSanskrit] = useState<string>("रम्");
  const [customDhatuIast, setCustomDhatuIast] = useState<string>("ram");
  const [customDhatuMeaning, setCustomDhatuMeaning] = useState<string>("to delight, revel");

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

  // Active Upasarga & Dhatu
  const currentUpasarga = UPASARGAS[upasargaIndex];
  
  const currentDhatu: Dhatu = useMemo(() => {
    if (dhatuMode === 'dial') {
      return DHATUS[dhatuIndex];
    }
    return { 
      sanskrit: customDhatuSanskrit.trim() || "रम्", 
      iast: customDhatuIast.trim() || "ram", 
      meaning: customDhatuMeaning.trim() || "action", 
      gana: "Custom Root (प्रयोक्ता-धातु)", 
      type: 'kriya' 
    };
  }, [dhatuMode, dhatuIndex, customDhatuSanskrit, customDhatuIast, customDhatuMeaning]);

  const keyString = `${currentUpasarga.sanskrit}-${currentDhatu.sanskrit}`;

  // Precomputed or dynamically synthesized suffixes
  const availableSuffixes = useMemo(() => {
    return MORPH_RULES[keyString] || [
      { 
        sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}ति`, 
        iast: `${currentUpasarga.iast}${currentDhatu.iast}ti`, 
        meaning: `he performs action of ${currentDhatu.meaning}`, 
        context: "Present Indicative (Laṭ, 3rd Person Singular)",
        category: "tinanta" as const
      },
      { 
        sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}मः`, 
        iast: `${currentUpasarga.iast}${currentDhatu.iast}maḥ`, 
        meaning: `we participate in ${currentDhatu.meaning.toLowerCase()}`, 
        context: "1st Person Plural (Laṭ Uttama-Puruṣa)",
        category: "tinanta" as const
      },
      { 
        sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}नम्`, 
        iast: `${currentUpasarga.iast}${currentDhatu.iast}nam`, 
        meaning: `the process/act of ${currentDhatu.meaning.toLowerCase()}`, 
        context: "Action Noun (Lyut Pratyaya)",
        category: "subanta" as const
      }
    ];
  }, [currentUpasarga, currentDhatu, keyString]);

  const currentResult = availableSuffixes[suffixIndex % availableSuffixes.length];

  // Dynamic Paradigm Matrix: 7x3 for Nominal, 3x3 for Verbal
  const dynamicMatrixData = useMemo(() => {
    const isNama = currentDhatu.type === 'nama' || ['राम', 'देव', 'ज्ञान'].includes(currentDhatu.sanskrit);
    const base = currentDhatu.sanskrit;
    const prefix = currentUpasarga.sanskrit;

    if (isNama) {
      // 7 Cases × 3 Numbers
      return {
        type: 'nama' as const,
        title: `${prefix} + ${base} (Subanta Nominal Declension)`,
        subtitle: "७ Vibhaktis (Cases) × ३ Vacanas (Numbers)",
        rows: [
          { name: "Prathamā (Nominative)", sanskritName: "प्रथमा", meaning: "Subject / Kartā", forms: [`${prefix}${base}ः`, `${prefix}${base}ौ`, `${prefix}${base}ाः`] },
          { name: "Dvitīyā (Accusative)", sanskritName: "द्वितीया", meaning: "Direct Object / Karma", forms: [`${prefix}${base}म्`, `${prefix}${base}ौ`, `${prefix}${base}ान्`] },
          { name: "Tṛtīyā (Instrumental)", sanskritName: "तृतीया", meaning: "By / With (Karaṇa)", forms: [`${prefix}${base}ेण`, `${prefix}${base}ाभ्याम्`, `${prefix}${base}ैः`] },
          { name: "Caturthī (Dative)", sanskritName: "चतुर्थी", meaning: "For / Unto (Sampradāna)", forms: [`${prefix}${base}ाय`, `${prefix}${base}ाभ्याम्`, `${prefix}${base}ेभ्यः`] },
          { name: "Pañcamī (Ablative)", sanskritName: "पञ्चमी", meaning: "From / Due to (Apādāna)", forms: [`${prefix}${base}ात्`, `${prefix}${base}ाभ्याम्`, `${prefix}${base}ेभ्यः`] },
          { name: "Ṣaṣṭhī (Genitive)", sanskritName: "षष्ठी", meaning: "Of / Belonging to (Sambandha)", forms: [`${prefix}${base}स्य`, `${prefix}${base}योः`, `${prefix}${base}ानाम्`] },
          { name: "Saptamī (Locative)", sanskritName: "सप्तमी", meaning: "In / At / Upon (Adhikaraṇa)", forms: [`${prefix}${base}े`, `${prefix}${base}योः`, `${prefix}${base}ेषु`] }
        ]
      };
    } else {
      // 3 Persons × 3 Numbers
      const isAtmanepada = currentResult.sanskrit.endsWith('ते');
      return {
        type: 'kriya' as const,
        title: `${prefix} + ${base} (Tiṅanta Verbal Conjugation)`,
        subtitle: isAtmanepada ? "Laṭ Lakāra (Present Ātmanepada)" : "Laṭ Lakāra (Present Parasmaipada)",
        rows: [
          { 
            name: "Prathama Puruṣa (3rd Person)", 
            sanskritName: "प्रथमपुरुषः", 
            meaning: "He / She / They", 
            forms: isAtmanepada 
              ? [`${prefix}${base}ते`, `${prefix}${base}ेते`, `${prefix}${base}न्ते`]
              : [currentResult.sanskrit, `${prefix}${base}तः`, `${prefix}${base}न्ति`]
          },
          { 
            name: "Madhyama Puruṣa (2nd Person)", 
            sanskritName: "मध्यमपुरुषः", 
            meaning: "You (singular/dual/plural)", 
            forms: isAtmanepada 
              ? [`${prefix}${base}से`, `${prefix}${base}ेथे`, `${prefix}${base}ध्वे`]
              : [`${prefix}${base}सि`, `${prefix}${base}थः`, `${prefix}${base}थ`]
          },
          { 
            name: "Uttama Puruṣa (1st Person)", 
            sanskritName: "उत्तमपुरुषः", 
            meaning: "I / We two / We all", 
            forms: isAtmanepada 
              ? [`${prefix}${base}े`, `${prefix}${base}ावहे`, `${prefix}${base}ामहे`]
              : [`${prefix}${base}मि`, `${prefix}${base}ावः`, `${prefix}${base}ामः`]
          }
        ]
      };
    }
  }, [currentUpasarga, currentDhatu, currentResult]);

  const activeMatrixRow = dynamicMatrixData.rows[selectedRowIndex % dynamicMatrixData.rows.length];
  const activeMatrixCellForm = activeMatrixRow.forms[selectedColIndex % 3];

  // Dynamic Etymology Data
  const currentEtymology: EtymologyData = useMemo(() => {
    if (ETYMOLOGY_DATABASE[keyString]) {
      return ETYMOLOGY_DATABASE[keyString];
    }
    // Computational linguistic fallback
    const isNama = currentDhatu.type === 'nama';
    return {
      sutra: isNama 
        ? "प्रातिपदिकार्थलिङ्गपरिमाणवचनमात्रे प्रथमा (२.३.४६)" 
        : "उपसर्गाः क्रियायोगे (१.४.५९) & कर्तरि शप् (३.१.६८)",
      sutraNumber: isNama ? "अष्टाध्यायी २.३.४६" : "अष्टाध्यायी १.४.५९",
      sutraType: isNama ? "संज्ञा / विधि-सूत्रम्" : "अधिकार / विधि-सूत्रम्",
      sutraExplanation: isNama
        ? `The nominal stem '${currentDhatu.sanskrit}' combines with prefix '${currentUpasarga.sanskrit}' under Pāṇinian nominal composition rules, expressing specific nominal case attributes.`
        : `The upasarga '${currentUpasarga.sanskrit}' joins the root sound '${currentDhatu.sanskrit}', transforming the intrinsic direction of action through the Śap thematic affix.`,
      derivationSteps: [
        {
          step: 1,
          title: "Prakṛti & Upasarga Adjunction",
          sutraRule: "उपसर्गाः क्रियायोगे (१.४.५९)",
          description: `The prefix '${currentUpasarga.sanskrit}' (${currentUpasarga.iast}) integrates with the root '${currentDhatu.sanskrit}'.`,
          intermediate: `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit}`
        },
        {
          step: 2,
          title: "Morphophonemic Adjustment",
          sutraRule: "अचोऽन्त्यादि टि (१.१.६४) / सार्वधातुके",
          description: "Internal sandhi and vowel harmony harmonize radical consonants and vowels.",
          intermediate: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit}`
        },
        {
          step: 3,
          title: "Inflectional Integration (सुप्तिङ्)",
          sutraRule: "सुप्तिङन्तं पदम् (१.४.१४)",
          description: `Addition of terminal markers yields the ready communicative pada '${currentResult.sanskrit}'.`,
          intermediate: currentResult.sanskrit
        }
      ],
      poeticNuance: `The modification of '${currentDhatu.sanskrit}' (${currentDhatu.meaning}) with '${currentUpasarga.sanskrit}' highlights subtle semantic contours in classical Sanskrit prose.`,
      literaryContext: "Standard classical Sanskrit morphological derivation adhering strictly to the Aṣṭādhyāyī canon.",
      exampleSentence: {
        sanskrit: `${currentResult.sanskrit} विद्वांसः शास्त्रमधीत्य।`,
        iast: `${currentResult.iast} vidvāṃsaḥ śāstram adhītya.`,
        translation: `The wise perceive and experience noble knowledge through disciplined study.`,
        source: "Classical Traditional Formulation"
      }
    };
  }, [keyString, currentUpasarga, currentDhatu, currentResult]);

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

  // Dial Navigation Cycles
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

  // Bookmark / Save to Notebook
  const saveActiveExpression = (type: 'equation' | 'matrix' | 'etymology') => {
    let newEntry: SavedExpression;

    if (type === 'equation') {
      newEntry = {
        id: `eq-${Date.now()}`,
        sanskrit: `${currentUpasarga.sanskrit} + ${currentDhatu.sanskrit} = ${currentResult.sanskrit}`,
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
        sanskrit: `${currentUpasarga.sanskrit}${currentDhatu.sanskrit} : ${currentEtymology.sutra}`,
        iast: currentEtymology.sutraNumber,
        meaning: currentEtymology.sutraExplanation.slice(0, 75) + "...",
        sourceType: 'etymology',
        details: currentEtymology.sutraType,
        savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    setSavedExpressions(prev => {
      // Avoid duplicate text
      if (prev.some(p => p.sanskrit === newEntry.sanskrit)) {
        return prev;
      }
      return [newEntry, ...prev];
    });
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
      
      {/* Background Ambient Glows - Zero harsh borders, pure transparent aesthetic */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-indigo-600/[0.07] blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-12 right-12 w-[600px] h-[500px] bg-purple-600/[0.05] blur-[170px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 left-10 w-[450px] h-[450px] bg-cyan-600/[0.04] blur-[160px] pointer-events-none rounded-full" />

      {/* FLOATING TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0f17]/70 border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo / Brand Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep('equation')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Atom className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">Sanskrit Morph Engine</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">Pāṇinian</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                MORPHOLOGICAL EQUATION · PARADIGM · ETYMOLOGY
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

          {/* Quick Actions: Saved Notebook Drawer & Pronounce */}
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
              {/* Studio Canvas Sub-Heading */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono uppercase tracking-widest mb-3">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Click Elements to Cycle Dials · Click Result to View Matrix</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white font-serif">
                  Pāṇinian Morphological Formula
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1">
                  Prefixes (Upasarga) combine with Verbal Roots (Dhātu) to transfigure semantics and engender novel derivations.
                </p>
              </div>

              {/* The Horizontal Formula Dial Architecture */}
              <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 my-4">
                
                {/* 1. UPASARGA (PREFIX) DIAL */}
                <div 
                  onClick={cycleUpasarga}
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col items-center text-center backdrop-blur-md shadow-2xl"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 flex items-center gap-1 transition-colors">
                    <span>{upasargaIndex + 1}/{UPASARGAS.length}</span>
                    <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1">
                    Prefix (उपसर्ग)
                  </div>
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
                </div>

                <div className="text-2xl font-light text-slate-600 select-none">+</div>

                {/* 2. DHĀTU (ROOT SOUND) DIAL */}
                <div className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] hover:border-indigo-500/40 transition-all flex flex-col items-center text-center backdrop-blur-md shadow-2xl">
                  
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
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-white/[0.06] w-full text-[11px] text-slate-400">
                    {currentDhatu.gana}
                  </div>
                </div>

                <div className="text-2xl font-light text-slate-600 select-none">=</div>

                {/* 3. DERIVATIVE RESULT BLOCK (Navigates to Step 2) */}
                <div 
                  onClick={() => setCurrentStep('matrix')}
                  className="group relative flex-1 w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-indigo-950/30 via-indigo-900/10 to-transparent border border-indigo-500/30 hover:border-indigo-500/70 transition-all cursor-pointer flex flex-col items-center text-center backdrop-blur-md shadow-2xl"
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
                  Click any cell to update the active form, hear authentic pronunciation, and illuminate the morphological paradigm.
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
                  {currentUpasarga.sanskrit} + {currentDhatu.sanskrit} = {currentResult.sanskrit}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Systematic deconstruction according to canonical grammatical sutras of Pāṇini.
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
                        Poetic Nuance & Semantic Transfiguration
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
                  &ldquo;Root sound <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentDhatu.sanskrit}&rsquo;</span> ({currentDhatu.meaning}) modified by prefix <span className="text-indigo-300 font-sans font-semibold">&lsquo;{currentUpasarga.sanskrit}&rsquo;</span> ({currentUpasarga.meaning}) engenders <span className="text-white font-sans font-bold">&lsquo;{currentResult.sanskrit}&rsquo;</span>. Click to explore matrix.&rdquo;
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
