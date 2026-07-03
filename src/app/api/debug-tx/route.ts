import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const txs = await Transaction.find({}).populate("userId", "name email status").lean();
    const users = await User.find({ status: "PendingActivation" }).lean();
    return NextResponse.json({ transactions: txs, pendingActivationUsers: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
