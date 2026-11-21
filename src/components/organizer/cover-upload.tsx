"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { COVER_MAX_BYTES, COVER_MIME_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Client-side pre-check. The server re-validates size and sniffs the real type from bytes. */
export function validateCoverFile(file: { type: string; size: number }): string | null {
  if (!(COVER_MIME_TYPES as readonly string[]).includes(file.type))
    return "Use a JPEG, PNG or WebP image.";
  if (file.size > COVER_MAX_BYTES)
    return `The image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is ${COVER_MAX_BYTES / 1024 / 1024} MB.`;
  if (file.size === 0) return "The file is empty.";
  return null;
}

type Props = { value: string | null; onChange: (url: string | null) => void; error?: string };

export function CoverUpload({ value, onChange, error }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    const problem = validateCoverFile(file);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api<{ url: string }>("/api/uploads", { method: "POST", body });
      onChange(res.url);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <div
        className={cn(
          "relative grid aspect-[16/9] max-w-2xl place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-card transition",
          shownError && "border-destructive",
          !value && "hover:border-foreground/40",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Event cover preview"
              fill
              sizes="(min-width: 768px) 640px, 100vw"
              className="object-cover"
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <ImageUp /> Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onChange(null)}
                disabled={uploading}
              >
                <Trash2 /> Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="grid justify-items-center gap-3 p-6 text-center">
            <ImageUp className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-semibold">Drop an image here or</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Choose file
            </Button>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-background/70" role="status">
            <span className="flex items-center gap-2 font-semibold">
              <Loader2 className="size-5 animate-spin" aria-hidden /> Uploading…
            </span>
          </div>
        )}
      </div>
      <label htmlFor={inputId} className="sr-only">
        Cover image file
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={COVER_MIME_TYPES.join(",")}
        className="sr-only"
        aria-describedby={`${inputId}-hint`}
        onChange={(e) => handleFile(e.target.files?.[0])}
        data-testid="cover-input"
      />
      <p id={`${inputId}-hint`} className="text-[13px] text-muted-foreground">
        JPEG, PNG or WebP, up to {COVER_MAX_BYTES / 1024 / 1024} MB. 16:10 works best.
      </p>
      {shownError && (
        <p role="alert" className="text-[13px] font-medium text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
