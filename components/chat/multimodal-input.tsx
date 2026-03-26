"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { ImageIcon, SparklesIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { StopIcon } from "./icons";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tattooInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const [tattooDesign, setTattooDesign] = useState<Attachment | null>(null);
  const [bodyPart, setBodyPart] = useState<Attachment | null>(null);
  const [uploadingTattoo, setUploadingTattoo] = useState(false);
  const [uploadingBody, setUploadingBody] = useState(false);
  const [dragOverZone, setDragOverZone] = useState<
    "tattoo" | "body" | null
  >(null);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          name: data.pathname,
          contentType: data.contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch {
      toast.error("Error al subir el archivo");
    }
    return null;
  }, []);

  const handleUpload = useCallback(
    async (file: File, zone: "tattoo" | "body") => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes (JPEG, PNG)");
        return;
      }

      if (zone === "tattoo") {
        setUploadingTattoo(true);
        const result = await uploadFile(file);
        if (result) setTattooDesign(result);
        setUploadingTattoo(false);
      } else {
        setUploadingBody(true);
        const result = await uploadFile(file);
        if (result) setBodyPart(result);
        setUploadingBody(false);
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, zone: "tattoo" | "body") => {
      e.preventDefault();
      setDragOverZone(null);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file, zone);
    },
    [handleUpload]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, zone: "tattoo" | "body") => {
      e.preventDefault();
      setDragOverZone(zone);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, zone: "tattoo" | "body") => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file, zone);
      e.target.value = "";
    },
    [handleUpload]
  );

  const canSubmitImages = tattooDesign && bodyPart;
  const canSubmitText = input.trim().length > 0;
  const canSubmit = canSubmitImages || canSubmitText;
  const isGenerating = status === "submitted" || status === "streaming";

  const submitForm = useCallback(() => {
    if (!canSubmitImages && !canSubmitText) return;

    const parts: Array<
      | { type: "file"; url: string; filename: string; mediaType: string }
      | { type: "text"; text: string }
    > = [];

    if (tattooDesign) {
      parts.push({
        type: "file" as const,
        url: tattooDesign.url,
        filename: "tattoo-design",
        mediaType: tattooDesign.contentType,
      });
    }
    if (bodyPart) {
      parts.push({
        type: "file" as const,
        url: bodyPart.url,
        filename: "body-part",
        mediaType: bodyPart.contentType,
      });
    }

    parts.push({
      type: "text",
      text:
        input.trim() ||
        "Genera una preview realista colocando el diseño del tatuaje sobre la parte del cuerpo mostrada. El tatuaje debe seguir los contornos naturales de la piel.",
    });

    sendMessage({ role: "user", parts });

    setTattooDesign(null);
    setBodyPart(null);
    setInput("");
  }, [input, setInput, tattooDesign, bodyPart, sendMessage, canSubmitImages, canSubmitText]);

  const sendQuickMessage = useCallback(
    (text: string) => {
      sendMessage({
        role: "user",
        parts: [{ type: "text", text }],
      });
    },
    [sendMessage]
  );

  // Paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) =>
        item.type.startsWith("image/")
      );
      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      // Auto-assign to first empty slot
      if (!tattooDesign) {
        handleUpload(file, "tattoo");
      } else if (!bodyPart) {
        handleUpload(file, "body");
      } else {
        toast.info("Ambas imágenes ya están cargadas. Elimina una primero.");
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [tattooDesign, bodyPart, handleUpload]);

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {/* Dual Image Upload Zones */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tattoo Design Zone */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer min-h-[140px]",
            dragOverZone === "tattoo"
              ? "border-primary bg-primary/5 scale-[1.02]"
              : tattooDesign
                ? "border-border/40 bg-card/50"
                : "border-border/30 bg-muted/30 hover:border-border/60 hover:bg-muted/50"
          )}
          onDrop={(e) => handleDrop(e, "tattoo")}
          onDragOver={(e) => handleDragOver(e, "tattoo")}
          onDragLeave={handleDragLeave}
          onClick={() => !tattooDesign && tattooInputRef.current?.click()}
        >
          <input
            ref={tattooInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFileChange(e, "tattoo")}
          />

          {uploadingTattoo ? (
            <Spinner className="size-8" />
          ) : tattooDesign ? (
            <div className="relative w-full">
              <Image
                src={tattooDesign.url}
                alt="Diseño del tatuaje"
                width={200}
                height={200}
                className="mx-auto max-h-[120px] w-auto rounded-lg object-contain"
              />
              <button
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                onClick={(e) => {
                  e.stopPropagation();
                  setTattooDesign(null);
                }}
                type="button"
              >
                <XIcon className="size-3.5" />
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Diseño del tatuaje
              </p>
            </div>
          ) : (
            <>
              <ImageIcon className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                Diseño del tatuaje
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Arrastra o haz click
              </p>
            </>
          )}
        </div>

        {/* Body Part Zone */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all duration-200 cursor-pointer min-h-[140px]",
            dragOverZone === "body"
              ? "border-primary bg-primary/5 scale-[1.02]"
              : bodyPart
                ? "border-border/40 bg-card/50"
                : "border-border/30 bg-muted/30 hover:border-border/60 hover:bg-muted/50"
          )}
          onDrop={(e) => handleDrop(e, "body")}
          onDragOver={(e) => handleDragOver(e, "body")}
          onDragLeave={handleDragLeave}
          onClick={() => !bodyPart && bodyInputRef.current?.click()}
        >
          <input
            ref={bodyInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFileChange(e, "body")}
          />

          {uploadingBody ? (
            <Spinner className="size-8" />
          ) : bodyPart ? (
            <div className="relative w-full">
              <Image
                src={bodyPart.url}
                alt="Parte del cuerpo"
                width={200}
                height={200}
                className="mx-auto max-h-[120px] w-auto rounded-lg object-contain"
              />
              <button
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                onClick={(e) => {
                  e.stopPropagation();
                  setBodyPart(null);
                }}
                type="button"
              >
                <XIcon className="size-3.5" />
              </button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Parte del cuerpo
              </p>
            </div>
          ) : (
            <>
              <UploadIcon className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                Parte del cuerpo
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Arrastra o haz click
              </p>
            </>
          )}
        </div>
      </div>

      {/* Quick action buttons - predefined responses */}
      {messages.length === 0 && !isGenerating && (
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Tatuaje realista", text: "Quiero un tatuaje estilo realista, ¿qué me recomiendas?" },
            { label: "Estilo geométrico", text: "Me interesa un tatuaje geométrico, ¿cómo sería?" },
            { label: "Lettering", text: "Quiero un tatuaje con texto/lettering, ¿qué tipografías me recomiendas?" },
            { label: "¿Duele mucho?", text: "¿Duele mucho hacerse un tatuaje?" },
            { label: "Cuidados", text: "¿Qué cuidados necesito después de hacerme un tatuaje?" },
            { label: "Minimalista", text: "Quiero un tatuaje minimalista pequeño, ¿qué ideas tienes?" },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-full border border-border/40 bg-card/70 px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => sendQuickMessage(action.text)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Optional text input + Submit */}
      <div className="flex items-end gap-2">
        <div className="flex-1 rounded-xl border border-border/30 bg-card/70 shadow-[var(--shadow-composer)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-composer-focus)]">
          <textarea
            ref={textareaRef}
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed placeholder:text-muted-foreground/35 focus:outline-none min-h-[44px] max-h-[120px]"
            placeholder="Describe tu tatuaje o pregunta sobre estilos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit && !isGenerating) submitForm();
              }
            }}
            rows={1}
          />
        </div>

        {isGenerating ? (
          <Button
            className="h-10 w-10 shrink-0 rounded-xl bg-foreground text-background hover:opacity-85"
            onClick={(e) => {
              e.preventDefault();
              stop();
              setMessages((messages) => messages);
            }}
          >
            <StopIcon size={16} />
          </Button>
        ) : (
          <Button
            className={cn(
              "h-10 shrink-0 rounded-xl px-4 transition-all duration-200",
              canSubmit
                ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            )}
            disabled={!canSubmit}
            onClick={submitForm}
          >
            <SparklesIcon className="size-4 mr-1.5" />
            Generar
          </Button>
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    return true;
  }
);
