import { GoogleGenAI } from "@google/genai";
import { Assessment, AssessmentSchema } from "@/features/assessment/assessment.schema.js";
import fs from "fs";
import path from "path";
import { transcribe } from "@/features/assessment/transcription.service.js";
import { updatePracticeRoundWithReturn } from "@/features/practiceRound/practiceRound.repo.js";
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


// Narrow subset of the Google GenAI response is accessed via optional chaining

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
  if (typeof value !== 'object' || value === null) return false;
  if (!('results' in value)) return true;
  const v = value as { results?: unknown };
  return typeof v.results === 'object' && v.results !== null;
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAssessment(value: unknown): value is Assessment {
  if (!isNonNullObject(value)) return false;
  const v = value;
  const hasMaxTotal = typeof v.max_total === 'number';
  const dims = v.dimensions;
  const hasDimensions = Array.isArray(dims);
  const totalsOk = isNonNullObject(v.totals);
  const feedbackOk = isNonNullObject(v.overall_feedback);
  return hasMaxTotal && hasDimensions && totalsOk && feedbackOk;
}

export async function geminiAssessTranscript(caseName: string, transcript: string): Promise<Assessment> {

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

  // Safely extract JSON text from response without assertions
  const safeText = res.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsedResponse: unknown = JSON.parse(safeText);
  
  if (!isAssessment(parsedResponse)) {
    throw new Error('Model returned invalid assessment JSON');
  }

  return parsedResponse;

}

export async function uploadAssessmentToStorage(supabaseAuthenticated: TypedSupabaseClient, roundId: string, assessmentJson: Json): Promise<void> {
  
  await updatePracticeRoundWithReturn(
    supabaseAuthenticated, 
    {
      roundId,
      assessment: assessmentJson
    }
  );

  return
}

export type RunAssessmentParams = {
  roomName: string;
  roomId: string;
  roundId: string;
  caseName: string;
}

export async function runAssessment(
  supabaseAuthenticated: TypedSupabaseClient,
  params: RunAssessmentParams
): Promise<Assessment> {

  const { roomName, roomId, roundId, caseName } = params

  const transcriptionParams = { roomName, roomId, roundId }

  const transcriptionJsonUnknown: unknown = await transcribe(supabaseAuthenticated, transcriptionParams);

  if (!isTranscriptionJson(transcriptionJsonUnknown)) {
    throw new Error('Invalid transcription JSON');
  }

  const transcript = transcriptionJsonUnknown?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript;

  if (!transcript) {
    throw new Error('Transcript not found in transcription JSON');
  }
  
  const assessment = await geminiAssessTranscript(caseName, transcript);

  await uploadAssessmentToStorage(supabaseAuthenticated, roundId, toJson(assessment));
  
  console.log('Assessment saved to practice_rounds:', { roundId: roundId });
  return assessment;
}

function toJson(value: unknown): Json {
  // Ensure value is serializable JSON; JSON.parse returns unknown then narrowed
  const serialized = JSON.stringify(value);
  return JSON.parse(serialized) as Json;
}