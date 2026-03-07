import { NextResponse } from 'next/server';
import { z } from 'zod';
import { demystifyDocument } from '@/ai/flows/demystify';
import { verifyCognitoIdToken } from '@/server/cognito-auth';

const DocumentSchema = z.object({
	name: z.string(),
	url: z.string(),
	s3Key: z.string().optional(),
	mimeType: z.string().optional(),
});

const DemystifyRequestSchema = z.object({
	document: DocumentSchema,
});

export async function POST(req: Request) {
	console.log('[demystify/route] POST /api/demystify received');
	try {
		await verifyCognitoIdToken(req.headers.get('authorization'));

		const rawBody = await req.json();
		console.log('[demystify/route] raw body:', JSON.stringify(rawBody));

		const body = DemystifyRequestSchema.parse(rawBody);
		console.log('[demystify/route] schema parse OK — document:', body.document);

		console.log('[demystify/route] calling demystifyDocument...');
		const result = await demystifyDocument(body);
		console.log('[demystify/route] demystifyDocument succeeded — summary length:', result.summary?.length, '— riskAnalysis count:', result.riskAnalysis?.length);

		return NextResponse.json(result);
	} catch (err: any) {
		console.error('[demystify/route] ERROR:', err);
		const message = err?.message ?? 'Demystify failed';
		const status = message.includes('Authorization') ? 401 : 400;
		return NextResponse.json(
			{ error: message },
			{ status }
		);
	}
}
