import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getActivationPrice, isFreeActivation } from "@/lib/activation";

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

    const activationPrice = await getActivationPrice();
    if (!isFreeActivation(activationPrice)) {
      return NextResponse.json(
        { error: "Account activation requires payment. Please submit your payment details." },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.status === "Active") {
      return NextResponse.json({
        message: "Account is already active.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          profilePicUrl: user.profilePicUrl,
          walletBalance: user.walletBalance,
          status: user.status,
          joinedAt: user.createdAt,
        },
      });
    }

    if (user.status === "Suspended") {
      return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
    }

    user.status = "Active";
    await user.save();

    return NextResponse.json({
      message: "Account activated successfully!",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        profilePicUrl: user.profilePicUrl,
        walletBalance: user.walletBalance,
        status: user.status,
        joinedAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Activate free error:", error);
    return NextResponse.json({ error: "Invalid session or server error." }, { status: 401 });
  }
}
