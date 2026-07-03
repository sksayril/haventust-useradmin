import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate S3 key
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const folder = userId ? `profiles/${userId}` : "profiles/anonymous";
    const s3Key = `${folder}/${timestamp}.${ext}`;

    // Upload to S3
    const url = await uploadToS3(s3Key, buffer, file.type);

    // Persist to MongoDB user document if userId is provided
    if (userId) {
      const { connectDB } = await import("@/lib/mongodb");
      const User = (await import("@/models/User")).default;
      await connectDB();
      await User.findByIdAndUpdate(userId, { profilePicUrl: url });
    }

    return NextResponse.json({
      message: "Profile picture uploaded successfully!",
      url,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload profile picture. Please try again." },
      { status: 500 }
    );
  }
}
