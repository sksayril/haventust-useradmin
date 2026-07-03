import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: "Admin" });
    if (!user) {
      return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid admin email or password." }, { status: 401 });
    }

    return NextResponse.json({
      message: "Admin authenticated successfully!",
      admin: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: "Admin",
      }
    });
  } catch (error: any) {
    console.error("Admin login API error:", error);
    return NextResponse.json({ error: error.message || "Failed to authenticate admin." }, { status: 500 });
  }
}
