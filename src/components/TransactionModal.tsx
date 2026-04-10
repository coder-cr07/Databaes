"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TransactionModalProps = {
  productName: string;
  auraAmount: number;
  onClose: () => void;
};

function generateFakeTxId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from({ length: 52 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export function TransactionModal({
  productName,
  auraAmount,
  onClose,
}: TransactionModalProps) {
  const [stage, setStage] = useState<"processing" | "confirmed">("processing");
  const [txId] = useState(() => generateFakeTxId());

  useEffect(() => {
    const timer = setTimeout(() => setStage("confirmed"), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stage === "confirmed") {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [stage, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-2xl border border-cyan-400/30 p-6"
      >
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/20">
            <span className="text-lg">⛓️</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400">Algorand Network</p>
            <h3 className="text-base font-semibold text-white">Transaction Broadcast</h3>
          </div>
        </div>

        {/* Product */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Purchasing</p>
          <p className="mt-0.5 text-sm font-medium text-white">{productName}</p>
          <p className="mt-1 text-xs text-fuchsia-300">◈ {auraAmount.toLocaleString()} AURA debited</p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "processing" ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Spinner */}
              <div className="relative mx-auto mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400" />
                <div
                  className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-fuchsia-400"
                  style={{ animationDirection: "reverse", animationDuration: "0.7s" }}
                />
              </div>
              <p className="text-sm font-semibold text-cyan-200">Processing on Algorand...</p>
              <p className="mt-1 text-xs text-slate-400">Broadcasting to consensus nodes</p>

              {/* TX ID (truncated) */}
              <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-left">
                <p className="text-xs text-slate-500">Transaction ID</p>
                <p className="mt-0.5 break-all font-mono text-xs text-cyan-300/70">
                  {txId.slice(0, 26)}…
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
              >
                <span className="text-2xl">✓</span>
              </motion.div>
              <p className="text-sm font-semibold text-emerald-300">Transaction Confirmed!</p>
              <p className="mt-1 text-xs text-slate-400">Block finalized on Algorand</p>

              {/* Full TX ID */}
              <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-left">
                <p className="text-xs text-slate-500">Transaction ID</p>
                <p className="mt-0.5 break-all font-mono text-xs text-emerald-300">
                  {txId}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="neon-btn mx-auto mt-4 block text-sm"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
