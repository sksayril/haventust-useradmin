import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import {
  findIdentityConflict,
  formatPhoneDisplay,
  getDuplicateKeyMessage,
  isValidIndianMobile,
  normalizePhone,
} from "@/lib/identity";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// GET /api/user/profile - retrieve user details
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();

    const user = await User.findById(decoded.userId, {
      name: 1,
      email: 1,
      phone: 1,
      referralCode: 1,
      referredBy: 1,
      profilePicUrl: 1,
      walletBalance: 1,
      status: 1,
      teamSalesVolume: 1,
      dob: 1,
      address: 1,
      createdAt: 1,
      paymentScreenshotUrl: 1,
      paymentTransactionId: 1,
      paymentSubmittedAt: 1,
    }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Count referrals
    const referrals = await User.countDocuments({ referredBy: user.referralCode });

    return NextResponse.json({
      user: {
        id: (user._id as { toString: () => string }).toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        profilePicUrl: user.profilePicUrl,
        walletBalance: user.walletBalance,
        status: user.status,
        referrals,
        teamSalesVolume: user.teamSalesVolume || 0,
        dob: user.dob || "",
        address: user.address || "",
        joinedAt: user.createdAt,
        paymentScreenshotUrl: user.paymentScreenshotUrl || null,
        paymentTransactionId: user.paymentTransactionId || null,
        paymentSubmittedAt: user.paymentSubmittedAt || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }
}

// PATCH /api/user/profile - update user profile details
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();

    const body = await request.json();
    const { name, phone, dob, address, profilePicUrl } = body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (name !== undefined) user.name = name;

    if (phone !== undefined) {
      const phoneNormalized = normalizePhone(phone);
      if (!phoneNormalized || !isValidIndianMobile(phoneNormalized)) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit Indian mobile number." },
          { status: 400 }
        );
      }

      const phoneConflict = await findIdentityConflict(User, {
        phoneNormalized,
        excludeUserId: user._id.toString(),
      });
      if (phoneConflict) {
        return NextResponse.json({ error: phoneConflict }, { status: 409 });
      }

      user.phone = formatPhoneDisplay(phoneNormalized);
      user.phoneNormalized = phoneNormalized;
    }

    if (dob !== undefined) user.dob = dob;
    if (address !== undefined) user.address = address;
    if (profilePicUrl !== undefined) user.profilePicUrl = profilePicUrl;

    await user.save();

    return NextResponse.json({
      message: "Profile updated successfully!",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        profilePicUrl: user.profilePicUrl,
        walletBalance: user.walletBalance,
        status: user.status,
        dob: user.dob || "",
        address: user.address || "",
      }
    });
  } catch (error) {
    console.error("PATCH profile error:", error);
    const duplicateMessage = getDuplicateKeyMessage(error);
    if (duplicateMessage) {
      return NextResponse.json({ error: duplicateMessage }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
