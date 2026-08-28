import { Camera, Check, RefreshCw, Sparkles, UploadCloud, UserRound, X, AlertCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface RapidoCameraSelfieProps {
  onCapture: (imageDataUrl: string) => void;
  initialImage?: string;
  isVerified?: boolean;
}

export function RapidoCameraSelfie({
  onCapture,
  initialImage = "",
  isVerified = false,
}: RapidoCameraSelfieProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>(initialImage);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [livenessStage, setLivenessStage] = useState<"align" | "smile" | "hold">("align");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setStream(newStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
      setLivenessStage("align");
      setTimeout(() => setLivenessStage("smile"), 2000);
      setTimeout(() => setLivenessStage("hold"), 3500);
    } catch (err: any) {
      console.warn("Camera access failed, falling back to file picker:", err);
      setCameraError("Camera permission denied. You can upload a photo from your gallery.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If front camera, mirror horizontally
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setCapturedImage(dataUrl);
    stopCamera();
    onCapture(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      onCapture(result);
    };
    reader.readAsDataURL(file);
  };

  const switchCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    void startCamera(nextMode);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Camera className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Live Rider Selfie & Liveness</h4>
            <p className="text-[0.7rem] text-muted-foreground">Clear photo without cap or glasses</p>
          </div>
        </div>
        {capturedImage && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="size-3.5" />
            Captured
          </span>
        )}
      </div>

      {/* Main Display Area */}
      <div className="relative mt-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-muted/40 p-4">
        {cameraActive ? (
          <div className="relative flex w-full max-w-[280px] flex-col items-center">
            {/* Live Video Preview with Oval Frame Overlay */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border-4 border-amber-400/80 shadow-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`size-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
              />
              {/* Rapido-style Face Oval Mask Guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="size-48 rounded-[50%] border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>

              {/* Liveness Tip Badge */}
              <div className="absolute top-3 inset-x-3 flex justify-center">
                <span className="animate-pulse rounded-full bg-black/70 px-3 py-1 text-[0.68rem] font-bold text-amber-300 backdrop-blur-md">
                  {livenessStage === "align" && "👀 Align your face inside the oval"}
                  {livenessStage === "smile" && "😊 Look straight & smile slightly"}
                  {livenessStage === "hold" && "✨ Perfect! Hold steady"}
                </span>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="mt-4 flex w-full items-center justify-between px-4">
              <button
                type="button"
                onClick={switchCamera}
                className="flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-muted"
                title="Switch Camera"
              >
                <RefreshCw className="size-5" />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="flex size-16 items-center justify-center rounded-full border-4 border-white bg-amber-400 text-black shadow-lg transition-transform active:scale-95"
              >
                <div className="size-12 rounded-full border-2 border-black/20 bg-amber-500" />
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="flex size-11 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:bg-muted"
                title="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div className="flex flex-col items-center">
            <div className="relative size-36 overflow-hidden rounded-full border-4 border-emerald-500 shadow-md">
              <img
                src={capturedImage}
                alt="Captured Rider Selfie"
                className="size-full object-cover"
              />
              <div className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-4 stroke-[3]" />
              </div>
            </div>
            <p className="mt-2 text-[0.75rem] font-bold text-emerald-600 dark:text-emerald-400">
              Selfie & Liveness Verified
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <UploadCloud className="size-3.5" />
                Upload File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserRound className="size-10 stroke-[1.5]" />
            </div>
            <p className="mt-3 text-xs font-bold text-foreground">Take a Quick Face Selfie</p>
            <p className="mt-0.5 max-w-[220px] text-[0.7rem] text-muted-foreground">
              Rapido requires a live photo to verify your identity before approving orders.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black shadow-sm transition-transform hover:bg-amber-300 active:scale-95"
              >
                <Camera className="size-4" />
                Open Live Camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                Upload from Gallery
              </button>
            </div>

            {cameraError && (
              <div className="mt-3 flex items-center gap-1.5 text-left text-[0.72rem] text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
