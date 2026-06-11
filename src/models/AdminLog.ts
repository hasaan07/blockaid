/**
 * AdminLog model — audit trail of admin actions.
 *
 * Every privileged action (soft-deleting a comment, suspending a campaign, etc.)
 * creates a log entry. Read-only from the API perspective; entries are never
 * edited or deleted, even by admins.
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const adminLogSchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "delete_comment",
        "delete_campaign",
        "restore_campaign",
        "promote_user",
        "demote_user",
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Comment", "Campaign", "User"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

export type AdminLogDoc = InferSchemaType<typeof adminLogSchema> & { _id: string };

export const AdminLog: Model<AdminLogDoc> =
  (models.AdminLog as Model<AdminLogDoc>) || model<AdminLogDoc>("AdminLog", adminLogSchema);
