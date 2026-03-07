/**
 * @fileOverview Flow for asking a follow-up question about a legal document.
 */
import { z } from 'zod';
import { claudeText } from '@/ai/claude';


// Define a simple schema for chat messages
const MessageSchema = z.object({
  sender: z.enum(['user', 'ai']),
  content: z.string(),
});

const AskQuestionInputSchema = z.object({
  question: z.string(),
  documentText: z.string().describe("The full text content of the document to be queried."),
  chatHistory: z.array(MessageSchema),
});

const AskQuestionOutputSchema = z.string();

export type AskQuestionInput = z.infer<typeof AskQuestionInputSchema>;
export type AskQuestionOutput = z.infer<typeof AskQuestionOutputSchema>;

export async function generateLegalAnswer(
  input: AskQuestionInput
): Promise<AskQuestionOutput> {
  const history = input.chatHistory
    .map((msg) => `${msg.sender}: ${msg.content}`)
    .join('\n');

  const prompt = `You are "Vidhik," an expert AI legal assistant specializing in document analysis. Your primary goal is to answer questions based *exclusively* on the provided context.

CRITICAL INSTRUCTIONS:
1. Analyze the Provided Context: You will be given DOCUMENT CONTEXT from a legal document, a HISTORY of the current conversation, and a new USER QUESTION. Your entire analysis and answer MUST be based exclusively on this information.
2. Use Chat History: Refer to the conversation HISTORY to understand the context of the new USER QUESTION.
3. If the answer is not in the context, say so: If the provided document context does not contain the answer, you must state that the information is not available in the document excerpts. Do not try to guess.
4. English Output ONLY (MANDATORY).
5. Strict Formatting (MANDATORY): Use markdown (bold, bullets, headings) as helpful.

DOCUMENT CONTEXT:
${input.documentText}

CONVERSATION HISTORY:
${history}

USER QUESTION:
${input.question}
`;

  return claudeText(prompt, { temperature: 0.2, maxTokens: 1024 });
}
