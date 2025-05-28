'use client';

import React, { useState, useEffect } from 'react';
import ChatPage from "@/components/chat/ChatPage";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessagesSquare, PlusCircle } from "lucide-react";
import { CHAT_ID, USER_FRIEND } from '@/config/constants'; // Import constants

interface ChatSession {
  id: string;
  name: string;
  isDefault?: boolean;
}

export default function Home() {
  const [chats, setChats] = useState<ChatSession[]>([
    { id: CHAT_ID, name: USER_FRIEND, isDefault: true },
  ]);
  const [activeChatId, setActiveChatId] = useState<string>(CHAT_ID);
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');

  // Effect to load chats from localStorage on mount (optional persistence)
  useEffect(() => {
    const storedChats = localStorage.getItem('chatSessions');
    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats);
        if (Array.isArray(parsedChats) && parsedChats.length > 0) {
          setChats(parsedChats);
          // Ensure activeChatId is valid, default to first chat if not
          const currentActive = parsedChats.find(c => c.id === activeChatId);
          if (!currentActive && parsedChats.length > 0) {
            setActiveChatId(parsedChats[0].id);
          } else if (!currentActive && parsedChats.length === 0) {
             // This case should ideally not happen if initialized with a default
            setActiveChatId(CHAT_ID); // Fallback to default if list becomes empty
            setChats([{ id: CHAT_ID, name: USER_FRIEND, isDefault: true }]);
          }
        }
      } catch (e) {
        console.error("Failed to parse chats from localStorage", e);
        // Initialize with default if localStorage is corrupt
        setChats([{ id: CHAT_ID, name: USER_FRIEND, isDefault: true }]);
        setActiveChatId(CHAT_ID);
      }
    }
  }, []); // Empty dependency array: runs only on mount

  // Effect to save chats to localStorage when they change
  useEffect(() => {
    if (chats.length > 0 || localStorage.getItem('chatSessions')) { // Only save if chats exist or previously existed
        localStorage.setItem('chatSessions', JSON.stringify(chats));
    }
  }, [chats]);


  const handleAddNewChat = () => {
    if (newChatName.trim() === '') return;
    const newChatId = crypto.randomUUID();
    const newChat: ChatSession = { id: newChatId, name: newChatName.trim() };
    setChats(prevChats => [...prevChats, newChat]);
    setActiveChatId(newChatId);
    setNewChatName('');
    setIsAddChatDialogOpen(false);
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <>
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r bg-card">
        <div className="flex h-14 items-center justify-between border-b px-3 sticky top-0 bg-card z-10 group">
          <h2 className="text-lg font-semibold group-data-[state=collapsed]:hidden">
            Chats
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddChatDialogOpen(true)}
              className="h-7 w-7 group-data-[state=collapsed]:hidden"
              aria-label="Add new chat"
            >
              <PlusCircle size={18} />
            </Button>
            <SidebarTrigger />
          </div>
        </div>
        
        <SidebarContent className="p-2">
          <SidebarMenu>
            {chats.map(chat => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton 
                  isActive={chat.id === activeChatId}
                  onClick={() => setActiveChatId(chat.id)}
                  tooltip={{ children: chat.name, side: "right" }}
                >
                  <MessagesSquare size={18} />
                  <span className="group-data-[state=collapsed]:hidden truncate">{chat.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* Collapsed "Add Chat" button */}
            <SidebarMenuItem className="hidden group-data-[state=collapsed]:block mt-auto">
                 <SidebarMenuButton
                    onClick={() => setIsAddChatDialogOpen(true)}
                    tooltip={{ children: "New Chat", side: "right" }}
                >
                    <PlusCircle size={18} />
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {activeChat ? (
          <ChatPage
            key={activeChat.id} // Important for re-rendering ChatPage on chat switch
            chatId={activeChat.id}
            recipientName={activeChat.name}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a chat or create a new one to start messaging.</p>
          </div>
        )}
      </SidebarInset>

      <Dialog open={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Chat</DialogTitle>
            <DialogDescription>
              Enter the name of the person you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="col-span-3"
                placeholder="Person's Name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewChat()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddNewChat} disabled={newChatName.trim() === ''}>
              Add Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
