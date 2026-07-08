import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/users – list all users
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const users = await User.find({}, {
      name: 1,
      email: 1,
      phone: 1,
      referralCode: 1,
      referredBy: 1,
      profilePicUrl: 1,
      walletBalance: 1,
      status: 1,
      paymentScreenshotUrl: 1,
      paymentTransactionId: 1,
      paymentSubmittedAt: 1,
      plainPassword: 1,
      panNumber: 1,
      kycDocumentUrl: 1,
      createdAt: 1,
    }).sort({ createdAt: -1 }).lean();

    // Get referral counts per user
    const referralCounts = await User.aggregate([
      { $group: { _id: "$referredBy", count: { $sum: 1 } } },
    ]);

    const referralMap: Record<string, number> = {};
    referralCounts.forEach((r) => {
      if (r._id) referralMap[r._id] = r.count;
    });

    const enrichedUsers = users.map((u) => ({
      id: (u._id as { toString: () => string }).toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      profilePicUrl: u.profilePicUrl,
      walletBalance: u.walletBalance,
      status: u.status,
      paymentScreenshotUrl: u.paymentScreenshotUrl,
      paymentTransactionId: u.paymentTransactionId,
      paymentSubmittedAt: u.paymentSubmittedAt ? new Date(u.paymentSubmittedAt).toISOString() : null,
      panNumber: u.panNumber || "—",
      kycDocumentUrl: u.kycDocumentUrl || null,
      plainPassword: u.plainPassword || "N/A",
      referrals: referralMap[u.referralCode] || 0,
      joined: new Date(u.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
