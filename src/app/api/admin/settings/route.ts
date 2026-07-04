import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemSetting from "@/models/SystemSetting";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/settings - retrieve public configuration values
export async function GET() {
  try {
    await connectDB();
    const settings = await SystemSetting.find({});

    // Default fallback values (commission % stored as string "0.50" means 0.50%)
    const config: Record<string, string> = {
      activationPrice: "500",
      qrCodeUrl: "",
      commissionLevel1: "0.50",
      commissionLevel2to5: "0.20",
      commissionLevel6to10: "0.15",
      commissionLevel11to20: "0.10",
      manualGoldPrice22K: "",
      enableGoldPriceOverride: "false",
    };

    settings.forEach((s) => {
      config[s.key] = s.value;
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

// POST /api/admin/settings - update system settings (Admin only)
export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();

    const upsertKey = async (key: string, value: string | undefined) => {
      if (value !== undefined) {
        await SystemSetting.findOneAndUpdate(
          { key },
          { value: String(value) },
          { upsert: true, new: true }
        );
      }
    };

    await upsertKey("activationPrice", body.activationPrice);
    await upsertKey("qrCodeUrl", body.qrCodeUrl);
    await upsertKey("commissionLevel1", body.commissionLevel1);
    await upsertKey("commissionLevel2to5", body.commissionLevel2to5);
    await upsertKey("commissionLevel6to10", body.commissionLevel6to10);
    await upsertKey("commissionLevel11to20", body.commissionLevel11to20);
    await upsertKey("manualGoldPrice22K", body.manualGoldPrice22K);
    await upsertKey("enableGoldPriceOverride", body.enableGoldPriceOverride);

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
