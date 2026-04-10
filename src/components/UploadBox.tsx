"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type UploadBoxProps = {
  onAnalyze: () => void;
  loading: boolean;
};

export function UploadBox({ onAnalyze, loading }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`glass-panel cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-cyan-300 bg-cyan-400/10"
            : "border-cyan-400/40 hover:border-cyan-300"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
        <h2 className="text-xl font-semibold text-white">
          Drag and drop product image
        </h2>
        <p className="mt-2 text-sm text-slate-300">or click to select a file</p>

        {preview ? (
          <div className="relative mx-auto mt-6 h-56 w-full max-w-md overflow-hidden rounded-2xl ring-1 ring-cyan-300/50">
            <Image
              src={preview}
              alt="Uploaded preview"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto mt-6 h-56 w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/60" />
        )}
      </div>

      <button
        type="button"
        disabled={!preview || loading}
        onClick={onAnalyze}
        className="neon-btn mx-auto mt-8 block disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing image using AI..." : "Analyze with AI"}
      </button>
    </section>
  );
}
