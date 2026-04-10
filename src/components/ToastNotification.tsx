"use client";

import { AnimatePresence, motion } from "framer-motion";

type ToastNotificationProps = {
  message: string | null;
};

export function ToastNotification({ message }: ToastNotificationProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50">
      <AnimatePresence>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: -8, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -8, x: 20 }}
            className="rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-4 py-3 text-sm text-emerald-100 shadow-[0_0_22px_rgba(74,222,128,0.35)]"
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
