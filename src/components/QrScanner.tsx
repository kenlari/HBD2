import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
import { Camera, X, CheckCircle, Smartphone } from "lucide-react";

interface ScannedQrProfile {
  uid?: string;
  username?: string;
  name?: string;
  notOnHbd?: boolean;
  localOnly?: boolean;
}

interface QrScannerProps {
  onScan: (profileData: ScannedQrProfile) => void;
  onClose: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldRunCameraRef = useRef<boolean>(false);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"camera" | "simulator">("camera");
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const getUserMedia = () => navigator.mediaDevices?.getUserMedia({
    video: { facingMode: "environment" }
  });

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      console.warn("Audio Context chime failed: ", e);
    }
  };

  const startCamera = async () => {
    try {
      shouldRunCameraRef.current = true;
      setPermissionError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await getUserMedia();
      if (!stream) {
        throw new Error("Camera API unavailable");
      }
      if (!shouldRunCameraRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Video playback interrupted or prevented:", error);
          });
        }
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera acquisition failed", err);
      if (shouldRunCameraRef.current) {
        setCameraActive(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError("Camera access was denied. Please adjust your browser permissions.");
        } else {
          setPermissionError("No camera device was detected or hardware is busy. Use the simulator below.");
        }
        setActiveTab("simulator");
      }
    }
  };

  const stopCamera = () => {
    shouldRunCameraRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "camera" || !cameraActive) return;

    let animationFrameId: number;
    const canvas = canvasRef.current || document.createElement("canvas");
    const context = canvas.getContext("2d");

    const scanFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && context) {
        const width = 320;
        const height = 320;
        canvas.width = width;
        canvas.height = height;

        context.drawImage(video, 0, 0, width, height);

        const imageData = context.getImageData(0, 0, width, height);
        try {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });

          if (code) {
            try {
              const data = JSON.parse(code.data);
              if (data && data.hbd) {
                playBeep();
                const username = data.username || data.snapchat;
                const scannedProfile: ScannedQrProfile = {
                  uid: data.uid,
                  username,
                  name: data.name || username || "Scanned Contact"
                };
                setToastMessage(`Scanned ${scannedProfile.name}!`);
                setTimeout(() => onScanRef.current(scannedProfile), 350);
                return;
              }
            } catch (jsonErr) {
              const raw = code.data.trim();
              const username = raw.replace(/^hbd:\/\/addbuddy\?username=/, "").replace(/^username:/, "");
              if (raw.includes("hbd://addbuddy") || raw.includes("username:")) {
                playBeep();
                setToastMessage("Scanned HBD profile!");
                setTimeout(() => onScanRef.current({ username, name: username }), 350);
                return;
              }
            }
          }
        } catch (scanErr) {
          console.warn("QR scan frame failed:", scanErr);
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    animationFrameId = requestAnimationFrame(scanFrame);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, activeTab]);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-100">Scan Buddy QR Code</h4>
            <p className="text-[10px] text-slate-400">Scanning sends a pending buddy request; it does not connect instantly.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex bg-slate-800/60 p-1 rounded-xl gap-1 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("camera")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === "camera"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Real Camera</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === "simulator"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Simulator</span>
        </button>
      </div>

      <div className="relative aspect-square rounded-xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center">
        {activeTab === "camera" ? (
          <>
            {permissionError ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 space-y-2.5 max-w-xs">
                <p className="font-semibold leading-relaxed text-slate-300">{permissionError}</p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10.5px] cursor-pointer shadow transition"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full">
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "auto", aspectRatio: "1/1", objectFit: "cover", borderRadius: "12px" }}
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none">
                  <div className="w-40 h-40 border-2 border-indigo-400/60 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br" />
                    <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_10px_#818cf8] animate-pulse" style={{
                      top: "20%",
                      animation: "scanLine 2.2s infinite ease-in-out"
                    }} />
                    <div className="text-[9px] font-bold text-indigo-400 tracking-wider text-center uppercase bg-slate-950/80 px-2.5 py-1 rounded-md absolute bottom-2">
                      Align QR Code
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 w-full h-full flex flex-col justify-center items-center bg-slate-950/40 text-center space-y-3">
            <div className="space-y-2">
              <h5 className="font-black text-sm text-slate-100">Simulate a scanned profile</h5>
              <p className="text-[10px] text-slate-400">Use this when camera access is unavailable.</p>
            </div>
            <button
              type="button"
              onClick={() => onScan({ username: "demo_buddy", name: "Demo Buddy", localOnly: true, notOnHbd: true })}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-4 py-3 rounded-xl transition cursor-pointer"
            >
              Simulate @demo_buddy
            </button>
          </div>
        )}

        {toastMessage && (
          <div className="absolute inset-0 bg-indigo-600/95 flex flex-col items-center justify-center text-center space-y-2 select-none animate-fade-in z-20">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h5 className="font-black text-white text-sm">{toastMessage}</h5>
            <p className="text-[10px] text-indigo-200">Request created. Waiting for acceptance.</p>
          </div>
        )}
      </div>

      <div className="text-[9.5px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed text-left">
        Scan a profile QR code to create a pending buddy request. The other person must accept from Requests before either roster is linked.
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
};
