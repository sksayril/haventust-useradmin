import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Purchase from "@/models/Purchase";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

// GET /api/admin/stats – dashboard statistics
export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      newThisMonth,
      goldStats,
      landStats,
      pendingPackagesCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      User.countDocuments({ status: "Suspended" }),
      User.countDocuments({ status: "PendingActivation" }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      // Sum approved Gold packages
      Purchase.aggregate([
        { $match: { type: "Gold", status: "Approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Sum approved Land packages
      Purchase.aggregate([
        { $match: { type: "Land", status: "Approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      // Count pending packages
      Purchase.countDocuments({ status: "Pending" })
    ]);

    const totalGoldCollected = goldStats[0]?.total || 0;
    const totalLandCollected = landStats[0]?.total || 0;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingUsers,
      newThisMonth,
      totalGoldCollected,
      totalLandCollected,
      pendingPackagesCount
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
