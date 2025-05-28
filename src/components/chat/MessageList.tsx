
'use client';

import type { Message } from '@/types/chat';
import MessageItem from './MessageItem';
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageListProps {
  messages: Message[];
  searchTerm?: string;
}

export default function MessageList({ messages, searchTerm }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="h-[calc(100vh-200px)] md:h-[calc(100vh-220px)] w-full p-4 rounded-lg border bg-card flex-grow" ref={scrollAreaRef}>
      <div ref={viewportRef} className="h-full">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {searchTerm && searchTerm.trim() !== '' ? (
            <p>No messages found for "{searchTerm}".</p>
          ) : (
            <p>No messages yet. Start the conversation!</p>
          )}
        </div>
      )}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      </div>
    </ScrollArea>
  );
}

