import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/transactions - retrieve pending deposits & withdrawals
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    // Explicit reference to register User model schema
    const _register = User.modelName;

    const transactions = await Transaction.find({ type: { $in: ["Deposit", "Withdrawal"] } })
      .populate("userId", "name email phone referralCode walletBalance")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("GET admin transactions error:", error);
    return NextResponse.json({ error: "Failed to get transactions" }, { status: 500 });
  }
}

// POST /api/admin/transactions - Approve/Reject a transaction
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId, action } = await request.json(); // action: "Approve" | "Reject"
    if (!transactionId || !action) {
      return NextResponse.json({ error: "Transaction ID and action are required." }, { status: 400 });
    }

    await connectDB();
    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    if (tx.status !== "Pending") {
      return NextResponse.json({ error: "Transaction already processed." }, { status: 400 });
    }

    const client = await User.findById(tx.userId);
    if (!client) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (action === "Approve") {
      tx.status = "Success";
      await tx.save();

      // If it was a Deposit, we credit the user's wallet now
      if (tx.type === "Deposit") {
        client.walletBalance += tx.amount;
        await client.save();
      }

      return NextResponse.json({ message: "Transaction approved successfully." });
    } else if (action === "Reject") {
      tx.status = "Failed";
      await tx.save();

      // If it was a Withdrawal, refund the money back to the user
      if (tx.type === "Withdrawal") {
        client.walletBalance += tx.amount;
        await client.save();
      }

      return NextResponse.json({ message: "Transaction rejected and refunded." });
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
  } catch (error) {
    console.error("POST admin transaction error:", error);
    return NextResponse.json({ error: "Failed to process transaction." }, { status: 500 });
  }
}
