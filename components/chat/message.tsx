"use client";

import { CheckIcon, DownloadIcon, MailIcon, SendIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";
import { Shimmer } from "../ai-elements/shimmer";
import { Button } from "../ui/button";
import { SparklesIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";

function ShareWithArtistButton({ imageUrl }: { imageUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const handleShare = async () => {
    setIsSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            customerName: name || undefined,
            customerEmail: email || undefined,
            notes: notes || undefined,
          }),
        }
      );

      if (response.ok) {
        setIsSent(true);
        toast.success("Diseño enviado al tatuador correctamente");
        setTimeout(() => {
          setIsOpen(false);
          setIsSent(false);
        }, 2000);
      } else {
        toast.error("Error al enviar el email. Inténtalo de nuevo.");
      }
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setIsOpen(true)}
      >
        <SendIcon className="size-3.5" />
        Compartir con tatuador
      </Button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-border/40 bg-card p-4 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 mb-3">
        <MailIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Enviar diseño al tatuador</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="email"
          placeholder="Tu email de contacto (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <textarea
          placeholder="Notas para el tatuador (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-border/40 bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="flex gap-2 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setIsOpen(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs gap-1.5"
            onClick={handleShare}
            disabled={isSending || isSent}
          >
            {isSent ? (
              <>
                <CheckIcon className="size-3.5" />
                Enviado
              </>
            ) : isSending ? (
              "Enviando..."
            ) : (
              <>
                <SendIcon className="size-3.5" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const PurePreviewMessage = ({
  message,
  isLoading,
}: {
  message: ChatMessage;
  isLoading: boolean;
}) => {
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts?.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      part.type === "file"
  );
  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const attachments = attachmentsFromMessage.length > 0 && isUser && (
    <div className="flex flex-row justify-end gap-2">
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            name: attachment.filename ?? "file",
            contentType: attachment.mediaType,
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  // Collect assistant image URLs for sharing
  const assistantImageUrls: string[] = [];

  const parts = message.parts?.map((part, index) => {
    const key = `message-${message.id}-part-${index}`;

    if (part.type === "text") {
      return (
        <MessageContent
          className={cn("text-[13px] leading-[1.65]", {
            "w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]":
              message.role === "user",
          })}
          key={key}
        >
          <MessageResponse>{sanitizeText(part.text)}</MessageResponse>
        </MessageContent>
      );
    }

    // Render inline images from assistant (generated tattoo previews)
    if (part.type === "file" && isAssistant) {
      assistantImageUrls.push(part.url);
      return (
        <div key={key} className="relative group">
          <Image
            src={part.url}
            alt="Tattoo preview"
            width={512}
            height={512}
            className="rounded-xl border border-border/40 shadow-md max-w-full h-auto"
            unoptimized
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              const link = document.createElement("a");
              link.href = part.url;
              link.download = "tattoo-preview.png";
              link.click();
            }}
          >
            <DownloadIcon className="size-4 mr-1" />
            Descargar
          </Button>
        </div>
      );
    }

    return null;
  });

  const content = isThinking ? (
    <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
      <Shimmer className="font-medium" duration={1}>
        Generando preview...
      </Shimmer>
    </div>
  ) : (
    <>
      {attachments}
      {parts}
      {/* Share button after assistant generates images */}
      {isAssistant && assistantImageUrls.length > 0 && !isLoading && (
        <div className="mt-3">
          <ShareWithArtistButton imageUrl={assistantImageUrls[0]} />
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={13} />
            </div>
          </div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div className="group/message w-full" data-role="assistant">
      <div className="flex items-start gap-3">
        <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            <SparklesIcon size={13} />
          </div>
        </div>
        <div className="flex h-[calc(13px*1.65)] items-center text-[13px] leading-[1.65]">
          <Shimmer className="font-medium" duration={1}>
            Generando preview...
          </Shimmer>
        </div>
      </div>
    </div>
  );
};
