import { Bot, User } from 'lucide-react';
import type { Message } from './chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
    message: Message;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const { sender, content } = message;
  const isUser = sender === 'user';

  return (
    <div className={cn('flex items-start gap-4', isUser ? 'justify-end' : '')}>
      {!isUser && (
         <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot size={20} />
        </div>
      )}
      <div
        className={cn(
          'max-w-xl rounded-lg p-3 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
        ) : (
            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                {content}
            </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
