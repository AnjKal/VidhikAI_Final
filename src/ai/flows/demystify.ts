import { z } from 'zod';
import type { Document } from '@/lib/history';
import { claudeText, safeJsonParse } from '@/ai/claude';
import { extractTextFromS3Object } from '@/ai/textract';

/* ---------------- SCHEMAS (UNCHANGED) ---------------- */

const JargonTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

const ObligationSchema = z.object({
  description: z.string(),
  date: z.string(),
});

const RiskSchema = z.object({
  clause: z.string(),
  riskLevel: z.enum(['High', 'Medium', 'Low']),
  explanation: z.string(),
});

const PiiSchema = z.object({
  entity: z.string(),
  original_text: z.string(),
  masked_text: z.string(),
});

const DemystifyDocumentOutputSchema = z.object({
  summary: z.string(),
  jargonBuster: z.array(JargonTermSchema),
  suggestedQuestions: z.array(z.string()),
  obligations: z.array(ObligationSchema),
  riskAnalysis: z.array(RiskSchema),
  text: z.string(),
  pii: z.array(PiiSchema),
});

export type DemystifyDocumentOutput =
  z.infer<typeof DemystifyDocumentOutputSchema>;

export type DemystifyDocumentRequest = {
  document: Document;
};

export async function demystifyDocument(
  input: DemystifyDocumentRequest
): Promise<DemystifyDocumentOutput> {
  console.log('[demystify:demystifyDocument] called — document:', input.document);

  if (!input.document.s3Key) {
    console.error('[demystify:demystifyDocument] no s3Key on document, aborting');
    throw new Error('Document must be uploaded to S3 before analysis.');
  }
  console.log('[demystify:demystifyDocument] s3Key:', input.document.s3Key);

  console.log('[demystify:demystifyDocument] calling extractTextFromS3Object...');
  const text = await extractTextFromS3Object(input.document.s3Key);
  console.log('[demystify:demystifyDocument] text extracted — length:', text.length, '— preview:', text.slice(0, 200));

  const prompt = `You are "Vidhik," an expert AI legal assistant specializing in multilingual document analysis.

You have been provided with extracted document text. Perform ALL tasks in a single step:

1. Identify and mask PII.
2. Generate detailed markdown summary.
3. Create comprehensive jargon buster.
4. Suggest 3-5 key questions.
5. Extract all obligations & deadlines.
6. Perform granular risk analysis.

CRITICAL:
- Output ONLY valid JSON, no other text before or after.
- Output must match this exact schema:
{
  "summary": "string - detailed markdown summary",
  "jargonBuster": [{"term": "string", "definition": "string"}],
  "suggestedQuestions": ["string"],
  "obligations": [{"description": "string", "date": "string"}],
  "riskAnalysis": [{"clause": "string", "riskLevel": "High|Medium|Low", "explanation": "string"}],
  "pii": [{"entity": "string", "original_text": "string", "masked_text": "string"}]
}
- All fields are REQUIRED. If no data exists for a field, use empty array [] or empty string "".
- No disclaimers or explanations outside the JSON.

DOCUMENT TEXT:
${text}

Respond with ONLY the JSON object:`;

  console.log('[demystify:demystifyDocument] prompt built — length:', prompt.length);
  console.log('[demystify:demystifyDocument] calling claudeText...');
  const responseText = await claudeText(prompt, { temperature: 0.2, maxTokens: 4096 });
  console.log('[demystify:demystifyDocument] claudeText returned — response length:', responseText.length, '— preview:', responseText.slice(0, 300));

  console.log('[demystify:demystifyDocument] parsing JSON response...');
  const parsed = safeJsonParse(responseText);
  console.log('[demystify:demystifyDocument] safeJsonParse succeeded');

  // Ensure the returned object contains the extracted text field expected by the UI.
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && !(parsed as any).text) {
    (parsed as any).text = text;
  }

  console.log('[demystify:demystifyDocument] validating schema...');
  const output = DemystifyDocumentOutputSchema.parse(parsed);
  console.log('[demystify:demystifyDocument] schema validation OK — returning result');
  return output;
}