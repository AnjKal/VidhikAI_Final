
'use client';

import { Send, Bot, Mic } from 'lucide-react';
import { useRef, useState, useTransition, useEffect, useMemo } from 'react';
import type { HistoryItem } from '@/lib/history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './chat-message';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth';


export type Message = {
  sender: 'user' | 'ai';
  content: string;
};

type ChatProps = {
  session: Extract<HistoryItem, { type: 'chat' }> | null;
  onMessagesChange: (messages: Message[]) => void;
  searchQuery: string;
};

// SpeechRecognition might not be available on the window object in all environments.
// We declare it here to avoid TypeScript errors.
declare global {
    interface Window {
      SpeechRecognition: any;
      webkitSpeechRecognition: any;
    }
}


export default function Chat({ session, onMessagesChange, searchQuery }: ChatProps) {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const auth = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);


  const sessionMessages = session?.messages ?? [];
  const document = session?.document ?? null;
  const analysis = session?.analysis ?? null;
  const suggestedQuestions = analysis?.suggestedQuestions;
  
  const filteredMessages = useMemo(() => {
    if (!searchQuery) {
        return sessionMessages;
    }
    return sessionMessages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sessionMessages, searchQuery]);

  // Show suggestions if analysis is done and the last message was from the AI, or if the chat is empty.
  const lastMessageIsFromAi = sessionMessages.length > 0 && sessionMessages[sessionMessages.length - 1].sender === 'ai';
  const showSuggestions = analysis && (sessionMessages.length === 0 || lastMessageIsFromAi);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages, isPending]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInput(input + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            toast({
                title: "Speech Recognition Error",
                description: `An error occurred: ${event.error}`,
                variant: 'destructive',
            })
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }
  }, [input, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast({
            title: "Browser Not Supported",
            description: "Your browser does not support speech recognition.",
            variant: "destructive",
        });
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        setInput(''); // Clear input before starting
        recognitionRef.current.start();
        setIsListening(true);
    }
  };


  const submitMessage = (message: string) => {
    if (!message.trim() || !document || !analysis || isPending) return;

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    }

    const userMessage: Message = { sender: 'user', content: message };
    const newMessages = [...sessionMessages, userMessage];
    onMessagesChange(newMessages); // Optimistic update
    setInput('');

    startTransition(async () => {
      try {
        const token = await auth.getIdToken();
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            question: message,
            documentText: analysis.text,
            chatHistory: newMessages.slice(0, -1),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Ask failed');
        const result = json.answer as string;

        const aiMessage: Message = { sender: 'ai', content: result };
        onMessagesChange([...newMessages, aiMessage]);

      } catch (e: any) {
        toast({
          title: 'An error occurred',
          description: e.message || "An unknown error occurred.",
          variant: 'destructive',
        });
        // Revert optimistic update
        onMessagesChange(sessionMessages);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleSuggestionClick = (question: string) => {
    submitMessage(question);
  };

  const SuggestedQuestions = () => (
    <div className="p-4 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Suggested Questions:</p>
        <div className="flex flex-wrap gap-2">
            {suggestedQuestions!.map((q, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => handleSuggestionClick(q)}>
                    {q}
                </Button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4">
            {sessionMessages.length === 0 && !document && (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p className="p-10">
                  Please upload a document to begin your legal analysis.
                </p>
              </div>
            )}
             {sessionMessages.length === 0 && document && !analysis && (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p className="p-10">
                  {`Document "${document.name}" is ready. Click "Demystify Document" to begin analysis.`}
                </p>
              </div>
            )}
            {filteredMessages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
             {showSuggestions && !searchQuery && <SuggestedQuestions />}
            {isPending && (
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot size={20} />
                </div>
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening...'
                : analysis
                ? 'Ask a question about your document...'
                : 'Demystify a document first'
            }
            disabled={!analysis || isPending}
            className="pr-24 bg-gradient-to-r from-gray-100 to-gray-200"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                'h-8 w-8 rounded-full',
                isListening ? 'text-red-500' : 'text-muted-foreground'
              )}
              onClick={toggleListening}
              disabled={!analysis || isPending}
            >
              <Mic size={16} />
            </Button>
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-primary-foreground hover:opacity-90 transition-opacity"
              disabled={!analysis || isPending || !input.trim()}
            >
              <Send size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
