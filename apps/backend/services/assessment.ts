import { GoogleGenAI } from "@google/genai";
import { Assessment, AssessmentSchema } from "../schemas/assessment";
import fs from "fs";
import path from "path";
import { transcribe } from "./transcription";
import adminSupabase from "../utils/supabase";


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

const SYSTEM_INSTRUCTION = fs.readFileSync(
  path.join(__dirname, "system-instructions.txt"),
  "utf8"
);

const slug = (s: string) => s.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();

export async function geminiAssessTranscript(case_name: string, transcript: string) {
  const res = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      {
        role: "user",
        parts: [{text: case_name}, { text: transcript }]
      }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: AssessmentSchema
    }
  });

  const text = (res as any)?.response?.text?.() ?? (res as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  const outPath = path.join(__dirname, `${slug(case_name)}.txt`);
  await fs.promises.writeFile(outPath, text, "utf8");

  return JSON.parse(text) as Assessment;
}

export async function uploadAssessmentToStorage(sessionId: string, assessmentJson: any): Promise<string> {
  const bucket = 'assessments';
  const filePath = `${sessionId}/assessment.json`;
  let file;
  if (typeof Blob !== 'undefined') {
    file = new Blob([JSON.stringify(assessmentJson)], { type: 'application/json' });
  } else {
    file = Buffer.from(JSON.stringify(assessmentJson), 'utf-8');
  }

  const { data, error } = await adminSupabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) {
    throw new Error(error.message || 'Failed to upload assessment to storage');
  }

  const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrlData?.publicUrl || filePath;
}

export async function runAssessment(case_name: string, roomName: string, sessionId: string): Promise<Assessment> {
  const transcriptionJson = await transcribe(roomName, sessionId);
  const transcript = transcriptionJson?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript;
  if (!transcript) {
    throw new Error('Transcript not found in transcription JSON');
  }
  const assessment = await geminiAssessTranscript(case_name, transcript);
  const storageUrl = await uploadAssessmentToStorage(sessionId, assessment);
  console.log('Assessment upload complete:', { storageUrl });
  return assessment;
}

// // Test Run
// const filePath = path.join(__dirname, "transcript.json");
// const raw = fs.readFileSync(filePath, "utf8");
// const json = JSON.parse(raw);
// const case_name = "Red Eye - Acute Angle Closure Glaucoma"
// const transcript = json.results.channels[0].alternatives[0].paragraphs.transcript;
// (async () => {
//     await assessTranscript(case_name, transcript);
// })();