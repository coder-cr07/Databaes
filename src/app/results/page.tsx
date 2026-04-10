"use client";

import { useEffect, useMemo, useState } from "react";
import { FloatingParticles } from "@/components/FloatingParticles";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Navbar } from "@/components/Navbar";
import { PriceModal } from "@/components/PriceModal";
import { ProductCard } from "@/components/ProductCard";
import { ToastNotification } from "@/components/ToastNotification";
import { mockProducts } from "@/data/products";
import { TrackingStatus } from "@/types/product";

type PriceMap = Record<string, number>;
type StatusMap = Record<string, TrackingStatus>;
type TrackingEvent = { id: string; message: string; timestamp: number };

const STORAGE_KEY = "aura-tracking";

function loadTrackingState(): { targetPrices: PriceMap; statusMap: StatusMap } {
  if (typeof window === "undefined") {
    return { targetPrices: {}, statusMap: {} };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { targetPrices: {}, statusMap: {} };
  }

  try {
    const parsed = JSON.parse(raw) as { targetPrices?: PriceMap; statusMap?: StatusMap };
    return {
      targetPrices: parsed.targetPrices ?? {},
      statusMap: parsed.statusMap ?? {},
    };
  } catch {
    return { targetPrices: {}, statusMap: {} };
  }
}

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetPrices, setTargetPrices] = useState<PriceMap>(() => loadTrackingState().targetPrices);
  const [statusMap, setStatusMap] = useState<StatusMap>(() => loadTrackingState().statusMap);
  const [currentPrices, setCurrentPrices] = useState<PriceMap>(() =>
    Object.fromEntries(mockProducts.map((item) => [item.id, item.price])),
  );
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [boughtProducts, setBoughtProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ targetPrices, statusMap }));
  }, [targetPrices, statusMap]);

  useEffect(() => {
    const trackingProducts = Object.entries(statusMap)
      .filter(([, status]) => status === "tracking")
      .map(([id]) => id);
    if (!trackingProducts.length) return;

    const timer = setTimeout(() => {
      const winnerId = trackingProducts[0];
      const product = mockProducts.find((item) => item.id === winnerId);
      if (!product) return;

      const droppedPrice = Number((product.price * 0.88).toFixed(2));
      setCurrentPrices((prev) => ({ ...prev, [winnerId]: droppedPrice }));
      setStatusMap((prev) => ({ ...prev, [winnerId]: "success" }));
      setToast(`Price dropped! Ready to buy: ${product.name}`);
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          message: `Price dropped to $${droppedPrice.toFixed(2)} for ${product.name}.`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }, 4000);

    return () => clearTimeout(timer);
  }, [statusMap]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedProduct = useMemo(
    () => mockProducts.find((product) => product.id === selectedId),
    [selectedId],
  );
  const successfulProducts = useMemo(
    () => mockProducts.filter((product) => statusMap[product.id] === "success"),
    [statusMap],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      <Navbar />
      <ToastNotification message={toast} />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">AI Product Matches</h1>
        <p className="mt-2 text-slate-300">
          Simulated AI results with confidence scores and live price tracking.
        </p>

        {successfulProducts.length > 0 ? (
          <section className="glass-panel mt-6 rounded-2xl border border-emerald-300/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-emerald-200">
                  Auto-Buy Signal Active
                </p>
                <h2 className="mt-1 text-xl font-semibold text-emerald-50">
                  AURA found buy-ready opportunities.
                </h2>
              </div>
              <button
                type="button"
                className="neon-btn"
                onClick={() => {
                  setBoughtProducts((prev) => [
                    ...new Set([...prev, ...successfulProducts.map((item) => item.id)]),
                  ]);
                  setEvents((prev) => [
                    {
                      id: crypto.randomUUID(),
                      message: "Autonomous checkout executed for buy-ready products.",
                      timestamp: Date.now(),
                    },
                    ...prev,
                  ]);
                  setToast("Autonomous buy confirmed. Orders are in progress.");
                }}
              >
                Buy Now with AURA
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {successfulProducts.map((product) => (
                <span
                  key={product.id}
                  className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100"
                >
                  {product.name} {boughtProducts.includes(product.id) ? "(Purchased)" : "(Ready)"}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {mockProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{ ...product, price: currentPrices[product.id] ?? product.price }}
                  status={statusMap[product.id] ?? "idle"}
                  targetPrice={targetPrices[product.id]}
                  onSetTarget={() => setSelectedId(product.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="glass-panel mt-8 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white">Tracking Timeline</h2>
          <p className="mt-1 text-sm text-slate-300">
            Live event stream for target tracking and autonomous buying.
          </p>
          <div className="mt-4 space-y-3">
            {events.length > 0 ? (
              events.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-300" />
                  <div>
                    <p className="text-sm text-slate-100">{event.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No events yet. Set a target price to start tracking.
              </p>
            )}
          </div>
        </section>
      </main>

      {selectedProduct ? (
        <PriceModal
          productName={selectedProduct.name}
          onClose={() => setSelectedId(null)}
          onSave={(target) => {
            setTargetPrices((prev) => ({ ...prev, [selectedProduct.id]: target }));
            setStatusMap((prev) => ({ ...prev, [selectedProduct.id]: "tracking" }));
            setEvents((prev) => [
              {
                id: crypto.randomUUID(),
                message: `Target price set at $${target.toFixed(2)} for ${selectedProduct.name}.`,
                timestamp: Date.now(),
              },
              {
                id: crypto.randomUUID(),
                message: `AURA started monitoring ${selectedProduct.name}.`,
                timestamp: Date.now(),
              },
              ...prev,
            ]);
          }}
        />
      ) : null}
    </div>
  );
}
