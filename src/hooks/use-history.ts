'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    addHistoryItem as addHistoryItemApi,
    updateHistoryItem as updateHistoryItemApi,
    deleteHistoryItem as deleteHistoryItemApi,
    clearHistory as clearHistoryApi,
    fetchHistory,
    type HistoryItem
} from '@/lib/history';
import { useAuth } from '@/auth';

export function useHistory(userId?: string) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const auth = useAuth();
    const loadedRef = useRef(false);

    const requireIdToken = useCallback(async () => {
        return await auth.getIdToken();
    }, [auth]);

    const refresh = useCallback(async () => {
        if (!userId) {
            setHistory([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const token = await requireIdToken();
            const items = await fetchHistory(token);
            const sorted = [...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
            setHistory(prev => 
                JSON.stringify(prev) === JSON.stringify(sorted) ? prev : sorted
            );
        } finally {
            setIsLoading(false);
        }
    }, [requireIdToken, userId]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                await refresh();
            } catch {
                // Keep last known state; errors are handled at call sites.
            }
        };

        if (!userId) {
            setHistory([]);
            setIsLoading(false);
            return;
        }

        // Only load once on mount
        if (!loadedRef.current) {
            run();
            loadedRef.current = true;
        }

        const interval = setInterval(() => {
            if (cancelled) return;
            run();
        }, 60_000); // Poll every 60 seconds

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [userId]); // Removed refresh from dependencies to prevent loop

    const addHistoryItem = useCallback(async (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
        if (!userId) throw new Error('User not authenticated');
        const token = await requireIdToken();
        const id = await addHistoryItemApi(token, item);
        await refresh();
        return id;
    }, [refresh, requireIdToken, userId]);

    const updateHistoryItem = useCallback(async (id: string, data: Partial<HistoryItem>) => {
        if (!userId) throw new Error('User not authenticated');

        // Optimistic local update to keep UI responsive.
        setHistory((prev) =>
            prev.map((item) => (item.id === id ? ({ ...item, ...data } as HistoryItem) : item))
        );

        const token = await requireIdToken();
        await updateHistoryItemApi(token, id, data);
    }, [requireIdToken, userId]);

    const deleteHistoryItem = useCallback(async (id: string) => {
        if (!userId) throw new Error('User not authenticated');
        const token = await requireIdToken();
        await deleteHistoryItemApi(token, id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
    }, [requireIdToken, userId]);

    const clearHistory = useCallback(async () => {
        if (!userId) return;
        const token = await requireIdToken();
        await clearHistoryApi(token);
        setHistory([]);
    }, [requireIdToken, userId]);

    return { history, isLoading, addHistoryItem, updateHistoryItem, deleteHistoryItem, clearHistory };
}