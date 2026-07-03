import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

interface JWTPayload {
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();
    const { screenshotUrl, transactionId } = await request.json();

    if (!screenshotUrl || !transactionId) {
      return NextResponse.json(
        { error: "Screenshot and transaction ID are required." },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Save payment details on user
    user.paymentScreenshotUrl = screenshotUrl;
    user.paymentTransactionId = transactionId.trim();
    user.paymentSubmittedAt = new Date();
    await user.save();

    return NextResponse.json({
      message: "Payment details submitted successfully!",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        profilePicUrl: user.profilePicUrl,
        walletBalance: user.walletBalance,
        status: user.status,
        paymentScreenshotUrl: user.paymentScreenshotUrl,
        paymentTransactionId: user.paymentTransactionId,
      }
    });
  } catch (error) {
    console.error("Submit payment error:", error);
    return NextResponse.json({ error: "Invalid session or server error." }, { status: 401 });
  }
}
