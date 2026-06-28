"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  PenLine,
  Type,
  Image,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import clsx from "clsx";
import StyleSelector from "./StyleSelector";
import type { InputType, PersonaStyle } from "@/lib/types";

interface DreamCaptureProps {
  onCapture: (data: {
    rawInput: string;
    inputType: InputType;
    personaStyle: PersonaStyle;
    sketchData?: string;
  }) => Promise<void>;
  loading?: boolean;
  prefillText?: string;
  clearPrefill?: () => void;
}

type Tab = "text" | "voice" | "sketch";

export default function DreamCapture({
  onCapture,
  loading,
  prefillText,
  clearPrefill,
}: DreamCaptureProps) {
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");

  useEffect(() => {
    if (prefillText) {
      setTab("text");
      setText(prefillText);
      clearPrefill?.();
    }
  }, [prefillText, clearPrefill]);
  const [style, setStyle] = useState<PersonaStyle>("motivational");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [sketchNote, setSketchNote] = useState("");
  const [sketchFile, setSketchFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "text", label: "Text", icon: Type },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "sketch", label: "Sketch", icon: Image },
  ];

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setTranscribing(true);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const res = await fetch("/api/speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64 }),
            });
            const data = await res.json();
            setVoiceText(data.text ?? "");
          } catch {
            setVoiceText("I want to pursue my dream and make it happen");
          } finally {
            setTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setVoiceText("Microphone access denied — type your dream instead!");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const handleSketchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSketchFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setSketchPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    let rawInput = "";
    let inputType: InputType = "text";
    let sketchData: string | undefined;

    if (tab === "text") {
      rawInput = text.trim();
      inputType = "text";
    } else if (tab === "voice") {
      rawInput = voiceText.trim();
      inputType = "voice";
    } else {
      rawInput = sketchNote.trim() || "My visual dream sketch";
      inputType = "sketch";
      if (sketchFile) {
        const formData = new FormData();
        formData.append("sketch", sketchFile);
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            sketchData = data.url;
          }
        } catch (e) {
          console.error("Sketch upload failed", e);
        }
      }
      if (!sketchData) {
        sketchData = sketchPreview ?? undefined;
      }
    }

    if (!rawInput) return;

    await onCapture({ rawInput, inputType, personaStyle: style, sketchData });

    setText("");
    setVoiceText("");
    setSketchNote("");
    setSketchPreview(null);
    setSketchFile(null);
  };

  const canSubmit =
    !loading &&
    !transcribing &&
    ((tab === "text" && text.trim()) ||
      (tab === "voice" && voiceText.trim()) ||
      (tab === "sketch" && (sketchPreview || sketchNote.trim())));

  return (
    <div className="glass rounded-3xl p-6 dream-glow">
      <div className="flex items-center gap-2 mb-5">
        <PenLine className="w-5 h-5 text-dream-400" />
        <h2 className="font-semibold text-lg">Capture Your Dream</h2>
      </div>

      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === id
                ? "bg-dream-600 text-white shadow-lg"
                : "text-white/50 hover:text-white/80"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "text" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "I want to write a book about my journey..."'
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-dream-500/50 transition-colors"
        />
      )}

      {tab === "voice" && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-6">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
              className={clsx(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                recording
                  ? "bg-red-500/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  : "bg-dream-500/20 border-2 border-dream-500 hover:bg-dream-500/30 hover:scale-105"
              )}
            >
              {transcribing ? (
                <Loader2 className="w-8 h-8 text-dream-400 animate-spin" />
              ) : recording ? (
                <MicOff className="w-8 h-8 text-red-400" />
              ) : (
                <Mic className="w-8 h-8 text-dream-400" />
              )}
            </button>

            {recording && (
              <div className="flex items-center gap-1 mt-4 h-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                  <div
                    key={bar}
                    className="w-1 bg-red-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      minHeight: "4px",
                      animationDelay: `${bar * 100}ms`,
                      animationDuration: `${0.4 + Math.random() * 0.6}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-white/40 mt-3">
              {transcribing
                ? "Transcribing..."
                : recording
                ? "Recording... tap to stop"
                : "Tap to record your dream"}
            </p>
          </div>
          {voiceText !== "" && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 block">Edit speech transcription</label>
              <textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-dream-500/50 resize-none"
              />
            </div>
          )}
        </div>
      )}

      {tab === "sketch" && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSketchUpload}
            className="hidden"
          />
          {sketchPreview ? (
            <div className="relative">
              <img
                src={sketchPreview}
                alt="Sketch preview"
                className="w-full h-48 object-contain rounded-xl bg-white/5 border border-white/10"
              />
              <button
                type="button"
                onClick={() => {
                  setSketchPreview(null);
                  setSketchFile(null);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-dream-500/50 transition-colors"
            >
              <Image className="w-8 h-8 text-white/30" />
              <span className="text-sm text-white/40">Upload a sketch or mood board</span>
            </button>
          )}
          <input
            type="text"
            value={sketchNote}
            onChange={(e) => setSketchNote(e.target.value)}
            placeholder="Describe what this sketch represents..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-dream-500/50"
          />
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs text-white/40 mb-2">Preferred style</p>
        <StyleSelector value={style} onChange={setStyle} disabled={loading} />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={clsx(
          "w-full mt-5 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
          canSubmit
            ? "bg-gradient-to-r from-dream-600 to-dream-500 hover:from-dream-500 hover:to-dream-400 text-white shadow-lg shadow-dream-500/25"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating your roadmap...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Capture & Expand Dream
          </>
        )}
      </button>
    </div>
  );
}
