'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry } from '@/types/chat';

const LOGS_DIR = path.join(process.cwd(), 'chat_logs');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function getChatLogDirPath(chatId: string): string {
  return path.join(LOGS_DIR, chatId);
}

function getChatLogFilePath(chatId: string): string {
  return path.join(getChatLogDirPath(chatId), 'log.json');
}

function getUploadsDirPath(chatId: string): string {
  return path.join(UPLOADS_DIR, chatId);
}

export async function ensureChatDirectoriesExist(chatId: string): Promise<void> {
  try {
    await fs.mkdir(getChatLogDirPath(chatId), { recursive: true });
    await fs.mkdir(getUploadsDirPath(chatId), { recursive: true });
  } catch (error) {
    console.error('Failed to create chat directories:', error);
    // Depending on desired error handling, you might want to throw this
  }
}

export async function readChatLog(chatId: string): Promise<LogEntry[]> {
  await ensureChatDirectoriesExist(chatId);
  const logFilePath = getChatLogFilePath(chatId);
  try {
    const data = await fs.readFile(logFilePath, 'utf-8');
    return JSON.parse(data) as LogEntry[];
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading chat log for ${chatId}:`, error);
    return [];
  }
}

export async function appendMessageToLog(chatId: string, logEntry: LogEntry): Promise<void> {
  await ensureChatDirectoriesExist(chatId);
  const logFilePath = getChatLogFilePath(chatId);
  try {
    const logs = await readChatLog(chatId);
    logs.push(logEntry);
    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error appending to chat log for ${chatId}:`, error);
    throw new Error('Failed to save message to log.');
  }
}

export async function saveUploadedFile(chatId: string, file: File): Promise<{ fileName: string, publicUrl: string, serverFilePath: string }> {
  await ensureChatDirectoriesExist(chatId);
  
  const uploadsDir = getUploadsDirPath(chatId);
  // Sanitize filename (basic example, might need more robust sanitization)
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const serverFilePath = path.join(uploadsDir, safeFileName);
  const publicUrl = `/uploads/${chatId}/${safeFileName}`;

  try {
    const bytes = await file.arrayBuffer();
    await fs.writeFile(serverFilePath, Buffer.from(bytes));
    return { fileName: safeFileName, publicUrl, serverFilePath };
  } catch (error) {
    console.error(`Error saving file ${safeFileName} for chat ${chatId}:`, error);
    throw new Error('Failed to save uploaded file.');
  }
}
