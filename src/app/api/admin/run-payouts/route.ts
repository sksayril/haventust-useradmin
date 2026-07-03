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

function getSalaryForRank(rank: string): number {
  switch (rank) {
    case "Ambassador": return 10000000;
    case "Crown Diamond": return 5000000;
    case "Crown": return 2500000;
    case "Black Diamond": return 1000000;
    case "Blue Diamond": return 500000;
    case "Diamond": return 300000;
    case "Emerald": return 200000;
    case "Sapphire": return 100000;
    case "Ruby": return 50000;
    case "Platinum": return 25000;
    case "Gold": return 15000;
    case "Silver": return 7500;
    case "Bronze": return 3000;
    case "Star": return 2000;
    case "Adviser": return 1000;
    default: return 0;
  }
}

/** Load commission rates from DB (as decimal fraction e.g. 0.005 = 0.50%) */
async function loadCommissionRates(): Promise<{
  level1: number;
  level2to5: number;
  level6to10: number;
  level11to20: number;
}> {
  const keys = ["commissionLevel1", "commissionLevel2to5", "commissionLevel6to10", "commissionLevel11to20"];
  const rows = await SystemSetting.find({ key: { $in: keys } });
  const map: Record<string, number> = {
    commissionLevel1: 0.50,
    commissionLevel2to5: 0.20,
    commissionLevel6to10: 0.15,
    commissionLevel11to20: 0.10,
  };
  rows.forEach((r) => {
    map[r.key] = parseFloat(r.value);
  });
  return {
    level1: map.commissionLevel1 / 100,
    level2to5: map.commissionLevel2to5 / 100,
    level6to10: map.commissionLevel6to10 / 100,
    level11to20: map.commissionLevel11to20 / 100,
  };
}

function getCommissionRate(
  level: number,
  rates: { level1: number; level2to5: number; level6to10: number; level11to20: number }
): number {
  if (level === 1) return rates.level1;
  if (level <= 5) return rates.level2to5;
  if (level <= 10) return rates.level6to10;
  if (level <= 20) return rates.level11to20;
  return 0;
}

// POST /api/admin/run-payouts - Trigger monthly calculations and distribute funds
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // Force model registration
    const _r1 = User.modelName;
    const _r2 = Transaction.modelName;
    const _r3 = Purchase.modelName;
    const _r4 = SystemSetting.modelName;
    void _r1; void _r2; void _r3; void _r4;

    const commissionRates = await loadCommissionRates();

    let returnsPaidCount = 0;
    let salariesPaidCount = 0;
    let commissionsPaidCount = 0;
    let totalReturnsDistributed = 0;
    let totalSalariesDistributed = 0;
    let totalCommissionsDistributed = 0;

    // 1. Process Monthly returns for Gold & Land
    const activePurchases = await Purchase.find({ status: "Approved" });
    for (const purchase of activePurchases) {
      const targetLimit = purchase.redemptionLimit * purchase.amount;
      if (purchase.redeemedSoFar >= targetLimit) continue;

      const rawPay = purchase.amount * purchase.monthlyReturnRate;
      const remainingLimit = targetLimit - purchase.redeemedSoFar;
      const payAmount = Math.min(rawPay, remainingLimit);

      if (payAmount > 0) {
        const buyer = await User.findById(purchase.userId);
        if (buyer) {
          buyer.walletBalance += payAmount;
          await buyer.save();

          purchase.redeemedSoFar += payAmount;
          purchase.monthsPaid += 1;
          await purchase.save();

          await Transaction.create({
            userId: buyer._id,
            type: "MonthlyReturn",
            amount: payAmount,
            description: `Monthly Return #${purchase.monthsPaid} for ${purchase.type} Package of ₹${purchase.amount.toLocaleString("en-IN")}`,
            status: "Success",
          });

          returnsPaidCount++;
          totalReturnsDistributed += payAmount;

          // 2. Distribute Team Sales Bonus Commissions to upline (levels 1–20)
          let currentCode = buyer.referredBy;
          let level = 1;
          while (currentCode && level <= 20) {
            const upline = await User.findOne({ referralCode: currentCode, status: "Active" });
            if (!upline) break;

            const rate = getCommissionRate(level, commissionRates);
            const commAmt = Math.round(payAmount * rate * 100) / 100;

            if (commAmt > 0) {
              upline.walletBalance += commAmt;
              // Track team sales volume on upline
              upline.teamSalesVolume = (upline.teamSalesVolume || 0) + purchase.amount;
              await upline.save();

              await Transaction.create({
                userId: upline._id,
                type: "Commission",
                amount: commAmt,
                description: `Level ${level} Team Bonus Commission from ${buyer.name} (${(rate * 100).toFixed(2)}% of ₹${payAmount.toLocaleString("en-IN")})`,
                status: "Success",
              });

              commissionsPaidCount++;
              totalCommissionsDistributed += commAmt;
            }

            currentCode = upline.referredBy;
            level++;
          }
        }
      }
    }

    // 3. Process Monthly salaries based on current rank
    const activeUsers = await User.find({ status: "Active" });
    for (const u of activeUsers) {
      const salary = getSalaryForRank(u.currentRank);
      if (salary > 0) {
        u.walletBalance += salary;
        await u.save();

        await Transaction.create({
          userId: u._id,
          type: "Salary",
          amount: salary,
          description: `Monthly Salary Credit for Rank: ${u.currentRank}`,
          status: "Success",
        });

        salariesPaidCount++;
        totalSalariesDistributed += salary;
      }
    }

    return NextResponse.json({
      message: "Payout cycle executed successfully!",
      stats: {
        returnsPaidCount,
        totalReturnsDistributed,
        commissionsPaidCount,
        totalCommissionsDistributed,
        salariesPaidCount,
        totalSalariesDistributed,
      },
    });
  } catch (error) {
    console.error("Payout cycle failed:", error);
    return NextResponse.json({ error: "Failed to run payout process." }, { status: 500 });
  }
}
