import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Purchase from "@/models/Purchase";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// GET /api/packages - get active and pending package purchases for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();
    const purchases = await Purchase.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("GET packages error:", error);
    return NextResponse.json({ error: "Failed to get packages" }, { status: 500 });
  }
}

// POST /api/packages - submit package purchase request
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.status === "PendingActivation") {
      return NextResponse.json(
        { error: "Please activate your account before purchasing packages." },
        { status: 403 }
      );
    }

    const { type, amount, screenshotUrl, transactionId, goldPrice, karat, city } = await request.json();
    const numAmount = Number(amount);

    if (!type || !numAmount || !screenshotUrl || !transactionId) {
      return NextResponse.json(
        { error: "Type, amount, payment screenshot, and transaction ID are required." },
        { status: 400 }
      );
    }

    let monthlyReturnRate = 0;
    let redemptionLimit = 0;
    
    // GST (3% on Gold jewelry/bullion)
    let taxableAmount = numAmount;
    let gstAmount = 0;
    let goldPriceVal = Number(goldPrice);
    let goldWeight = 0;

    if (type === "Gold") {
      if (numAmount < 10000) {
        return NextResponse.json({ error: "Gold packages start at ₹10,000 onwards." }, { status: 400 });
      }
      redemptionLimit = 0.60;
      if (numAmount < 500000) {
        monthlyReturnRate = 0.025; // 2.5%
      } else if (numAmount < 2000000) {
        monthlyReturnRate = 0.030; // 3%
      } else {
        monthlyReturnRate = 0.035; // 3.5%
      }

      // GST calculations (3% GST inclusive)
      taxableAmount = Number((numAmount / 1.03).toFixed(2));
      gstAmount = Number((numAmount - taxableAmount).toFixed(2));

      // Calculate weight based on active gold price
      if (!goldPriceVal || goldPriceVal <= 0) {
        // Fallback gold price: ₹7,350/g
        goldPriceVal = 7350;
      }
      goldWeight = Number((taxableAmount / goldPriceVal).toFixed(3));

    } else if (type === "Land") {
      if (numAmount < 100000) {
        return NextResponse.json({ error: "Land booking packages start at ₹1,00,000 onwards." }, { status: 400 });
      }
      if (numAmount < 500000) {
        monthlyReturnRate = 0.040; // 4%
        redemptionLimit = 0.24; // 24%
      } else {
        monthlyReturnRate = 0.060; // 6%
        redemptionLimit = 0.36; // 36%
      }
    } else {
      return NextResponse.json({ error: "Invalid package type." }, { status: 400 });
    }

    const purchase = await Purchase.create({
      userId: user._id,
      type,
      amount: numAmount,
      status: "Pending",
      screenshotUrl,
      transactionId,
      monthlyReturnRate,
      redemptionLimit,
      goldPriceAtPurchase: type === "Gold" ? goldPriceVal : undefined,
      goldWeightGrams: type === "Gold" ? goldWeight : undefined,
      gstAmount: type === "Gold" ? gstAmount : undefined,
      taxableAmount: type === "Gold" ? taxableAmount : undefined,
      karat: type === "Gold" ? (karat || "24K") : undefined,
      city: type === "Gold" ? (city || "Kolkata") : undefined,
    });

    return NextResponse.json({
      message: "Package booking submitted successfully for verification!",
      purchase,
    });
  } catch (error) {
    console.error("POST package error:", error);
    return NextResponse.json({ error: "Failed to submit package" }, { status: 500 });
  }
}
