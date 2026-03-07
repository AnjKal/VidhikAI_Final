import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateLegalAnswer } from '@/ai/flows/ask';
import { verifyCognitoIdToken } from '@/server/cognito-auth';

const MessageSchema = z.object({
	sender: z.enum(['user', 'ai']),
	content: z.string(),
});

const AskRequestSchema = z.object({
	question: z.string().min(1),
	documentText: z.string().min(1),
	chatHistory: z.array(MessageSchema),
});

export async function POST(req: Request) {
	try {
		await verifyCognitoIdToken(req.headers.get('authorization'));
		const body = AskRequestSchema.parse(await req.json());
		const result = await generateLegalAnswer(body);
		return NextResponse.json({ answer: result });
	} catch (err: any) {
		const message = err?.message ?? 'Ask failed';
		const status = message.includes('Authorization') ? 401 : 400;
		return NextResponse.json(
			{ error: message },
			{ status }
		);
	}
}
