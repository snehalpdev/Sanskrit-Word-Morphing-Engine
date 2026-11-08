import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  let upasarga: any = {};
  let dhatu: any = {};
  let dhatuMeaning = "";
  let result: any = {};
  let context = "";

  try {
    const body = await req.json();
    upasarga = body.upasarga || {};
    dhatu = body.dhatu || {};
    dhatuMeaning = body.dhatuMeaning || "";
    result = body.result || {};
    context = body.context || "";

    const prompt = `You are an expert Sanskrit grammarian and computational linguist versed in Panini's Ashtadhyayi.
Analyze the following Sanskrit morphological derivation:
- Upasarga (Prefix): ${upasarga.sanskrit} (${upasarga.iast} - ${upasarga.meaning})
- Root (Dhātu): ${dhatu.sanskrit} (${dhatu.iast} - ${dhatuMeaning})
- Resulting Form: ${result.sanskrit} (${result.iast} - ${result.meaning})
- Grammatical Context: ${context}

Provide a concise, profound, and structured etymological breakdown in JSON format with the following keys:
1. "sutra": The relevant Paninian sutra or grammatical rule (e.g., "उपसर्गाद्वा...", "कर्तरि शप्", etc.)
2. "derivationSteps": Array of 3 short steps explaining how the prefix and root combine (sandhi, guna/vriddhi, pratyaya).
3. "poeticNuance": A poetic or classical Sanskrit literary nuance of this specific combination.
4. "exampleSentence": A Sanskrit sentence using this word with IAST and English translation.

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Gemini etymology error:", error);
    const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
    
    return NextResponse.json(
      { 
        sutra: isRateLimit ? "Paninian Rule (API Quota Rate Limit Reached - Using Classical Fallback)" : "Paninian Derivation Principle",
        derivationSteps: [
          `Union of Upasarga (${upasarga?.sanskrit || 'Prefix'}) with Dhātu root sound`,
          "Application of internal Sandhi and vowel modifications",
          "Suffixation (Pratyaya) for tense/case alignment"
        ],
        poeticNuance: "This combination invokes subtle layers of classical Sanskrit literary texture and root semantics.",
        exampleSentence: "प्ररमते सतां मध्ये धीरः। (The wise man rejoices in the company of the good.)"
      },
      { status: 200 }
    );
  }
}
