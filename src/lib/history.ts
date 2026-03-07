import type { DemystifyDocumentOutput } from '@/ai/flows/demystify';
import type { CompareDocumentsOutput } from '@/ai/flows/compare';
import type { Message } from '@/components/chat';

export type Document = {
  name: string;
    url: string;
    s3Key?: string;
    mimeType?: string;
};

export type DisplayDocument = Document & {
    summary?: string;
};

export type AnalysisResult = DemystifyDocumentOutput;
export type ComparisonResult = CompareDocumentsOutput;

type BaseHistoryItem = {
    id: string;
    userId: string;
    createdAt: number; // epoch millis
};

export type ChatHistoryItem = BaseHistoryItem & {
    type: 'chat';
    document: Document;
    analysis: AnalysisResult | null;
    messages: Message[];
};

export type CompareHistoryItem = BaseHistoryItem & {
    type: 'compare';
    documentA: Document;
    documentB: Document;
    comparison: ComparisonResult | null;
};

export type HistoryItem = ChatHistoryItem | CompareHistoryItem;

async function apiFetch<T>(
    path: string,
    params: {
        idToken: string;
        method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
        body?: unknown;
    }
): Promise<T> {
    console.log(`[history:apiFetch] ${params.method ?? 'GET'} ${path}`);
    const res = await fetch(path, {
        method: params.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${params.idToken}`,
        },
        body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        console.error(`[history:apiFetch] ${params.method ?? 'GET'} ${path} failed — status: ${res.status} — error:`, (json as any)?.error ?? json);
        throw new Error((json as any)?.error || 'Request failed');
    }
    console.log(`[history:apiFetch] ${params.method ?? 'GET'} ${path} succeeded — status:`, res.status);
    return json as T;
}

export async function fetchHistory(idToken: string): Promise<HistoryItem[]> {
    const json = await apiFetch<{ items: HistoryItem[] }>('/api/history', {
        idToken,
        method: 'GET',
    });
    return json.items ?? [];
}

export async function addHistoryItem(
    idToken: string,
    item: Omit<HistoryItem, 'id' | 'createdAt'>
): Promise<string> {
    const json = await apiFetch<{ id: string }>('/api/history', {
        idToken,
        method: 'POST',
        body: item,
    });
    return json.id;
}

export async function updateHistoryItem(
    idToken: string,
    id: string,
    data: Partial<HistoryItem>
): Promise<void> {
    await apiFetch<{ ok: true }>(`/api/history/${encodeURIComponent(id)}`, {
        idToken,
        method: 'PATCH',
        body: data,
    });
}

export async function deleteHistoryItem(idToken: string, id: string): Promise<void> {
    await apiFetch<{ ok: true }>(`/api/history/${encodeURIComponent(id)}`, {
        idToken,
        method: 'DELETE',
    });
}

export async function clearHistory(idToken: string): Promise<void> {
    await apiFetch<{ ok: true }>('/api/history/clear', {
        idToken,
        method: 'POST',
    });
}
