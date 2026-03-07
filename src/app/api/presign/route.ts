import { NextResponse } from "next/server";
import { z } from "zod";
import { presignGetUrl } from "@/ai/s3";
import { verifyCognitoIdToken } from '@/server/cognito-auth';

const PresignRequestSchema = z.object({
  key: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    await verifyCognitoIdToken(req.headers.get('authorization'));
    const body = PresignRequestSchema.parse(await req.json());
    const url = await presignGetUrl(body.key);
    return NextResponse.json({ url });
  } catch (err: any) {
    const message = err?.message ?? "Presign failed";
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
