/**
 * @fileOverview Flow for comparing two legal documents.
 */
import { z } from 'zod';
import type { Document } from '@/lib/history';
import { claudeText, safeJsonParse } from '@/ai/claude';
import { extractTextFromS3Object } from '@/ai/textract';

const ClauseComparisonSchema = z.object({
    clause: z.string().describe("The name or a summary of the clause, in English."),
    documentA_details: z.string().describe("The specific text or summary from Document A, in English."),
    documentB_details: z.string().describe("The specific text or summary from Document B, in English."),
    change_description: z.string().describe("A detailed description of how the clause has changed, explaining the practical impact of the modification, in English."),
  });
  
  const CompareDocumentsOutputSchema = z.object({
      summary: z.string().describe("A detailed, multi-paragraph summary of the key differences between the two documents. Explain the overall significance of the changes, in English."),
      newClauses: z.array(z.object({
          clause: z.string().describe("The new clause or term introduced, in English."),
          description: z.string().describe("A detailed explanation of what the new clause means and its potential impact on the user, in English."),
      })).describe("An exhaustive list of all significant clauses or terms present in Document B but not in Document A."),
      changedTerms: z.array(ClauseComparisonSchema).describe("An exhaustive list of terms or clauses that have been modified between the two documents."),
      deletedClauses: z.array(z.object({
          clause: z.string().describe("The clause or term that was removed, in English."),
          description: z.string().describe("A detailed explanation of the potential impact and risks associated with this removal, in English."),
      })).describe("An exhaustive list of all significant clauses or terms present in Document A but removed from Document B."),
  });
  
  const CompareDocumentsInputSchema = z.object({ docA: z.string(), docB: z.string() });
  
  export type CompareDocumentsOutput = z.infer<typeof CompareDocumentsOutputSchema>;
  export type CompareDocumentsInput = z.infer<typeof CompareDocumentsInputSchema>;

export type CompareDocumentsRequest = {
  documentA: Document;
  documentB: Document;
};

export async function compareDocuments(
  input: CompareDocumentsRequest
): Promise<CompareDocumentsOutput> {
  if (!input.documentA.s3Key || !input.documentB.s3Key) {
    throw new Error('Both documents must be uploaded to S3 before comparison.');
  }

  const [textA, textB] = await Promise.all([
    extractTextFromS3Object(input.documentA.s3Key),
    extractTextFromS3Object(input.documentB.s3Key),
  ]);

  const prompt = `You are a "Master Legal Analyst" AI with multilingual capabilities. Your task is to perform an exceptionally detailed comparison between two legal documents: Document A and Document B.

You have been provided with extracted text for both documents. Your entire analysis must be based **exclusively** on these texts.

1. **Exhaustively Analyze Document A:** Meticulously parse every clause, term, and obligation from its text.
2. **Exhaustively Analyze Document B:** Meticulously parse every clause, term, and obligation from its text.
3. **Synthesize and Compare:** Based on your deep analysis of the extracted texts, generate a highly detailed comparison report with the following sections, all written in English:
   - Detailed Summary
   - New Clauses
   - Changed Terms
   - Deleted Clauses

CRITICAL INSTRUCTIONS:
- Output ONLY valid JSON, no other text before or after.
- Output must match this exact schema:
{
  "summary": "string - detailed multi-paragraph summary in English",
  "newClauses": [{"clause": "string", "description": "string"}],
  "changedTerms": [{"clause": "string", "documentA_details": "string", "documentB_details": "string", "change_description": "string"}],
  "deletedClauses": [{"clause": "string", "description": "string"}]
}
- All fields are REQUIRED. If no data exists for a field, use empty array [] or empty string "".
- Output MUST be English only.
- No disclaimers or explanations outside the JSON.

DOCUMENT A TEXT:
${textA}

DOCUMENT B TEXT:
${textB}

Respond with ONLY the JSON object:`;

  const raw = await claudeText(prompt, { temperature: 0.1, maxTokens: 4096 });
  const parsed = safeJsonParse(raw);
  return CompareDocumentsOutputSchema.parse(parsed);
}
