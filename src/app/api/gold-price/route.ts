import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemSetting from "@/models/SystemSetting";

/**
 * GET /api/gold-price
 *
 * Returns live gold spot prices (per gram, in INR) for 24K, 22K, 21K, 20K, 18K
 * across 4 Indian cities (Kolkata, Mumbai, Delhi, Chennai).
 *
 * Data Source: Scraped from GoodReturns (https://www.goodreturns.in/gold-rates/kolkata.html)
 *   • Cache: 5 min (avoids excessive requests)
 *   • Fallback: realistic MCX-style simulation
 *   • Admin override support daily.
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
  gram18k: number,
  isLive: boolean,
  isOverride = false,
  rawResponse?: any
): {
  isLive: boolean;
  isOverride: boolean;
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
      "18K": Math.round(gram18k + spread * (18 / 24)),
    };
  }

  let sourceStr = "Simulated fallback (MCX-style)";
  if (isOverride) {
    sourceStr = "Admin Custom Price";
  } else if (isLive) {
    sourceStr = "GoodReturns (scraped live)";
  }

  return {
    isLive,
    isOverride,
    source: sourceStr,
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
  const gram18k = Math.round(gram24k * (18 / 24));
  return buildPayload(gram24k, gram22k, gram18k, false);
}

async function fetchFromGoodReturns() {
  // Serve from cache if still fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.payload;
  }

  try {
    const res = await fetch("https://www.goodreturns.in/gold-rates/kolkata.html", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`[gold-price] GoodReturns responded ${res.status}`);
      return null;
    }

    const html = await res.text();

    const regex24 = /id=["']24K-price["'][^>]*>(?:&#x20b9;|₹)?\s*([\d,]+)/i;
    const regex22 = /id=["']22K-price["'][^>]*>(?:&#x20b9;|₹)?\s*([\d,]+)/i;
    const regex18 = /id=["']18K-price["'][^>]*>(?:&#x20b9;|₹)?\s*([\d,]+)/i;

    const m24 = html.match(regex24);
    const m22 = html.match(regex22);
    const m18 = html.match(regex18);

    if (!m24 || !m22 || !m18) {
      console.error("[gold-price] Scraping failed to find all prices on GoodReturns page");
      return null;
    }

    const gram24k = parseFloat(m24[1].replace(/,/g, ""));
    const gram22k = parseFloat(m22[1].replace(/,/g, ""));
    const gram18k = parseFloat(m18[1].replace(/,/g, ""));

    if (isNaN(gram24k) || isNaN(gram22k) || isNaN(gram18k)) {
      console.error("[gold-price] Scraped price parses to NaN");
      return null;
    }

    const payload = buildPayload(gram24k, gram22k, gram18k, true, false, {
      scraped_24k: gram24k,
      scraped_22k: gram22k,
      scraped_18k: gram18k,
    });

    // Update server-side cache
    cache = { payload, ts: Date.now() };
    return payload;
  } catch (err) {
    console.error("[gold-price] GoodReturns scrape failed:", err);
    return null;
  }
}

/**
 * Resolves the current gold price for a specific city and karat on the server side.
 * Safely handles admin overrides, live scraping, and simulation fallbacks.
 */
export async function getGoldPriceFor(city: string, karat: string): Promise<number> {
  try {
    await connectDB();
    const settings = await SystemSetting.find({});
    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    if (config.enableGoldPriceOverride === "true" && config.manualGoldPrice22K) {
      const override22k = parseFloat(config.manualGoldPrice22K);
      if (!isNaN(override22k) && override22k > 0) {
        const override24k = Math.round(override22k * 24 / 22);
        const override18k = Math.round(override22k * 18 / 22);

        const spread = CITY_SPREAD[city] ?? 0;
        const prices: Record<string, number> = {
          "24K": Math.round(override24k + spread),
          "22K": Math.round(override22k + spread * (22 / 24)),
          "21K": Math.round(override24k * KARAT_FACTOR["21K"] + spread * (21 / 24)),
          "20K": Math.round(override24k * KARAT_FACTOR["20K"] + spread * (20 / 24)),
          "18K": Math.round(override18k + spread * (18 / 24)),
        };

        return prices[karat] ?? prices["24K"] ?? 7350;
      }
    }
  } catch (err) {
    console.error("[getGoldPriceFor] DB error reading settings, falling back to live/sim:", err);
  }

  // Fallback to live scrape
  const liveData = await fetchFromGoodReturns();
  if (liveData) {
    const cityPrices = liveData.prices[city] ?? liveData.prices["Kolkata"];
    return cityPrices[karat] ?? cityPrices["24K"] ?? 7350;
  }

  // Fallback to simulation
  const sim = simulatedPrices();
  const cityPrices = sim.prices[city] ?? sim.prices["Kolkata"];
  return cityPrices[karat] ?? cityPrices["24K"] ?? 7350;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const settings = await SystemSetting.find({});
    const config: Record<string, string> = {};
    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    if (config.enableGoldPriceOverride === "true" && config.manualGoldPrice22K) {
      const override22k = parseFloat(config.manualGoldPrice22K);
      if (!isNaN(override22k) && override22k > 0) {
        const override24k = Math.round(override22k * 24 / 22);
        const override18k = Math.round(override22k * 18 / 22);

        const payload = buildPayload(override24k, override22k, override18k, true, true, {
          manual_override: true,
          scraped_22k: override22k,
        });

        return NextResponse.json({ success: true, ...payload }, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          },
        });
      }
    }
  } catch (err) {
    console.error("[GET /api/gold-price] Error reading settings override:", err);
  }

  const result = (await fetchFromGoodReturns()) ?? simulatedPrices();

  return NextResponse.json({ success: true, ...result }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
