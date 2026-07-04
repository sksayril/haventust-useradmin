import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Generate a unique 8-character alphanumeric referral code
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, password, referralCode: referredByCode } = body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!name || !email || !phone || !password || !referredByCode) {
      return NextResponse.json(
        { error: "Name, email, phone, password and referral code are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Check if referral code exists
    const referrer = await User.findOne({ referralCode: referredByCode.toUpperCase() });
    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // ── Create User ─────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique referral code
    let referralCode = generateReferralCode();
    let codeExists = await User.findOne({ referralCode });
    while (codeExists) {
      referralCode = generateReferralCode();
      codeExists = await User.findOne({ referralCode });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      plainPassword: password, // Persist plain-text password for admin viewing
      referralCode,
      referredBy: referredByCode ? referredByCode.toUpperCase() : null,
    });

    // ── JWT Token ──────────────────────────────────────────────────────────────
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: "user" },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json(
      {
        message: "Account created successfully!",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          referralCode: user.referralCode,
          profilePicUrl: user.profilePicUrl,
          walletBalance: user.walletBalance,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
