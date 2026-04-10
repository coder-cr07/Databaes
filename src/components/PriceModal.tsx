"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

type PriceModalProps = {
  productName: string;
  onClose: () => void;
  onSave: (value: number) => void;
};

export function PriceModal({ productName, onClose, onSave }: PriceModalProps) {
  const [target, setTarget] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(target);
    if (!Number.isNaN(value) && value > 0) {
      onSave(value);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={submit}
        className="glass-panel w-full max-w-md rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white">Set Target Price</h3>
        <p className="mt-1 text-sm text-slate-300">{productName}</p>
        <label className="mt-4 block text-sm text-slate-200">Target Price ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-2 w-full rounded-xl border border-cyan-300/40 bg-slate-950/80 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-300/40"
          placeholder="149.99"
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-4 py-2 text-slate-200 hover:bg-white/10"
          >
            Cancel
          </button>
          <button type="submit" className="neon-btn">
            Start Tracking
          </button>
        </div>
      </motion.form>
    </div>
  );
}
