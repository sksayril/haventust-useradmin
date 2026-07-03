import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Name, email, phone, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Generate dummy referralCode just in case
    const referralCode = "ADM_" + Math.random().toString(36).substring(2, 7).toUpperCase();

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      plainPassword: password,
      referralCode,
      role: "Admin",
      status: "Active", // Admins are active immediately
    });

    return NextResponse.json({ message: "Admin profile registered successfully!" }, { status: 201 });
  } catch (error: any) {
    console.error("Admin register API error:", error);
    return NextResponse.json({ error: error.message || "Failed to register admin." }, { status: 500 });
  }
}
