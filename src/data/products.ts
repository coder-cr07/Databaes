import { Product } from "@/types/product";

type DetectionInput = {
  fileName: string;
  imageDataUrl: string;
};

const categoryByKeyword: Record<string, string[]> = {
  headphone: ["headphones", "audio", "earbuds", "speaker", "music"],
  watch: ["watch", "wearable", "smartwatch", "fitness", "strap"],
  camera: ["camera", "lens", "gimbal", "tripod", "photography"],
  laptop: ["laptop", "keyboard", "monitor", "tech", "computer"],
  phone: ["phone", "smartphone", "mobile", "charger", "case"],
  shoe: ["shoe", "sneaker", "running", "sports", "footwear"],
  bag: ["bag", "backpack", "travel", "carry", "fashion"],
};

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
}

function pickKeyword(input: string): string {
  const lower = input.toLowerCase();
  const matches = Object.entries(categoryByKeyword).find(([, hints]) =>
    hints.some((hint) => lower.includes(hint)),
  );
  if (matches) {
    return matches[0];
  }
  const fallback = ["headphone", "watch", "camera", "laptop", "phone", "shoe", "bag"];
  return fallback[hashSeed(lower) % fallback.length];
}

export async function detectKeywordFromImage(input: DetectionInput): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return pickKeyword(`${input.fileName}-${input.imageDataUrl.slice(0, 96)}`);
}

export async function fetchProductsByKeyword(keyword: string): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const seed = hashSeed(keyword);
  const variants = ["Pro", "Lite", "Max", "Prime", "Ultra", "Plus"];

  return Array.from({ length: 6 }, (_, index) => {
    const priceSeed = (seed + index * 97) % 420;
    const price = Number((39 + priceSeed + (index % 2 === 0 ? 0.99 : 0.49)).toFixed(2));
    const variant = variants[(seed + index) % variants.length];
    const title = `${keyword[0].toUpperCase()}${keyword.slice(1)} ${variant} ${index + 1}`;

    return {
      id: `${keyword}-${seed}-${index}`,
      title,
      image: `https://images.unsplash.com/featured/?${encodeURIComponent(keyword)},product,${index + 1}`,
      price,
      link: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
    };
  });
}
