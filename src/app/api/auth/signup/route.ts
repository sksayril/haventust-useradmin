import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getActivationPrice, isFreeActivation } from "@/lib/activation";
import {
  findIdentityConflict,
  formatPhoneDisplay,
  getDuplicateKeyMessage,
  isValidIndianMobile,
  normalizePan,
  normalizePhone,
} from "@/lib/identity";

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
    const {
      name,
      email,
      phone,
      password,
      referralCode: referredByCode,
      panNumber,
      kycDocumentUrl,
    } = body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!name || !email || !phone || !password || !referredByCode || !panNumber) {
      return NextResponse.json(
        { error: "Name, email, phone, PAN card, password and referral code are required." },
        { status: 400 }
      );
    }

    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized || !isValidIndianMobile(phoneNormalized)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const normalizedPan = normalizePan(panNumber);
    if (!normalizedPan) {
      return NextResponse.json(
        { error: "Please enter a valid PAN card number (e.g. ABCDE1234F)." },
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

    // Check duplicate email, phone, or PAN
    const identityConflict = await findIdentityConflict(User, {
      email,
      phoneNormalized,
      panNumber: normalizedPan,
      kycDocumentUrl: kycDocumentUrl || undefined,
    });
    if (identityConflict) {
      return NextResponse.json({ error: identityConflict }, { status: 409 });
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

    const activationPrice = await getActivationPrice();
    const accountStatus = isFreeActivation(activationPrice) ? "Active" : "PendingActivation";

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: formatPhoneDisplay(phoneNormalized),
      phoneNormalized,
      panNumber: normalizedPan,
      kycDocumentUrl: kycDocumentUrl || null,
      passwordHash,
      plainPassword: password, // Persist plain-text password for admin viewing
      referralCode,
      referredBy: referredByCode ? referredByCode.toUpperCase() : null,
      status: accountStatus,
    });

    // ── JWT Token ──────────────────────────────────────────────────────────────
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: "user" },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json(
      {
        message: isFreeActivation(activationPrice)
          ? "Account created and activated successfully!"
          : "Account created successfully!",
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
          joinedAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    const duplicateMessage = getDuplicateKeyMessage(error);
    if (duplicateMessage) {
      return NextResponse.json({ error: duplicateMessage }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
