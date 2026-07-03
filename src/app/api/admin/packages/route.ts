import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Purchase from "@/models/Purchase";
import Transaction from "@/models/Transaction";
import SystemSetting from "@/models/SystemSetting";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/packages - retrieve all packages for admin approval
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // Explicit reference to register User model schema
    const _register = User.modelName;

    const purchases = await Purchase.find({})
      .populate("userId", "name email phone referralCode status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET admin packages error:", error);
    return NextResponse.json({ error: "Failed to get packages" }, { status: 500 });
  }
}

function calculateRank(volume: number): string {
  // Volume scale: 1 Lc = 100,000; 1 Cr = 10,000,000
  if (volume >= 10000000000) return "Ambassador"; // 1000Cr
  if (volume >= 5000000000) return "Crown Diamond"; // 500Cr
  if (volume >= 2500000000) return "Crown"; // 250Cr
  if (volume >= 1000000000) return "Black Diamond"; // 100Cr
  if (volume >= 500000000) return "Blue Diamond"; // 50Cr
  if (volume >= 250000000) return "Diamond"; // 25Cr
  if (volume >= 100000000) return "Emerald"; // 10Cr
  if (volume >= 50000000) return "Sapphire"; // 5Cr
  if (volume >= 30000000) return "Ruby"; // 3Cr
  if (volume >= 10000000) return "Platinum"; // 1Cr
  if (volume >= 5000000) return "Gold"; // 50Lc
  if (volume >= 2500000) return "Silver"; // 25Lc
  if (volume >= 1000000) return "Bronze"; // 10Lc
  if (volume >= 500000) return "Star"; // 5Lc
  if (volume >= 200000) return "Adviser"; // 2Lc
  return "Adviser";
}

// POST /api/admin/packages - approve or reject a package purchase
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { purchaseId, action } = await request.json(); // action: "Approve" | "Reject"
    if (!purchaseId || !action) {
      return NextResponse.json({ error: "Purchase ID and action are required." }, { status: 400 });
    }

    await connectDB();
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase record not found." }, { status: 404 });
    }

    if (purchase.status !== "Pending") {
      return NextResponse.json({ error: "Purchase has already been processed." }, { status: 400 });
    }

    if (action === "Reject") {
      purchase.status = "Rejected";
      await purchase.save();
      return NextResponse.json({ message: "Purchase request successfully rejected." });
    }

    if (action !== "Approve") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    // Process approval
    const buyer = await User.findById(purchase.userId);
    if (!buyer) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    purchase.status = "Approved";
    purchase.approvedAt = new Date();
    await purchase.save();

    // Log the purchase purchase debit transaction
    await Transaction.create({
      userId: buyer._id,
      type: "Purchase",
      amount: purchase.amount,
      description: `${purchase.type} Package Purchase Approved`,
      status: "Success",
    });

    // Fetch custom commission rates from settings (default to system values if not customized)
    const systemSettings = await SystemSetting.find({
      key: { $in: ["commissionLevel1", "commissionLevel2to5", "commissionLevel6to10", "commissionLevel11to20"] }
    });
    const configRates = {
      l1: 0.50,
      l2to5: 0.20,
      l6to10: 0.15,
      l11to20: 0.10,
    };
    systemSettings.forEach((setting) => {
      const val = parseFloat(setting.value);
      if (!isNaN(val)) {
        if (setting.key === "commissionLevel1") configRates.l1 = val;
        else if (setting.key === "commissionLevel2to5") configRates.l2to5 = val;
        else if (setting.key === "commissionLevel6to10") configRates.l6to10 = val;
        else if (setting.key === "commissionLevel11to20") configRates.l11to20 = val;
      }
    });

    // ── MLM Upline commission distribution (20 Levels) ──
    let currentReferredBy = buyer.referredBy;
    let currentLevel = 1;
    let downlineUser = buyer;

    while (currentReferredBy && currentLevel <= 20) {
      const upline = await User.findOne({ referralCode: currentReferredBy.toUpperCase() });
      if (!upline) break;

      // Calculate directs of this upline to verify level unlocks
      const directCount = await User.countDocuments({ referredBy: upline.referralCode });
      let unlockedLimit = 0;
      if (directCount >= 7) unlockedLimit = 20;
      else if (directCount === 6) unlockedLimit = 17;
      else if (directCount === 5) unlockedLimit = 14;
      else if (directCount === 4) unlockedLimit = 11;
      else if (directCount === 3) unlockedLimit = 8;
      else if (directCount === 2) unlockedLimit = 5;
      else if (directCount === 1) unlockedLimit = 2;

      // If level is unlocked, award commission
      if (currentLevel <= unlockedLimit) {
        let pct = 0;
        if (currentLevel === 1) pct = configRates.l1 / 100;
        else if (currentLevel <= 5) pct = configRates.l2to5 / 100;
        else if (currentLevel <= 10) pct = configRates.l6to10 / 100;
        else if (currentLevel <= 20) pct = configRates.l11to20 / 100;

        const commAmount = purchase.amount * pct;
        if (commAmount > 0) {
          upline.walletBalance += commAmount;
          await Transaction.create({
            userId: upline._id,
            type: "Commission",
            amount: commAmount,
            description: `Level ${currentLevel} Team Sales Commission from ${buyer.name} (${purchase.type} Purchase)`,
            status: "Success",
          });
        }
      }

      // Add to team sales volume and update rank
      upline.teamSalesVolume += purchase.amount;
      upline.currentRank = calculateRank(upline.teamSalesVolume);
      await upline.save();

      // Recurse upline
      currentReferredBy = upline.referredBy;
      currentLevel++;
    }

    return NextResponse.json({ message: "Purchase approved and MLM commissions allocated!" });
  } catch (error) {
    console.error("POST admin packages error:", error);
    return NextResponse.json({ error: "Failed to process package approval." }, { status: 500 });
  }
}
