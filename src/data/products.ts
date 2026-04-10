import { Product } from "@/types/product";

type DetectionInput = {
  fileName: string;
  imageDataUrl: string;
};

/** Stable placeholder when an API omits or breaks image URLs (allowed in next.config images). */
export const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80";

const DUMMYJSON_BASE = "https://dummyjson.com";

/** Map internal keyword → DummyJSON category slug (catalog has no dedicated “jackets”). */
const KEYWORD_TO_DUMMY_CATEGORY: Record<string, string> = {
  phone: "smartphones",
  laptop: "laptops",
  watch: "mens-watches",
  headphone: "mobile-accessories",
  bag: "womens-bags",
  shoe: "mens-shoes",
  camera: "sports-accessories",
  perfume: "fragrances",
  shirt: "mens-shirts",
  dress: "womens-dresses",
  tablet: "tablets",
  sunglasses: "sunglasses",
  furniture: "furniture",
  beauty: "beauty",
  groceries: "groceries",
};

/**
 * Keywords where DummyJSON has little/no inventory — use Openverse image search instead
 * so “jacket” stays visually in-category (outerwear), not random electronics.
 */
const OPENVERSE_FIRST_KEYWORDS = new Set([
  "jacket",
  "coat",
  "parka",
  "blazer",
  "hoodie",
  "sweater",
  "cardigan",
  "outerwear",
  "vest",
]);

const CATEGORY_HINTS: Record<string, string[]> = {
  jacket: ["jacket", "coat", "parka", "blazer", "outerwear", "hoodie", "anorak", "windbreaker", "bomber"],
  coat: ["jacket", "coat", "parka", "blazer", "outerwear"],
  headphone: ["headphones", "headphone", "audio", "earbuds", "earphone", "speaker", "music"],
  watch: ["watch", "wearable", "smartwatch", "fitness", "strap"],
  camera: ["camera", "lens", "gimbal", "tripod", "photography"],
  laptop: ["laptop", "keyboard", "monitor", "tech", "computer", "macbook", "notebook"],
  phone: ["phone", "smartphone", "mobile", "iphone", "android", "pixel", "galaxy"],
  shoe: ["shoe", "sneaker", "running", "sports", "footwear", "boot"],
  bag: ["bag", "backpack", "travel", "carry", "fashion", "purse", "tote"],
  shirt: ["shirt", "tee", "t-shirt", "tshirt", "polo"],
  dress: ["dress", "gown", "frock"],
  perfume: ["perfume", "fragrance", "cologne", "scent"],
};

export function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
}

function tokenizeFileName(fileName: string): string[] {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base
    .split(/[\s_\-–—+.]+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
}

function pickKeywordFromHints(fileName: string, imageHint: string): string {
  const blob = `${fileName} ${imageHint}`.toLowerCase();
  const tokens = new Set([...tokenizeFileName(fileName), ...blob.split(/[^a-z0-9]+/i)]);

  for (const [category, hints] of Object.entries(CATEGORY_HINTS)) {
    for (const hint of hints) {
      if (tokens.has(hint) || blob.includes(hint)) {
        return category;
      }
    }
  }

  const ordered = Object.entries(CATEGORY_HINTS);
  for (const token of tokens) {
    for (const [category, hints] of ordered) {
      if (hints.some((hint) => token.includes(hint) || hint.includes(token))) {
        return category;
      }
    }
  }

  const fallback = [
    "jacket",
    "phone",
    "laptop",
    "watch",
    "camera",
    "shoe",
    "bag",
    "headphone",
    "shirt",
    "dress",
  ];
  return fallback[hashSeed(blob) % fallback.length];
}

export async function detectKeywordFromImage(input: DetectionInput): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const keyword = pickKeywordFromHints(input.fileName, input.imageDataUrl.slice(0, 120));
  console.log("[AURA] detectKeywordFromImage", {
    fileName: input.fileName,
    keyword,
  });
  return keyword;
}

type UnknownRecord = Record<string, unknown>;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("http") ? value : undefined;
}

/**
 * Map common API shapes: thumbnail, images[], image, image_url.
 */
