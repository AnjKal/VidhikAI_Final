import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadToS3 } from "@/ai/s3";
import { verifyCognitoIdToken } from '@/server/cognito-auth';

const UploadRequestSchema = z.object({
  filename: z.string().min(1),
  dataUrl: z.string().min(1),
});

function parseDataUrl(dataUrl: string): { mimeType: string; bytes: Uint8Array } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid data URL format");
  }
  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  return { mimeType, bytes: new Uint8Array(buffer) };
}

export async function POST(req: Request) {
  console.log('[upload/route] POST /api/upload received');
  try {
    await verifyCognitoIdToken(req.headers.get('authorization'));

    const rawBody = await req.json();
    console.log('[upload/route] raw body keys:', Object.keys(rawBody), '— filename:', rawBody?.filename, '— dataUrl present:', !!rawBody?.dataUrl, '— dataUrl length:', rawBody?.dataUrl?.length);

    const body = UploadRequestSchema.parse(rawBody);
    console.log('[upload/route] schema parse OK — filename:', body.filename);

    const { mimeType, bytes } = parseDataUrl(body.dataUrl);
    console.log('[upload/route] parseDataUrl OK — mimeType:', mimeType, '— bytes:', bytes.length);

    console.log('[upload/route] calling uploadToS3...');
    const result = await uploadToS3({
      filename: body.filename,
      mimeType,
      body: bytes,
    });
    console.log('[upload/route] uploadToS3 succeeded — key:', result.key, '— mimeType:', result.mimeType);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[upload/route] ERROR:', err);
    const message = err?.message ?? "Upload failed";
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
