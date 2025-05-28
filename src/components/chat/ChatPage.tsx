
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Message, LogEntry } from '@/types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { loadMessagesAction, sendMessageAction, SendMessageResult } from '@/app/actions/chatActions';
import { useToast } from '@/hooks/use-toast';
import { USER_YOU, USER_FRIEND, CHAT_ID } from '@/config/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedMessages = await loadMessagesAction(CHAT_ID);
      setMessages(loadedMessages.map(m => ({ ...m, isNew: false })));
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({ title: 'Error', description: 'Could not load chat history.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessageToState = (newMessageData: LogEntry, isOptimistic: boolean = false) => {
    const uiMessage: Message = {
      id: newMessageData.id,
      sender: newMessageData.sender,
      receiver: newMessageData.receiver,
      content: newMessageData.type === 'text' ? newMessageData.originalText! : newMessageData.fileName!,
      type: newMessageData.type,
      filePath: newMessageData.type === 'file' ? newMessageData.publicUrl : undefined,
      timestamp: new Date(newMessageData.timestamp),
      isLocalSender: newMessageData.sender === USER_YOU,
      isOptimistic,
      isNew: true, // Mark as new for animation
    };

    setMessages(prevMessages => {
      // If message already exists (e.g. optimistic update followed by server confirmation), replace it.
      const existingMsgIndex = prevMessages.findIndex(m => m.id === uiMessage.id);
      if (existingMsgIndex !== -1) {
        const updatedMessages = [...prevMessages];
        updatedMessages[existingMsgIndex] = { ...uiMessage, isOptimistic: false, isNew: prevMessages[existingMsgIndex].isNew }; // Preserve animation if it was already new
        return updatedMessages;
      }
      return [...prevMessages, uiMessage];
    });

    // Remove the 'isNew' flag after animation to prevent re-animating on re-renders
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === uiMessage.id ? { ...m, isNew: false } : m));
    }, 600); // Slightly longer than animation duration
  };
  
  const simulateFriendReply = useCallback(async (originalMessageId: string) => {
    const replyId = crypto.randomUUID();
    const replyText = "Thanks for your message! I'll get back to you soon.";
    
    const optimisticLogEntry: LogEntry = {
      id: replyId,
      sender: USER_FRIEND,
      receiver: USER_YOU,
      originalText: replyText,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    addMessageToState(optimisticLogEntry, true);

    const formData = new FormData();
    formData.append('chatId', CHAT_ID);
    formData.append('sender', USER_FRIEND);
    formData.append('receiver', USER_YOU);
    formData.append('messageId', replyId);
    formData.append('textMessage', replyText);

    const result: SendMessageResult = await sendMessageAction(formData);

    if (result.success && result.newMessage) {
      addMessageToState(result.newMessage); // Update with server-confirmed message
    } else {
      toast({
        title: 'Friend Reply Simulation Error',
        description: result.message || 'Could not log friend reply.',
        variant: 'destructive',
      });
      // Remove optimistic reply if server failed
      setMessages(prev => prev.filter(m => m.id !== replyId));
    }
  }, [toast, addMessageToState]);


  const handleSendMessage = async (content: string | File) => {
    setIsSending(true);
    const messageId = crypto.randomUUID();

    const formData = new FormData();
    formData.append('chatId', CHAT_ID);
    formData.append('sender', USER_YOU);
    formData.append('receiver', USER_FRIEND);
    formData.append('messageId', messageId);

    let optimisticContent: string;
    let optimisticType: 'text' | 'file' = 'text';
    let optimisticFilePath: string | undefined = undefined;
    
    const optimisticLogEntryBase = {
      id: messageId,
      sender: USER_YOU,
      receiver: USER_FRIEND,
      timestamp: new Date().toISOString(),
    };

    if (typeof content === 'string') {
      formData.append('textMessage', content);
      optimisticContent = content;
      addMessageToState({
        ...optimisticLogEntryBase,
        originalText: optimisticContent,
        type: 'text',
      }, true);
    } else {
      formData.append('file', content);
      optimisticContent = content.name;
      optimisticType = 'file';
      if (content.type.startsWith('image/')) {
        optimisticFilePath = URL.createObjectURL(content);
      }
      addMessageToState({
        ...optimisticLogEntryBase,
        fileName: optimisticContent,
        publicUrl: optimisticFilePath, // Use blob URL for optimistic image display
        type: 'file',
      }, true);
    }
    
    const result: SendMessageResult = await sendMessageAction(formData);
    setIsSending(false);

    if (result.success && result.newMessage) {
      toast({ title: 'Message Sent!', description: typeof content === 'string' ? 'Your message has been sent and logged.' : 'Your file has been uploaded and logged.' });
      addMessageToState(result.newMessage); // Update with server-confirmed message

      if (optimisticFilePath && optimisticType === 'file' && result.newMessage.publicUrl !== optimisticFilePath) {
         URL.revokeObjectURL(optimisticFilePath); // Revoke only if server returned a different URL (i.e., not the blob)
      }
      
      await simulateFriendReply(messageId);

    } else {
      toast({
        title: 'Error Sending Message',
        description: result.message || 'Could not send your message.',
        variant: 'destructive',
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (optimisticFilePath && optimisticType === 'file') {
         URL.revokeObjectURL(optimisticFilePath);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] flex flex-col shadow-2xl rounded-xl overflow-hidden">
      <CardHeader className="p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">LocalChat with {USER_FRIEND}</CardTitle>
            <p className="text-xs text-muted-foreground">Chat logs are saved locally. File uploads include AI summaries.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages...</div>
        ) : (
          <MessageList messages={messages} />
        )}
        <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
      </CardContent>
    </Card>
  );
}

