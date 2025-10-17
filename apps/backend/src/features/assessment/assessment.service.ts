import { GoogleGenAI } from "@google/genai";
import { Assessment, AssessmentSchema } from "@/features/assessment/assessment.schema.js";
import fs from "fs";
import path from "path";
import { transcribe } from "@/features/assessment/transcription.service.js";
import type { TypedSupabaseClient } from "@/utils/supabaseClient.js";
import type { Json } from "@/types/database.types.js";
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

const SYSTEM_INSTRUCTION = fs.readFileSync(
  path.join(__dirname, "system-instructions.txt"),
  "utf8"
);


interface GeminiResponseCandidatePart { text?: string }
interface GeminiResponseCandidateContent { parts?: GeminiResponseCandidatePart[] }
interface GeminiResponseCandidate { content?: GeminiResponseCandidateContent }
interface GeminiGenerateContentResponse {
  response?: { text?: () => string };
  candidates?: GeminiResponseCandidate[];
}

type TranscriptionJson = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        paragraphs?: { transcript?: string }
      }>
    }>
  }
}

function isTranscriptionJson(value: unknown): value is TranscriptionJson {
  if (value === null || typeof value !== 'object') return false;
  const root = value as Record<string, unknown>;
  if (!('results' in root)) return true;
  const results = root.results;
  return typeof results === 'object' && results !== null;
}


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

  const r = res as GeminiGenerateContentResponse;
  const primary = typeof r.response?.text === 'function' ? r.response.text() : undefined;
  const fallback = r.candidates?.[0]?.content?.parts?.[0]?.text;
  const safeText: string = typeof primary === 'string' ? primary : (typeof fallback === 'string' ? fallback : '{}');

  return JSON.parse(safeText) as Assessment;
}

export async function uploadAssessmentToStorage(supabaseAuthenticated: TypedSupabaseClient, roundId: string, assessmentJson: Json): Promise<string> {
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
  return data[0].id;
}

export async function runAssessment(supabaseAuthenticated: TypedSupabaseClient, roomName: string, roomId: string, roundId: string, caseName: string): Promise<Assessment> {
  const transcriptionJsonUnknown: unknown = await transcribe(supabaseAuthenticated, roomName, roomId, roundId);
  if (!isTranscriptionJson(transcriptionJsonUnknown)) {
    throw new Error('Invalid transcription JSON');
  }
  const transcript = transcriptionJsonUnknown?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript;
  if (!transcript) {
    throw new Error('Transcript not found in transcription JSON');
  }
  const assessment = await geminiAssessTranscript(caseName, transcript);
  await uploadAssessmentToStorage(supabaseAuthenticated, roundId, toJson(assessment));
  console.log('Assessment saved to practice_rounds:', { roundId });
  return assessment;
}

function toJson(value: unknown): Json {
  // Ensure value is serializable JSON
  return JSON.parse(JSON.stringify(value)) as Json;
}