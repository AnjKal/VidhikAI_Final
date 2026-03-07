import { NextResponse } from 'next/server';
import { z } from 'zod';
import { compareDocuments } from '@/ai/flows/compare';
import { verifyCognitoIdToken } from '@/server/cognito-auth';

const DocumentSchema = z.object({
	name: z.string(),
	url: z.string(),
	s3Key: z.string().optional(),
	mimeType: z.string().optional(),
});

const CompareRequestSchema = z.object({
	documentA: DocumentSchema,
	documentB: DocumentSchema,
});

export async function POST(req: Request) {
	try {
		await verifyCognitoIdToken(req.headers.get('authorization'));
		const body = CompareRequestSchema.parse(await req.json());
		const result = await compareDocuments(body);
		return NextResponse.json(result);
	} catch (err: any) {
		const message = err?.message ?? 'Compare failed';
		const status = message.includes('Authorization') ? 401 : 400;
		return NextResponse.json(
			{ error: message },
			{ status }
		);
	}
}
