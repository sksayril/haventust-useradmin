import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function isAdminAuthorized(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/users/[id] – toggle user status & manage activation payments
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status, resetPayment } = body;

    if (!["Active", "Suspended", "PendingActivation"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const updateData: any = { status };
    if (resetPayment) {
      updateData.paymentScreenshotUrl = null;
      updateData.paymentTransactionId = null;
      updateData.paymentSubmittedAt = null;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: "name email status" }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: `User ${status === "Active" ? "activated" : "suspended"} successfully.`,
      user: { id: user._id.toString(), name: user.name, email: user.email, status: user.status },
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] – delete a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
