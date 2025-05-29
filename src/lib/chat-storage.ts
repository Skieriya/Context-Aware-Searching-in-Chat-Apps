
'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import type { LogEntry } from '@/types/chat';

// Determine base directory based on Vercel environment
const IS_VERCEL = !!process.env.VERCEL || !!process.env.NOW_REGION; // NOW_REGION is another Vercel env var

const TEMP_DIR = '/tmp';

// Define directory names
const LOGS_DIR_NAME = 'chat_logs';
const UPLOADS_DIR_NAME = 'uploads';

// Determine paths based on environment
const LOGS_DIR = IS_VERCEL
  ? path.join(TEMP_DIR, LOGS_DIR_NAME)
  : path.join(process.cwd(), LOGS_DIR_NAME);

const UPLOADS_DIR_BASE = IS_VERCEL // Base for where uploads are stored
  ? path.join(TEMP_DIR, UPLOADS_DIR_NAME)
  : path.join(process.cwd(), 'public', UPLOADS_DIR_NAME);

function getChatLogDirPath(chatId: string): string {
  return path.join(LOGS_DIR, chatId);
}

function getChatLogFilePath(chatId: string): string {
  return path.join(getChatLogDirPath(chatId), 'log.json');
}

function getUploadsDirPath(chatId: string): string {
  // This path is where files are written to.
  return path.join(UPLOADS_DIR_BASE, chatId);
}

export async function ensureChatDirectoriesExist(chatId: string): Promise<void> {
  try {
    // Ensure the base directories exist if they are in /tmp
    if (IS_VERCEL) {
        await fs.mkdir(LOGS_DIR, { recursive: true });
        await fs.mkdir(UPLOADS_DIR_BASE, { recursive: true });
    }
    // Ensure chat-specific subdirectories exist
    await fs.mkdir(getChatLogDirPath(chatId), { recursive: true });
    await fs.mkdir(getUploadsDirPath(chatId), { recursive: true });
  } catch (error) {
    console.error('Failed to create chat directories:', error);
    // Depending on desired error handling, you might want to throw this
    // or handle it gracefully if the directory already exists (though recursive:true should handle that)
  }
}

export async function readChatLog(chatId: string): Promise<LogEntry[]> {
  await ensureChatDirectoriesExist(chatId); // Ensures path exists before read attempt
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
  await ensureChatDirectoriesExist(chatId); // Ensures path exists before write attempt
  const logFilePath = getChatLogFilePath(chatId);
  try {
    const logs = await readChatLog(chatId); // Read existing logs
    logs.push(logEntry);
    await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error appending to chat log for ${chatId}:`, error);
    throw new Error('Failed to save message to log.');
  }
}

export async function saveUploadedFile(chatId: string, file: File): Promise<{ fileName: string, publicUrl: string, serverFilePath: string }> {
  await ensureChatDirectoriesExist(chatId); // Ensures path exists before write attempt
  
  const uploadsDirForChat = getUploadsDirPath(chatId); // This is /tmp/uploads/<chatId> on Vercel
  
  // Sanitize filename (basic example, might need more robust sanitization)
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const serverFilePath = path.join(uploadsDirForChat, safeFileName);
  
  // IMPORTANT: The publicUrl below will NOT work on Vercel if files are in /tmp.
  // Serving files from /tmp requires a different mechanism (e.g., a separate serverless function to stream the file).
  // For local development, it assumes files are in `public/uploads/...`.
  // This fix primarily addresses the WRITE error. Serving is a separate challenge for /tmp.
  const publicUrl = `/uploads/${chatId}/${safeFileName}`; 

  try {
    const bytes = await file.arrayBuffer();
    await fs.writeFile(serverFilePath, Buffer.from(bytes));
    console.log(`File ${safeFileName} saved to ${serverFilePath} on ${IS_VERCEL ? 'Vercel (/tmp)' : 'local'}`);
    return { fileName: safeFileName, publicUrl, serverFilePath };
  } catch (error) {
    console.error(`Error saving file ${safeFileName} for chat ${chatId} to ${serverFilePath}:`, error);
    throw new Error('Failed to save uploaded file.');
  }
}

