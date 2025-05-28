'use server';

import { USER_YOU } from '@/config/constants';
import { appendMessageToLog, readChatLog, saveUploadedFile } from '@/lib/chat-storage';
import type { LogEntry, Message } from '@/types/chat';
import { redactSensitiveInformation } from '@/ai/flows/redact-sensitive-information';
import { revalidatePath } from 'next/cache';

export interface SendMessageResult {
  success: boolean;
  message?: string; // Error message or success message
  newMessage?: LogEntry; // The message that was processed and logged
}

export async function sendMessageAction(formData: FormData): Promise<SendMessageResult> {
  const chatId = formData.get('chatId') as string;
  const sender = formData.get('sender') as string;
  const receiver = formData.get('receiver') as string;
  const messageId = formData.get('messageId') as string; // Passed from client for consistency
  
  const textMessage = formData.get('textMessage') as string | null;
  const file = formData.get('file') as File | null;

  if (!chatId || !sender || !receiver || !messageId) {
    return { success: false, message: 'Missing required fields.' };
  }

  if (!textMessage && !file) {
    return { success: false, message: 'Message content or file is required.' };
  }

  const timestamp = new Date().toISOString();
  let logEntry: LogEntry;

  try {
    if (textMessage) {
      const { redactedMessage } = await redactSensitiveInformation({ message: textMessage });
      logEntry = {
        id: messageId,
        sender,
        receiver,
        timestamp,
        type: 'text',
        originalText: textMessage,
        redactedText: redactedMessage,
      };
    } else if (file) {
      const { fileName, publicUrl, serverFilePath } = await saveUploadedFile(chatId, file);
      logEntry = {
        id: messageId,
        sender,
        receiver,
        timestamp,
        type: 'file',
        fileName,
        publicUrl,
        serverFilePath,
      };
    } else {
      // Should not happen based on earlier check, but as a safeguard
      return { success: false, message: 'Invalid message type.' };
    }

    await appendMessageToLog(chatId, logEntry);
    revalidatePath('/'); // Revalidate the page to reflect new messages when loading
    return { success: true, newMessage: logEntry };

  } catch (error) {
    console.error('Error in sendMessageAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send message: ${errorMessage}` };
  }
}

export async function loadMessagesAction(chatId: string): Promise<Message[]> {
  try {
    const logEntries = await readChatLog(chatId);
    return logEntries.map(entry => ({
      id: entry.id,
      sender: entry.sender,
      receiver: entry.receiver,
      content: entry.type === 'text' ? entry.redactedText! : entry.fileName!,
      type: entry.type,
      filePath: entry.type === 'file' ? entry.publicUrl : undefined,
      timestamp: new Date(entry.timestamp),
      isLocalSender: entry.sender === USER_YOU, // Assuming USER_YOU is the constant for the local user
      isNew: false, // By default, loaded messages are not "new" for animation
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort by timestamp
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}
