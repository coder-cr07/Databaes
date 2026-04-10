"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WalletBarProps = {
  walletAddress: string | null;
  onConnectWallet: () => Promise<void>;
  autoBuyStatus: string;
};

export function WalletBar({
  walletAddress,
  onConnectWallet,
  autoBuyStatus,
}: WalletBarProps) {
  const [connecting, setConnecting] = useState(false);
  const walletConnected = Boolean(walletAddress);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mx-auto mb-6 w-full max-w-6xl rounded-2xl px-5 py-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Wallet Connect */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={connecting}
            onClick={async () => {
              try {
                setConnecting(true);
                await onConnectWallet();
              } finally {
                setConnecting(false);
              }
            }}
            className={`relative flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              walletConnected
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.3)]"
                : "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                walletConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            {walletConnected
              ? "Pera Wallet Connected"
              : connecting
                ? "Connecting..."
                : "Connect Wallet"}
          </button>

          <AnimatePresence>
            {walletConnected && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300"
              >
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden h-7 w-px bg-white/10 sm:block" />

        {/* Auto-buy status */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1">
            <span className="text-xs font-bold text-fuchsia-300">Auto-buy</span>
          </div>
          <span className="text-xs text-slate-300">{autoBuyStatus}</span>
        </div>
      </div>
    </motion.div>
  );
}
