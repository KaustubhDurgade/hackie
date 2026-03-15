'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  phase: number;
}

interface MessageStreamProps {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  currentPhase?: number;
}

const PHASE_HINTS: Record<number, string> = {
  1: 'Describe your idea, or ask me to generate one based on your context.',
  2: 'What are the core features your app needs?',
  3: 'Walk me through how the app works — I\'ll design the architecture.',
  4: 'What\'s your team\'s strongest tech stack? I\'ll recommend a template.',
  5: 'Let\'s build your pitch — landing page and deck outline.',
};

function AssistantText({ content }: { content: string }) {
  return (
    <div className="chat-prose text-sm leading-relaxed text-[#3a3530]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function MessageStream({ messages, streamingContent, isStreaming, currentPhase }: MessageStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center py-16 select-none">
          <p className="font-display text-xl font-bold text-[#c8c1b8] mb-2">ready.</p>
          <p className="text-[#a8a29e] text-xs max-w-[220px] leading-relaxed">
            {currentPhase ? PHASE_HINTS[currentPhase] : 'Describe your idea and I\'ll help you build something that wins.'}
          </p>
        </div>
      )}

      {messages.map(msg => (
        <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
          {msg.role === 'assistant' && (
            <div className="w-0.5 bg-[#e2ddd6] mr-3 shrink-0 self-stretch rounded-full" />
          )}
          <div className={cn(
            'max-w-[88%]',
            msg.role === 'user'
              ? 'bg-[#1c1917] text-white text-sm leading-relaxed px-3.5 py-2 rounded-2xl rounded-br-sm'
              : 'py-0.5'
          )}>
            {msg.role === 'user'
              ? msg.content
              : <AssistantText content={msg.content} />
            }
          </div>
        </div>
      ))}

      {isStreaming && (
        <div className="flex justify-start">
          <div className="w-0.5 bg-[#e2ddd6] mr-3 shrink-0 self-stretch rounded-full" />
          <div className="max-w-[88%] py-0.5">
            {streamingContent
              ? <AssistantText content={streamingContent} />
              : (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-[#c8c1b8] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#c8c1b8] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#c8c1b8] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )
            }
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
