'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Message, LogEntry } from '@/types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { loadMessagesAction, sendMessageAction, SendMessageResult } from '@/app/actions/chatActions';
import { useToast } from '@/hooks/use-toast';
import { USER_YOU } from '@/config/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, User, Search } from 'lucide-react';

interface ChatPageProps {
  chatId: string;
  recipientName: string;
}

export default function ChatPage({ chatId, recipientName }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setMessages([]); // Clear previous chat messages
    try {
      const loadedMessages = await loadMessagesAction(chatId);
      setMessages(loadedMessages.map(m => ({ ...m, isNew: false })));
    } catch (error) {
      console.error(`Failed to load messages for chat ${chatId}:`, error);
      toast({ title: 'Error', description: 'Could not load chat history.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [chatId, toast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]); // Reload messages when chatId changes (via key prop on ChatPage)

  const addMessageToState = (newMessageData: LogEntry, isOptimistic: boolean = false) => {
    const uiMessage: Message = {
      id: newMessageData.id,
      sender: newMessageData.sender,
      receiver: newMessageData.receiver,
      content: newMessageData.type === 'text' ? newMessageData.originalText! : newMessageData.fileName!,
      type: newMessageData.type,
      filePath: newMessageData.type === 'file' ? newMessageData.publicUrl : undefined,
      fileContext: newMessageData.type === 'file' ? newMessageData.fileContext : undefined,
      timestamp: new Date(newMessageData.timestamp),
      isLocalSender: newMessageData.sender === USER_YOU,
      isOptimistic,
      isNew: true, 
    };

    setMessages(prevMessages => {
      const existingMsgIndex = prevMessages.findIndex(m => m.id === uiMessage.id);
      if (existingMsgIndex !== -1) {
        const updatedMessages = [...prevMessages];
        updatedMessages[existingMsgIndex] = { ...uiMessage, isOptimistic: false, isNew: prevMessages[existingMsgIndex].isNew }; // Preserve isNew if it was already true
        return updatedMessages;
      }
      return [...prevMessages, uiMessage];
    });

    // Reset isNew after animation
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === uiMessage.id ? { ...m, isNew: false } : m));
    }, 600); // Duration of fadeIn animation
  };
  
  const simulateFriendReply = useCallback(async (originalMessageId: string) => {
    const replyId = crypto.randomUUID();
    const replyText = `Thanks for your message! I'll get back to you soon. (Reply from ${recipientName})`;
    
    const optimisticLogEntry: LogEntry = {
      id: replyId,
      sender: recipientName, // Reply comes from the current recipient
      receiver: USER_YOU,
      originalText: replyText,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    addMessageToState(optimisticLogEntry, true);

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('sender', recipientName); // Sender is the current recipient
    formData.append('receiver', USER_YOU);
    formData.append('messageId', replyId);
    formData.append('textMessage', replyText);

    const result: SendMessageResult = await sendMessageAction(formData);

    if (result.success && result.newMessage) {
      addMessageToState(result.newMessage);
    } else {
      toast({
        title: 'Friend Reply Simulation Error',
        description: result.message || 'Could not log friend reply.',
        variant: 'destructive',
      });
      // Remove optimistic message if server failed
      setMessages(prev => prev.filter(m => m.id !== replyId));
    }
  }, [chatId, recipientName, toast, addMessageToState]);


  const handleSendMessage = async (content: string | File) => {
    setIsSending(true);
    const messageId = crypto.randomUUID();

    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('sender', USER_YOU);
    formData.append('receiver', recipientName); // Send to the current recipient
    formData.append('messageId', messageId);
    
    const optimisticLogEntryBase = {
      id: messageId,
      sender: USER_YOU,
      receiver: recipientName,
      timestamp: new Date().toISOString(),
    };

    let optimisticFilePath: string | undefined = undefined;

    if (typeof content === 'string') {
      formData.append('textMessage', content);
      addMessageToState({
        ...optimisticLogEntryBase,
        originalText: content,
        type: 'text',
      }, true);
    } else { // File
      formData.append('file', content);
      // Create a blob URL for optimistic image preview
      if (content.type.startsWith('image/')) {
        optimisticFilePath = URL.createObjectURL(content);
      }
      addMessageToState({
        ...optimisticLogEntryBase,
        fileName: content.name,
        publicUrl: optimisticFilePath, // Use blob URL for optimistic display
        type: 'file',
        fileContext: "Processing file...", // Optimistic context
      }, true);
    }
    
    const result: SendMessageResult = await sendMessageAction(formData);
    setIsSending(false);

    if (result.success && result.newMessage) {
      toast({ title: 'Message Sent!', description: typeof content === 'string' ? 'Your message has been sent and logged.' : 'Your file has been uploaded and logged.' });
      // Update or confirm the optimistic message with server data
      addMessageToState(result.newMessage); 

      // Clean up blob URL if it was created and is different from server URL
      if (optimisticFilePath && result.newMessage.type === 'file' && result.newMessage.publicUrl !== optimisticFilePath) {
         URL.revokeObjectURL(optimisticFilePath); 
      }
      
      // Simulate a reply from the recipient
      await simulateFriendReply(messageId);

    } else {
      toast({
        title: 'Error Sending Message',
        description: result.message || 'Could not send your message.',
        variant: 'destructive',
      });
      // Remove optimistic message if server failed
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (optimisticFilePath) {
         URL.revokeObjectURL(optimisticFilePath);
      }
    }
  };

  const displayedMessages = useMemo(() => {
    if (!searchTerm.trim()) {
      return messages;
    }
    return messages.filter(msg => {
      const term = searchTerm.toLowerCase();
      if (msg.type === 'text') {
        return msg.content.toLowerCase().includes(term);
      } else if (msg.type === 'file') {
        const fileNameMatch = msg.content.toLowerCase().includes(term);
        const contextMatch = msg.fileContext?.toLowerCase().includes(term) || false;
        return fileNameMatch || contextMatch;
      }
      return false;
    });
  }, [messages, searchTerm]);

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border-0 md:border-l">
      <CardHeader className="p-4 border-b bg-card space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-full">
            {/* Could use a dynamic icon based on recipient type if available */}
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">Chat with {recipientName}</CardTitle>
            <p className="text-xs text-muted-foreground">Chat logs are saved locally. Chat ID: {chatId}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search messages and file context..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full text-sm rounded-lg focus-visible:ring-primary focus-visible:ring-opacity-50"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages for {recipientName}...</div>
        ) : (
          <MessageList messages={displayedMessages} searchTerm={searchTerm} />
        )}
        <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
      </CardContent>
    </Card>
  );
}
