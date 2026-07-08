import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  phoneNormalized?: string;
  panNumber?: string;
  kycDocumentUrl?: string | null;
  passwordHash: string;
  referralCode: string;       // unique code assigned to this user
  referredBy?: string;        // referral code used during signup
  profilePicUrl?: string;     // S3 URL
  walletBalance: number;
  status: "Active" | "Suspended" | "PendingActivation";
  paymentScreenshotUrl?: string | null;
  paymentTransactionId?: string | null;
  paymentSubmittedAt?: Date | null;
  plainPassword?: string;
  teamSalesVolume: number;
  currentRank: string;
  role: "User" | "Admin";
  dob?: string | null;
  address?: string | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    phoneNormalized: { type: String, unique: true, sparse: true, trim: true },
    panNumber: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    kycDocumentUrl: { type: String, unique: true, sparse: true, default: null },
    passwordHash: { type: String, required: true },
    plainPassword: { type: String, default: null },
    referralCode: { type: String, required: true, unique: true, uppercase: true },
    referredBy: { type: String, default: null, uppercase: true },
    profilePicUrl: { type: String, default: null },
    walletBalance: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Suspended", "PendingActivation"], default: "PendingActivation" },
    paymentScreenshotUrl: { type: String, default: null },
    paymentTransactionId: { type: String, default: null },
    paymentSubmittedAt: { type: Date, default: null },
    teamSalesVolume: { type: Number, default: 0 },
    currentRank: { type: String, default: "Adviser" },
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    dob: { type: String, default: null },
    address: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in dev hot-reloads
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
