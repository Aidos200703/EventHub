"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Camera QR scanner: getUserMedia + jsQR on a canvas. Works on any modern phone
 * browser over HTTPS or localhost; manual code entry is always available as a fallback.
 */
export function QrScanner({
  onDetected,
  paused,
}: {
  onDetected: (text: string) => void;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDetectedRef = useRef(onDetected);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    pausedRef.current = paused;
  });

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let frame = 0;
    let lastText = "";
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const tick = () => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          if (canvas && video.readyState === video.HAVE_ENOUGH_DATA && !pausedRef.current) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code?.data && code.data !== lastText) {
              lastText = code.data;
              onDetectedRef.current(code.data);
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch {
        setError("Camera is unavailable. Allow camera access or enter the code manually.");
        setActive(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return (
    <div className="grid gap-3">
      <div className="surface-dark relative grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-3xl bg-background">
        <video
          ref={videoRef}
          className={active ? "absolute inset-0 size-full object-cover" : "hidden"}
          playsInline
          muted
          aria-label="Camera preview"
        />
        <canvas ref={canvasRef} className="hidden" />
        {active ? (
          <div
            aria-hidden
            className="relative size-3/5 rounded-3xl border-4 border-lime shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          />
        ) : (
          <div className="grid justify-items-center gap-3 p-6 text-center">
            <Camera className="size-10 text-lime" aria-hidden />
            <p className="text-sm text-muted-foreground">Point the camera at a ticket QR code</p>
          </div>
        )}
      </div>
      <Button
        type="button"
        variant={active ? "outline" : "default"}
        className="w-fit"
        onClick={() => setActive((a) => !a)}
      >
        {active ? (
          <>
            <CameraOff /> Stop camera
          </>
        ) : (
          <>
            <Camera /> Start camera
          </>
        )}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
