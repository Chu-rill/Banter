// components/chat/ChatSearch.tsx
"use client";

import { Input } from "@/components/ui/Input";

interface ChatSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ChatSearch({
  searchQuery,
  onSearchChange,
}: ChatSearchProps) {
  return (
    <div className="px-4 py-2 border-b border-border bg-card/50">
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search messages in this room..."
        aria-label="Search messages"
      />
    </div>
  );
}
