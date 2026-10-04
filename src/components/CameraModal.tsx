import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RefreshCw, X, Check, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stop camera tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCapturedImage(null);

    // Stop existing tracks if any
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t("Camera access is not supported on this browser."));
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsLoading(false);
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setIsLoading(false);
      const msg =
        err instanceof Error ? err.message : t("Unable to access camera. Please check permissions.");
      setError(msg);
    }
  }, [facingMode, stream, t]);

  // Handle open/close state
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setCapturedImage(null);
      setError(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Take photo snapshot
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
  };

  // Confirm photo
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Switch camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">{t("Capture Crop Photo")}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close")}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Display Viewport */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center">
          {isLoading && !error && (
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
              <p className="text-sm">{t("Starting camera...")}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-slate-300">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm font-medium text-red-200">{error}</p>
              <p className="text-xs text-slate-400">
                {t("Please ensure camera permissions are granted in your browser settings.")}
              </p>
            </div>
          )}

          {/* Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              capturedImage || error || isLoading ? "hidden" : "block"
            } ${facingMode === "user" ? "-scale-x-100" : ""}`}
          />

          {/* Captured Image Preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured preview"
              className="h-full w-full object-cover"
            />
          )}

          {/* Frame alignment guide lines when video active */}
          {!capturedImage && !error && !isLoading && (
            <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-emerald-400/50 flex items-center justify-center">
              <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-emerald-200 backdrop-blur-sm">
                {t("Center leaf or crop in frame")}
              </span>
            </div>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 p-5 bg-slate-900/90">
          {capturedImage ? (
            <div className="flex w-full items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {t("Retake")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/40"
              >
                <Check className="h-4 w-4" />
                {t("Use Photo")}
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <button
                type="button"
                onClick={toggleFacingMode}
                disabled={!!error || isLoading}
                className="rounded-full border border-white/15 bg-white/10 p-3 text-slate-200 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-40"
                title={t("Switch Camera")}
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={takePhoto}
                disabled={!!error || isLoading}
                className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 p-1 shadow-lg shadow-emerald-900/50 hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                title={t("Take Photo")}
              >
                <span className="block h-12 w-12 rounded-full border-2 border-slate-900 bg-emerald-400 group-hover:bg-emerald-300" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/10 p-3 text-slate-200 hover:bg-white/20 hover:text-white transition-colors"
                title={t("Cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
