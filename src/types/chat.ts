
// For UI state
export interface Message {
  id: string;
  sender: string; // e.g., USER_YOU, USER_FRIEND
  receiver: string;
  content: string; // Original text or file name
  type: 'text' | 'file';
  filePath?: string; // public URL for file type, e.g., /uploads/chat_id/filename.txt
  fileContext?: string; // AI-generated summary for files, used for search
  timestamp: Date;
  isLocalSender: boolean; // True if sender is USER_YOU
  isOptimistic?: boolean; // True if message is not yet confirmed by server
  isNew?: boolean; // Flag for animation
}

// For JSON log file
export interface LogEntry {
  id: string;
  sender: string;
  receiver: string;
  timestamp: string; // ISO string
  type: 'text' | 'file';
  // For text messages
  originalText?: string; 
  // For file messages
  fileName?: string; 
  publicUrl?: string; // Publicly accessible URL, e.g., /uploads/chat_id/filename.txt
  serverFilePath?: string; // Path on server fs, e.g., public/uploads/...
  fileContext?: string; // AI-generated summary for files
}

