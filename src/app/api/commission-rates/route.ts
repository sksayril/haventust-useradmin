import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemSetting from "@/models/SystemSetting";

// GET /api/commission-rates - public endpoint for users to fetch current MLM commission rates
export async function GET() {
  try {
    await connectDB();
    const keys = ["commissionLevel1", "commissionLevel2to5", "commissionLevel6to10", "commissionLevel11to20"];
    const rows = await SystemSetting.find({ key: { $in: keys } });

    const defaults: Record<string, string> = {
      commissionLevel1: "0.50",
      commissionLevel2to5: "0.20",
      commissionLevel6to10: "0.15",
      commissionLevel11to20: "0.10",
    };

    rows.forEach((r) => {
      defaults[r.key] = r.value;
    });

    return NextResponse.json({
      levels: [
        { range: "Level 1", key: "commissionLevel1", percent: parseFloat(defaults.commissionLevel1) },
        { range: "Level 2–5", key: "commissionLevel2to5", percent: parseFloat(defaults.commissionLevel2to5) },
        { range: "Level 6–10", key: "commissionLevel6to10", percent: parseFloat(defaults.commissionLevel6to10) },
        { range: "Level 11–20", key: "commissionLevel11to20", percent: parseFloat(defaults.commissionLevel11to20) },
      ],
    });
  } catch (error) {
    console.error("commission-rates GET error:", error);
    return NextResponse.json({ error: "Failed to load commission rates" }, { status: 500 });
  }
}
