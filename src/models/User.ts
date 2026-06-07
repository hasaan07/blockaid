/**
 * User model.
 *
 * Stores the authentication identity (email, password hash) and a small
 * amount of profile data. The wallet address is stored as a string —
 * we never store wallet private keys. The role is a simple enum that
 * drives RBAC (admin panel, soft-delete capabilities).
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [1, "Name cannot be empty"],
      maxlength: [80, "Name must be 80 characters or fewer"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      // Simple format check. Real address validation happens via verification email (out of scope for Phase 2).
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email format is invalid"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never include in default queries; must be explicitly requested.
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio must be 500 characters or fewer"],
    },
    walletAddress: {
      type: String,
      default: "",
      lowercase: true,
      // Accept empty string or 0x-prefixed 40-hex-char address.
      validate: {
        validator: (v: string) => v === "" || /^0x[a-fA-F0-9]{40}$/.test(v),
        message: "Wallet address must be a 0x-prefixed 40-character hex string",
      },
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Type derived from the schema — gives us safe access to user.email, user.name, etc.
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: string };

// Hot-reload safety: avoid "OverwriteModelError" by reusing an existing model if one is already registered.
export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
