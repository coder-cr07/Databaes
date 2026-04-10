"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Product, TrackingStatus } from "@/types/product";

type ProductCardProps = {
  product: Product;
  status: TrackingStatus;
  targetPrice?: number;
  onSetTarget: () => void;
};

export function ProductCard({
  product,
  status,
  targetPrice,
  onSetTarget,
}: ProductCardProps) {
  const badgeText =
    status === "success"
      ? "Ready to buy"
      : status === "tracking"
        ? "Tracking price..."
        : "Not tracking";
  const badgeClass =
    status === "success"
      ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-100"
      : status === "tracking"
        ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
        : "border-white/20 bg-white/5 text-slate-300";

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="glass-panel overflow-hidden rounded-2xl"
    >
      <div className="relative h-48 w-full">
        <Image src={product.image} alt={product.title} fill className="object-cover" />
      </div>
      <div className="p-5">
        <h3 className="text-base font-medium text-white">{product.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-cyan-200">${product.price.toFixed(2)}</p>
          <a
            href={product.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-fuchsia-300/40 bg-fuchsia-400/20 px-2.5 py-1 text-xs text-fuchsia-100"
          >
            View deal
          </a>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${badgeClass}`}>
            {badgeText}
          </span>
          {targetPrice ? (
            <span className="text-xs text-slate-300">Target: ${targetPrice.toFixed(2)}</span>
          ) : null}
        </div>
        <button type="button" onClick={onSetTarget} className="neon-btn mt-4 w-full">
          Set Target Price
        </button>
      </div>
    </motion.article>
  );
}
