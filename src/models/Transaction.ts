import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "Deposit" | "Withdrawal" | "Commission" | "MonthlyReturn" | "Salary" | "Purchase";
  amount: number;
  description: string;
  status: "Success" | "Pending" | "Failed";
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["Deposit", "Withdrawal", "Commission", "MonthlyReturn", "Salary", "Purchase"],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["Success", "Pending", "Failed"], default: "Success" },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