export function pickImageFromRaw(raw: UnknownRecord): string {
  const thumb = readString(raw.thumbnail);
  if (thumb) return thumb;

  const images = raw.images;
  if (Array.isArray(images)) {
    const first = images.find((item): item is string => typeof item === "string" && item.startsWith("http"));
    if (first) return first;
  }

  const direct =
    readString(raw.image) ?? readString(raw.image_url) ?? readString(raw.thumbnail_url) ?? readString(raw.url);
  if (direct) return direct;

  return FALLBACK_PRODUCT_IMAGE;
}

function normalizePrice(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }
  return 0;
}

type DummyProduct = {
  id: number;
  title: string;
  price: number;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  images?: string[];
};

function productText(p: DummyProduct): string {
  return `${p.title} ${p.description ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
}

function matchesKeywordForDummy(p: DummyProduct, keyword: string): boolean {
  const synonyms = new Set([keyword, ...(CATEGORY_HINTS[keyword] ?? [])]);
  const text = productText(p);
  return [...synonyms].some((word) => word.length > 0 && text.includes(word));
}

function mapDummyProduct(p: DummyProduct): Product {
  const raw = p as unknown as UnknownRecord;
  const image = pickImageFromRaw(raw);
  return {
    id: `dummyjson-${p.id}`,
    title: p.title,
    image,
    price: normalizePrice(p.price),
    link: `${DUMMYJSON_BASE}/products/${p.id}`,
  };
}

type OpenverseResult = {
  title?: string;
  url?: string;
  foreign_landing_url?: string;
  tags?: { name?: string }[];
};

function openverseItemText(item: OpenverseResult): string {
  const tagPart = (item.tags ?? []).map((tag) => tag?.name ?? "").join(" ");
  return `${item.title ?? ""} ${tagPart}`.toLowerCase();
}

function openverseMatchesCategory(item: OpenverseResult, keyword: string): boolean {
  const synonyms = CATEGORY_HINTS[keyword] ?? [keyword];
  const text = openverseItemText(item);
  return synonyms.some((word) => word.length > 0 && text.includes(word));
}

function mapOpenverseToProduct(item: OpenverseResult, index: number, keyword: string): Product {
  const raw = item as unknown as UnknownRecord;
  const image = pickImageFromRaw({ ...raw, thumbnail: raw.url, images: raw.images });
  const title =
    typeof item.title === "string" && item.title.trim().length > 0
      ? item.title.trim()
      : `${keyword[0].toUpperCase()}${keyword.slice(1)} match ${index + 1}`;
  const link =
    typeof item.foreign_landing_url === "string" && item.foreign_landing_url.startsWith("http")
      ? item.foreign_landing_url
      : `https://www.google.com/search?q=${encodeURIComponent(`${keyword} ${title}`)}`;

  const price = Number((19 + (hashSeed(`${keyword}-${title}-${index}`) % 180) + 0.99).toFixed(2));

  return {
    id: `openverse-${hashSeed(`${keyword}-${title}-${index}`)}`,
    title,
    image,
    price,
    link,
  };
}

async function fetchDummyCategory(keyword: string, slug: string): Promise<DummyProduct[]> {
  const url = `${DUMMYJSON_BASE}/products/category/${encodeURIComponent(slug)}?limit=50`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DummyJSON category failed: ${response.status}`);
  }
  const payload = (await response.json()) as { products?: DummyProduct[] };
  console.log("[AURA] DummyJSON category response", { keyword, slug, payload });
  return payload.products ?? [];
}

async function fetchDummySearch(query: string): Promise<DummyProduct[]> {
  const url = `${DUMMYJSON_BASE}/products/search?q=${encodeURIComponent(query)}&limit=30`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DummyJSON search failed: ${response.status}`);
  }
  const payload = (await response.json()) as { products?: DummyProduct[] };
  console.log("[AURA] DummyJSON search response", { query, payload });
  return payload.products ?? [];
}

async function fetchOpenverseImages(keyword: string, pageSeed: number): Promise<OpenverseResult[]> {
  const page = 1 + (pageSeed % 8);
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keyword)}&page=${page}&page_size=20`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Openverse failed: ${response.status}`);
  }
  const payload = (await response.json()) as { results?: OpenverseResult[] };
  console.log("[AURA] Openverse API response", { keyword, page, payload });
  return payload.results ?? [];
}

