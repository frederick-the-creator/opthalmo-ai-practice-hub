import { GoogleGenAI } from "@google/genai";
import { Assessment, AssessmentSchema } from "./assessmentSchema";
import fs from "fs";
import path from "path";
import { transcribe } from "./transcription";
import type { TypedSupabaseClient } from "../../utils/supabaseClient";


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

const SYSTEM_INSTRUCTION = fs.readFileSync(
  path.join(__dirname, "system-instructions.txt"),
  "utf8"
);

const slug = (s: string) => s.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();

export async function geminiAssessTranscript(caseName: string, transcript: string) {
  const res = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      {
        role: "user",
        parts: [{text: caseName}, { text: transcript }]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: AssessmentSchema
    }
  });

  const text = (res as any)?.response?.text?.() ?? (res as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  return JSON.parse(text) as Assessment;
}

export async function uploadAssessmentToStorage(supabaseAuthenticated: TypedSupabaseClient, roundId: string, assessmentJson: any): Promise<string> {
  const { data, error } = await supabaseAuthenticated
    .from('practice_rounds')
    .update({ assessment: assessmentJson })
    .eq('id', roundId)
    .select('id');
  if (error) {
    throw new Error(error.message || 'Failed to update assessment on practice_rounds');
  }
  if (!data || !data[0]) {
    throw new Error('No practice_round found or updated');
  }
  return data[0].id as string;
}

export async function runAssessment(supabaseAuthenticated: TypedSupabaseClient, roomName: string, roomId: string, roundId: string, caseName: string): Promise<any> {
  const transcriptionJson = await transcribe(supabaseAuthenticated, roomName, roomId, roundId);
  const transcript = transcriptionJson?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript;
  if (!transcript) {
    throw new Error('Transcript not found in transcription JSON');
  }
  const assessment = await geminiAssessTranscript(caseName, transcript);
  await uploadAssessmentToStorage(supabaseAuthenticated, roundId, assessment);
  console.log('Assessment saved to practice_rounds:', { roundId });
  return assessment;
}