import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Admin registration is disabled by system administrator." },
    { status: 403 }
  );
}
