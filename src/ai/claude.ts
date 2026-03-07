import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const region = (process.env.AWS_REGION ?? 'us-east-1').trim();
const modelId =
  (process.env.BEDROCK_MODEL_ID ??
  'anthropic.claude-3-5-sonnet-20240620-v1:0').trim();

console.log('[claude] module loaded — region:', region, '— modelId:', modelId);
console.log('[claude] AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET (' + process.env.AWS_ACCESS_KEY_ID.trim().slice(0,8) + '...)' : 'NOT SET');
console.log('[claude] AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');

const bedrockRuntime = new BedrockRuntimeClient({ region });
console.log('[claude] BedrockRuntimeClient initialized');

export type ClaudeOptions = {
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

export async function claudeText(prompt: string, options: ClaudeOptions = {}) {
  console.log('[claude:claudeText] called — modelId:', modelId, '— prompt length:', prompt.length, '— maxTokens:', options.maxTokens ?? 4096, '— temperature:', options.temperature ?? 0.2);
  
  const messages: any[] = [
    {
      role: "user",
      content: [{ text: prompt }],
    },
  ];

  const inferenceConfig: any = {
    maxTokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.2,
  };

  const commandInput: any = {
    modelId,
    messages,
    inferenceConfig,
  };

  // Only add system if provided
  if (options.system) {
    commandInput.system = [{ text: options.system }];
  }

  const command = new ConverseCommand(commandInput);

  console.log('[claude:claudeText] sending ConverseCommand to Bedrock...');
  console.log('[claude:claudeText] using region:', region, '— modelId:', modelId);
  let response;
  try {
    response = await bedrockRuntime.send(command);
    console.log('[claude:claudeText] Bedrock response received — stopReason:', response.stopReason, '— usage:', JSON.stringify(response.usage));
  } catch (err: any) {
    console.error('[claude:claudeText] Bedrock ConverseCommand FAILED');
    console.error('[claude:claudeText]   error name    :', err?.name);
    console.error('[claude:claudeText]   error code    :', err?.Code ?? err?.$metadata?.httpStatusCode);
    console.error('[claude:claudeText]   http status   :', err?.$metadata?.httpStatusCode);
    console.error('[claude:claudeText]   message       :', err?.message);
    console.error('[claude:claudeText]   full error    :', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    throw err;
  }

  const contentBlocks = response.output?.message?.content ?? [];
  console.log('[claude:claudeText] contentBlocks count:', contentBlocks.length);
  const text = contentBlocks
    .map((block) => ("text" in block ? block.text : ""))
    .join("")
    .trim();

  console.log('[claude:claudeText] extracted text length:', text.length, '— preview:', text.slice(0, 200));
  return text;
}

export function safeJsonParse(text: string): unknown {
  console.log('[claude:safeJsonParse] called — input length:', text.length);
  
  // Clean the text first - remove control characters and fix common issues
  let cleanedText = text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim();
  
  try {
    const result = JSON.parse(cleanedText);
    console.log('[claude:safeJsonParse] direct JSON.parse succeeded');
    return result;
  } catch {
    console.warn('[claude:safeJsonParse] direct parse failed, trying to extract JSON from response...');
    // Try extracting the first JSON object/array from the response.
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleanedText.slice(firstBrace, lastBrace + 1);
      console.log('[claude:safeJsonParse] trying object extraction — candidate length:', candidate.length);
      const result = JSON.parse(candidate);
      console.log('[claude:safeJsonParse] object extraction succeeded');
      return result;
    }

    const firstBracket = cleanedText.indexOf("[");
    const lastBracket = cleanedText.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const candidate = cleanedText.slice(firstBracket, lastBracket + 1);
      console.log('[claude:safeJsonParse] trying array extraction — candidate length:', candidate.length);
      const result = JSON.parse(candidate);
      console.log('[claude:safeJsonParse] array extraction succeeded');
      return result;
    }

    console.error('[claude:safeJsonParse] all parse attempts failed — raw text preview:', cleanedText.slice(0, 500));
    throw new Error("Model response was not valid JSON");
  }
}
