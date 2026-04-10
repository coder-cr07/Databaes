"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6">
      <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-block rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs tracking-[0.2em] text-cyan-200"
        >
          AI-NATIVE SHOPPING
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl"
        >
          AURA - Your Autonomous Shopping Agent
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
        >
          Upload a product image, let AI find precise matches, track market prices,
          and automate buying the moment your target price is reached.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <Link href="/upload" className="neon-btn">
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
