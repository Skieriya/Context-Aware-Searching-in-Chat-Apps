'use client';

import ChatPage from "@/components/chat/ChatPage";
import {
  Sidebar,
  SidebarContent,
  // SidebarHeader as UISidebarHeader, // Using a custom div for header styling
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { MessagesSquare } from "lucide-react";

export default function Home() {
  return (
    <> {/* React Fragment as Sidebar and SidebarInset are siblings within SidebarProvider's context */}
      <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r bg-card">
        {/* Custom Header for the Sidebar */}
        <div className="flex h-14 items-center justify-between border-b px-3 sticky top-0 bg-card z-10">
          {/* Title appears when expanded */}
          <h2 className="text-lg font-semibold group-data-[state=collapsed]:hidden">
            Chats
          </h2>
          {/* SidebarTrigger is the hamburger icon to toggle sidebar */}
          <SidebarTrigger />
        </div>
        
        {/* Scrollable content area of the sidebar */}
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              {/* isActive could be dynamic if there were multiple chats */}
              <SidebarMenuButton 
                isActive={true} 
                tooltip={{ children: "Local Chat", side: "right" }}
              >
                <MessagesSquare size={18} />
                {/* Text label for the menu item, hidden when sidebar is collapsed to icon state */}
                <span className="group-data-[state=collapsed]:hidden">Local Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* Future chat items would go here */}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* Main content area, ChatPage will fill this */}
      <SidebarInset>
        <ChatPage />
      </SidebarInset>
    </>
  );
}
