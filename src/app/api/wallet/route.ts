import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// GET /api/wallet - Get user balance and transaction history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();
    const user = await User.findById(decoded.userId, { walletBalance: 1 });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const transactions = await Transaction.find({ userId: decoded.userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      walletBalance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    console.error("GET wallet error:", error);
    return NextResponse.json({ error: "Failed to get wallet details" }, { status: 500 });
  }
}

// POST /api/wallet - Submit a deposit request or withdrawal request
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    const { type, amount, details } = await request.json(); // type: "Deposit" | "Withdrawal"
    const numAmount = Number(amount);

    if (!type || !numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Invalid type or amount." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (type === "Withdrawal") {
      if (numAmount < 1000) {
        return NextResponse.json({ error: "Minimum withdrawal limit is ₹1,000." }, { status: 400 });
      }
      if (user.walletBalance < numAmount) {
        return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
      }

      // Deduct immediately and create pending transaction log
      user.walletBalance -= numAmount;
      await user.save();

      const tx = await Transaction.create({
        userId: user._id,
        type: "Withdrawal",
        amount: numAmount,
        description: `Withdrawal request to bank: ${details || "Bank Transfer"}`,
        status: "Pending",
      });

      return NextResponse.json({
        message: "Withdrawal request submitted successfully and is pending admin approval.",
        walletBalance: user.walletBalance,
        transaction: tx,
      });
    } else if (type === "Deposit") {
      const tx = await Transaction.create({
        userId: user._id,
        type: "Deposit",
        amount: numAmount,
        description: `Deposit request via: ${details || "UPI"}`,
        status: "Pending",
      });

      return NextResponse.json({
        message: "Deposit receipt submitted and is pending verification.",
        transaction: tx,
      });
    } else {
      return NextResponse.json({ error: "Invalid transaction request type." }, { status: 400 });
    }
  } catch (error) {
    console.error("POST transaction error:", error);
    return NextResponse.json({ error: "Failed to submit transaction." }, { status: 500 });
  }
}
