import { Suspense } from "react";
import { Toaster } from "sonner";
import { ChatShell } from "@/components/chat/shell";
import { ActiveChatProvider } from "@/hooks/use-active-chat";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        theme="system"
        toastOptions={{
          className:
            "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
        }}
      />
      <Suspense fallback={<div className="flex h-dvh" />}>
        <ActiveChatProvider>
          <ChatShell />
        </ActiveChatProvider>
      </Suspense>
      {children}
    </>
  );
}
