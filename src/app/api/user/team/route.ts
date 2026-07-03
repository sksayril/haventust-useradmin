import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// GET /api/user/team - Fetch user's affiliate network stats and direct downline members
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTPayload;

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Get direct downline users
    const directs = await User.find({ referredBy: user.referralCode }, {
      name: 1,
      email: 1,
      phone: 1,
      status: 1,
      currentRank: 1,
      teamSalesVolume: 1,
      createdAt: 1,
    }).lean();

    // Map directs to frontend members array
    const mappedMembers = directs.map((d, index) => ({
      rank: index + 1,
      name: d.name,
      joinDate: `Joined on ${new Date(d.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })}`,
      sales: `₹${(d.teamSalesVolume || 0).toLocaleString("en-IN")}`,
      members: 0,
      avatar: "/avatar.png",
      status: d.status === "Active" ? "Active" : "Inactive",
      tier: d.currentRank,
    }));

    return NextResponse.json({
      teamSalesVolume: user.teamSalesVolume,
      currentRank: user.currentRank,
      directCount: directs.length,
      members: mappedMembers,
    });
  } catch (error) {
    console.error("GET team stats error:", error);
    return NextResponse.json({ error: "Failed to get team stats." }, { status: 500 });
  }
}
