"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Navbar } from "@/components/Navbar";
import { UploadBox } from "@/components/UploadBox";

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/results");
    }, 1800);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      <Navbar />
      <div className="relative z-10 py-10">
        <h1 className="px-4 text-center text-3xl font-semibold text-white sm:text-4xl">
          Upload and Analyze
        </h1>
        <p className="mt-3 px-4 text-center text-slate-300">
          Drop a product image and let AURA identify the best matches.
        </p>
        <UploadBox onAnalyze={onAnalyze} loading={loading} />
      </div>
    </div>
  );
}
