import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  type: "Gold" | "Land";
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  screenshotUrl: string;
  transactionId: string;
  monthlyReturnRate: number; // e.g. 0.025, 0.03, 0.035, 0.04, 0.06
  redemptionLimit: number; // e.g. 0.60 (60%), 0.24 (24%), 0.36 (36%)
  redeemedSoFar: number;
  monthsPaid: number;
  approvedAt?: Date | null;
  goldPriceAtPurchase?: number;
  goldWeightGrams?: number;
  gstAmount?: number;
  taxableAmount?: number;
  karat?: string;
  city?: string;
  productType?: "Investment" | "Jewelry" | null;
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["Gold", "Land"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    screenshotUrl: { type: String, required: true },
    transactionId: { type: String, required: true },
    monthlyReturnRate: { type: Number, required: true },
    redemptionLimit: { type: Number, required: true },
    redeemedSoFar: { type: Number, default: 0 },
    monthsPaid: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    goldPriceAtPurchase: { type: Number, default: null },
    goldWeightGrams: { type: Number, default: null },
    gstAmount: { type: Number, default: null },
    taxableAmount: { type: Number, default: null },
    karat: { type: String, default: null },
    city: { type: String, default: null },
    productType: { type: String, enum: ["Investment", "Jewelry"], default: null },
  },
  {
    timestamps: true,
  }
);

const Purchase: Model<IPurchase> =
  (mongoose.models.Purchase as Model<IPurchase>) ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;
