"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";
import { FloatingParticles } from "@/components/FloatingParticles";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Navbar } from "@/components/Navbar";
import { PriceModal } from "@/components/PriceModal";
import { ProductCard } from "@/components/ProductCard";
import { ToastNotification } from "@/components/ToastNotification";
import { WalletBar } from "@/components/WalletBar";
import { fetchProductsByKeyword } from "@/data/products";
import { Product, TrackingStatus } from "@/types/product";

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
  const searchParams = useSearchParams();
  const keyword = (searchParams.get("keyword") ?? "tech").toLowerCase();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTargetPrice, setFilterTargetPrice] = useState<string>("");
  const [targetPrices, setTargetPrices] = useState<PriceMap>(() => loadTrackingState().targetPrices);
  const [statusMap, setStatusMap] = useState<StatusMap>(() => loadTrackingState().statusMap);
  const [currentPrices, setCurrentPrices] = useState<PriceMap>({});
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [autoBuyStatus, setAutoBuyStatus] = useState("Waiting for a target price...");
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [boughtProducts, setBoughtProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const peraWallet = useMemo(() => new PeraWalletConnect({ chainId: 416002 }), []);
  const algodClient = useMemo(
    () => new algosdk.Algodv2("", "https://testnet-api.algonode.cloud", ""),
    [],
  );

  useEffect(() => {
    const syncWallet = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch {
        setWalletAddress(null);
      }
    };
    syncWallet();
  }, [peraWallet]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const fetched = await fetchProductsByKeyword(keyword);
        setProducts(fetched);
        setCurrentPrices(Object.fromEntries(fetched.map((item) => [item.id, item.price])));
      } catch {
        setToast("Unable to fetch products right now.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [keyword]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ targetPrices, statusMap }));
  }, [targetPrices, statusMap]);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setWalletAddress(accounts[0] ?? null);
      setToast(accounts[0] ? "Wallet connected successfully." : "No wallet account selected.");
    } catch {
      setToast("Wallet connection failed.");
    }
  };

  const sendTestnetPayment = useCallback(async (product: Product) => {
    if (!walletAddress) {
      setToast("Connect wallet before auto-buy.");
      return false;
    }

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: walletAddress,
        amount: 1000,
        suggestedParams,
        note: new TextEncoder().encode(`AURA auto-buy: ${product.title}`),
      });
      const signedTxn = await peraWallet.signTransaction([[{ txn, signers: [walletAddress] }]]);
      const result = await algodClient.sendRawTransaction(signedTxn[0]).do();

      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          message: `Payment sent for ${product.title}. Txn: ${result.txId}`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      setToast(`Auto-buy payment sent for ${product.title}`);
      return true;
    } catch {
      setToast(`Payment failed for ${product.title}`);
      return false;
    }
  }, [algodClient, peraWallet, walletAddress]);

  useEffect(() => {
    const trackingProducts = Object.entries(statusMap)
      .filter(([, status]) => status === "tracking")
      .map(([id]) => id);
    if (!trackingProducts.length) {
      setAutoBuyStatus("Waiting for a target price...");
      return;
    }
    setAutoBuyStatus("Monitoring prices every 5 seconds...");

    const timer = setInterval(() => {
      setCurrentPrices((prev) => {
        const next = { ...prev };
        for (const productId of trackingProducts) {
          const current = prev[productId];
          if (!current) continue;
          const drift = 0.94 + Math.random() * 0.06;
          next[productId] = Number((current * drift).toFixed(2));
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [statusMap]);

  useEffect(() => {
    const checkAutoBuy = async () => {
      for (const product of products) {
        const target = targetPrices[product.id];
        if (!target || boughtProducts.includes(product.id)) continue;
        const current = currentPrices[product.id] ?? product.price;
        if (current > target) continue;

        setStatusMap((prev) => ({ ...prev, [product.id]: "success" }));
        setAutoBuyStatus(`Target hit for ${product.title}. Executing purchase...`);
        const paid = await sendTestnetPayment(product);
        if (paid) {
          setBoughtProducts((prev) => [...new Set([...prev, product.id])]);
        }
      }
    };

    checkAutoBuy();
  }, [boughtProducts, currentPrices, products, sendTestnetPayment, targetPrices]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId),
    [products, selectedId],
  );
  const successfulProducts = useMemo(
    () => products.filter((product) => statusMap[product.id] === "success"),
    [products, statusMap],
  );
  const visibleProducts = useMemo(() => {
    const parsedTarget = Number(filterTargetPrice);
    if (!filterTargetPrice || Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      return products;
    }
    return products.filter((product) => (currentPrices[product.id] ?? product.price) <= parsedTarget);
  }, [currentPrices, filterTargetPrice, products]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      <Navbar />
      <ToastNotification message={toast} />
      <WalletBar
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        autoBuyStatus={autoBuyStatus}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">AI Product Matches</h1>
        <p className="mt-2 text-slate-300">Detected keyword: {keyword}</p>
        <div className="mt-4 max-w-sm">
          <label className="text-sm text-slate-200">Filter products by target price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={filterTargetPrice}
            onChange={(event) => setFilterTargetPrice(event.target.value)}
            className="mt-2 w-full rounded-xl border border-cyan-300/40 bg-slate-950/80 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-300/40"
            placeholder="250.00"
          />
        </div>

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
                  {product.title} {boughtProducts.includes(product.id) ? "(Purchased)" : "(Ready)"}
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
              {visibleProducts.map((product) => (
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
          productName={selectedProduct.title}
          onClose={() => setSelectedId(null)}
          onSave={(target) => {
            setTargetPrices((prev) => ({ ...prev, [selectedProduct.id]: target }));
            setStatusMap((prev) => ({ ...prev, [selectedProduct.id]: "tracking" }));
            setEvents((prev) => [
              {
                id: crypto.randomUUID(),
                message: `Target price set at $${target.toFixed(2)} for ${selectedProduct.title}.`,
                timestamp: Date.now(),
              },
              {
                id: crypto.randomUUID(),
                message: `AURA started monitoring ${selectedProduct.title}.`,
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
