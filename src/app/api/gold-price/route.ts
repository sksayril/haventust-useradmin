import { NextResponse } from "next/server";

/**
 * GET /api/gold-price
 *
 * Returns live gold spot prices (per gram, in INR) for 24K, 22K, 21K, 20K, 18K
 * across 4 Indian cities (Kolkata, Mumbai, Delhi, Chennai).
 *
 * Data Source: GoldAPI.io  →  https://www.goldapi.io/api/XAU/INR
 *   • Uses `price_gram_24k`, `price_gram_22k` etc. fields from the response
 *     (already expressed in grams, no troy-ounce conversion needed)
 *   • API key: GOLD_API_KEY in .env.local
 *   • Cache: 5 min (avoids burning the free-tier 100 calls/day limit)
 *   • Fallback: realistic MCX-style simulation when no key is present
 */

// Indian city price spreads vs Kolkata base (in ₹/gram)
const CITY_SPREAD: Record<string, number> = {
  Kolkata: 0,
  Mumbai:  +8,
  Delhi:   +22,
  Chennai: -12,
};

// Purity correction vs 24K per gram price
const KARAT_FACTOR: Record<string, number> = {
  "24K": 1,
  "22K": 22 / 24,
  "21K": 21 / 24,
  "20K": 20 / 24,
  "18K": 18 / 24,
};

// In-memory cache (server-side)
let cache: { payload: ReturnType<typeof buildPayload>; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type PriceMap = Record<string, Record<string, number>>; // city → karat → ₹

function buildPayload(
  gram24k: number,
  gram22k: number,
  isLive: boolean,
  rawResponse?: any
): {
  isLive: boolean;
  source: string;
  rawRate?: any;
  prices: PriceMap;
  timestamp: string;
} {
  const prices: PriceMap = {};

  for (const [city, spread] of Object.entries(CITY_SPREAD)) {
    prices[city] = {
      "24K": Math.round(gram24k + spread),
      "22K": Math.round(gram22k + spread * (22 / 24)),
      "21K": Math.round(gram24k * KARAT_FACTOR["21K"] + spread * (21 / 24)),
      "20K": Math.round(gram24k * KARAT_FACTOR["20K"] + spread * (20 / 24)),
      "18K": Math.round(gram24k * KARAT_FACTOR["18K"] + spread * (18 / 24)),
    };
  }

  return {
    isLive,
    source: isLive ? "GoldAPI.io (live XAU/INR)" : "Simulated fallback (MCX-style)",
    rawRate: rawResponse ?? undefined,
    prices,
    timestamp: new Date().toISOString(),
  };
}

function simulatedPrices() {
  // Fluctuate around realistic MCX mid-2026 base: 24K ≈ ₹7,350/g
  const seed = new Date().getHours() * 60 + new Date().getMinutes();
  const fluc = Math.sin(seed / 60) * 18;
  const gram24k = Math.round(7350 + fluc);
  const gram22k = Math.round(gram24k * (22 / 24));
  return buildPayload(gram24k, gram22k, false);
}

async function fetchFromGoldAPI() {
  const apiKey = process.env.GOLD_API_KEY?.trim();
  if (!apiKey) return null;

  // Serve from cache if still fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.payload;
  }

  try {
    const res = await fetch("https://www.goldapi.io/api/XAU/INR", {
      headers: {
        "x-access-token": apiKey,
        "Content-Type": "application/json",
      },
      // Next.js fetch cache (server-side), revalidates every 5 min
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`[gold-price] GoldAPI responded ${res.status}`);
      return null;
    }

    const data = await res.json();

    // GoldAPI returns `price_gram_24k` and `price_gram_22k` in the requested currency (INR)
    const gram24k: number = data.price_gram_24k;
    const gram22k: number = data.price_gram_22k;

    if (!gram24k || !gram22k) return null;

    const payload = buildPayload(gram24k, gram22k, true, {
      price_gram_24k: gram24k,
      price_gram_22k: gram22k,
      price_per_oz: data.price,
      ch: data.ch,
      chp: data.chp,
      high: data.high_price,
      low: data.low_price,
    });

    // Update server-side cache
    cache = { payload, ts: Date.now() };
    return payload;
  } catch (err) {
    console.error("[gold-price] Fetch failed:", err);
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const result = (await fetchFromGoldAPI()) ?? simulatedPrices();

  return NextResponse.json({ success: true, ...result }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
