'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, FileImage, Film, FileArchive } from 'lucide-react'; // Added more icons
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface MessageInputProps {
  onSendMessage: (content: string | File) => void;
  isSending: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function MessageInput({ onSendMessage, isSending }: MessageInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSend = () => {
    if (file) {
      onSendMessage(file);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    } else if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: 'File too large',
          description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
        return;
      }
      setFile(selectedFile);
      setText(''); // Clear text input when a file is selected
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <Paperclip size={20} className="text-muted-foreground" />;
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return <FileImage size={20} className="text-blue-500" />;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) return <Film size={20} className="text-purple-500" />;
    if (['zip', 'rar', 'tar', 'gz'].includes(extension || '')) return <FileArchive size={20} className="text-orange-500" />;
    return <Paperclip size={20} className="text-gray-500" />;
  };

  return (
    <div className="p-4 border-t bg-card shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder={file ? "File selected. Press send." : "Type a message..."}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (file) { // If user starts typing, deselect file
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
          onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
          className="flex-grow text-sm rounded-lg focus-visible:ring-primary focus-visible:ring-opacity-50"
          disabled={isSending || !!file} // Disable text input if file is selected or sending
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Attach file"
          className="hover:bg-accent/50 rounded-full"
        >
          <Paperclip size={20} className="text-muted-foreground hover:text-accent-foreground" />
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" 
        />
        <Button 
          onClick={handleSend} 
          disabled={isSending || (!text.trim() && !file)}
          className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Send message"
        >
          <Send size={20} />
          <span className="ml-2 hidden sm:inline">Send</span>
        </Button>
      </div>
      {file && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md text-sm text-muted-foreground">
          {getFileIcon(file.name)}
          <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            &times;
          </Button>
        </div>
      )}
    </div>
  );
}