function buildSyntheticProducts(keyword: string, pageSeed: number): Product[] {
  const seed = hashSeed(`${keyword}-${pageSeed}`);
  return Array.from({ length: 6 }, (_, index) => {
    const variant = ["Pro", "Lite", "Max", "Prime", "Ultra", "Plus"][(seed + index) % 6];
    const title = `${keyword[0].toUpperCase()}${keyword.slice(1)} ${variant} ${index + 1}`;
    return {
      id: `fallback-${keyword}-${seed}-${index}`,
      title,
      image: `${FALLBACK_PRODUCT_IMAGE}&sig=${seed + index}`,
      price: Number((29 + ((seed + index * 17) % 220) + 0.49).toFixed(2)),
      link: `https://www.google.com/search?q=${encodeURIComponent(`${keyword} ${title}`)}`,
    };
  });
}

export type FetchProductsOptions = {
  /** Varies pagination / result mix so different uploads yield different rows. */
  pageSeed?: number;
};

export async function fetchProductsByKeyword(keyword: string, options: FetchProductsOptions = {}): Promise<Product[]> {
  const normalized = keyword.trim().toLowerCase();
  const pageSeed = options.pageSeed ?? 0;

  console.log("[AURA] fetchProductsByKeyword start", { keyword: normalized, pageSeed });

  try {
    if (OPENVERSE_FIRST_KEYWORDS.has(normalized)) {
      try {
        const results = await fetchOpenverseImages(normalized, pageSeed);
        const filtered = results.filter((item) => openverseMatchesCategory(item, normalized));
        const pool = filtered.length > 0 ? filtered : results;
        const mapped = pool
          .map((item, index) => mapOpenverseToProduct(item, index, normalized))
          .slice(0, 12);

        console.log("[AURA] mapped Openverse products", mapped);
        if (mapped.length > 0) {
          return dedupeProducts(mapped);
        }
      } catch (error) {
        console.warn("[AURA] Openverse primary fetch failed; falling back to catalog search.", error);
      }
    }

    const categorySlug = KEYWORD_TO_DUMMY_CATEGORY[normalized];
    if (categorySlug) {
      try {
        const products = await fetchDummyCategory(normalized, categorySlug);
        const filtered = products.filter((product) => matchesKeywordForDummy(product, normalized));
        const pool = filtered.length > 0 ? filtered : products;
        const mapped = pool.map(mapDummyProduct).slice(0, 12);
        console.log("[AURA] mapped DummyJSON category products", mapped);
        if (mapped.length > 0) {
          return dedupeProducts(mapped);
        }
      } catch (error) {
        console.warn("[AURA] DummyJSON category fetch failed; continuing.", error);
      }
    }

    try {
      const searchProducts = await fetchDummySearch(normalized);
      const filteredSearch = searchProducts.filter((product) => matchesKeywordForDummy(product, normalized));
      const pool = filteredSearch.length > 0 ? filteredSearch : searchProducts;
      const mappedSearch = pool.map(mapDummyProduct).slice(0, 12);
      console.log("[AURA] mapped DummyJSON search products", mappedSearch);
      if (mappedSearch.length > 0) {
        return dedupeProducts(mappedSearch);
      }
    } catch (error) {
      console.warn("[AURA] DummyJSON search failed; trying Openverse fallback.", error);
    }

    try {
      const openverseFallback = await fetchOpenverseImages(normalized, pageSeed);
      const mappedOpenverse = openverseFallback
        .map((item, index) => mapOpenverseToProduct(item, index, normalized))
        .slice(0, 12);
      console.log("[AURA] mapped Openverse fallback products", mappedOpenverse);
      if (mappedOpenverse.length > 0) {
        return dedupeProducts(mappedOpenverse);
      }
    } catch (error) {
      console.warn("[AURA] Openverse fallback fetch failed.", error);
    }
  } catch (error) {
    console.error("[AURA] fetchProductsByKeyword error", error);
  }

  const synthetic = buildSyntheticProducts(normalized, pageSeed);
  console.log("[AURA] synthetic fallback products", synthetic);
  return synthetic;
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}
