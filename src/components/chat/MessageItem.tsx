'use client';

import type { Message } from '@/types/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText, UserCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const isImageFile = message.type === 'file' && message.filePath && /\.(jpg|jpeg|png|gif)$/i.test(message.filePath);

  return (
    <div
      className={cn(
        'flex mb-4',
        message.isLocalSender ? 'justify-end' : 'justify-start',
        message.isNew ? 'animate-fadeIn' : ''
      )}
    >
      <Card
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg shadow-md',
          message.isLocalSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        <CardHeader className={cn("p-3 pb-1 flex flex-row items-center gap-2", message.isLocalSender ? "" : "")}>
          <UserCircle size={18} className={message.isLocalSender ? "text-primary-foreground/80" : "text-muted-foreground"} />
          <CardTitle className={cn("text-sm font-semibold", message.isLocalSender ? "text-primary-foreground" : "text-card-foreground")}>
            {message.sender}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {message.type === 'text' && <p className="text-sm break-words">{message.content}</p>}
          {message.type === 'file' && message.filePath && (
            isImageFile ? (
              <Image
                src={message.filePath}
                alt={message.content || 'Uploaded image'}
                width={200}
                height={200}
                className="rounded-md object-cover max-h-[200px] w-auto"
                data-ai-hint="chat image"
              />
            ) : (
              <Link
                href={message.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 text-sm hover:underline",
                  message.isLocalSender ? "text-primary-foreground hover:text-primary-foreground/80" : "text-accent-foreground hover:text-accent-foreground/80"
                )}
              >
                <FileText size={16} />
                <span>{message.content || 'Download file'}</span>
              </Link>
            )
          )}
          <CardDescription className={cn("text-xs mt-1", message.isLocalSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/90 text-left")}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
