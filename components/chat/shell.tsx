"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveChat } from "@/hooks/use-active-chat";
import type { Attachment } from "@/lib/types";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function ChatShell() {
  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    input,
    setInput,
    showCreditCardAlert,
    setShowCreditCardAlert,
  } = useActiveChat();

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  return (
    <>
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-center border-b border-border/40 bg-background px-4">
          <h1 className="font-[family-name:var(--font-ornamental)] text-xl tracking-wide">
            TatooIA
          </h1>
          <span className="ml-2 text-xs text-muted-foreground font-[family-name:var(--font-script)]">
            Preview de Tatuajes
          </span>
        </header>

        {/* Messages area */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <Messages
            chatId={chatId}
            messages={messages}
            status={status}
            isLoading={false}
          />

          {/* Input area */}
          <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
            <MultimodalInput
              chatId={chatId}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
            />
          </div>
        </div>
      </div>

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              Esta aplicación requiere activar Vercel AI Gateway para funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`;
              }}
            >
              Activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
