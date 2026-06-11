/**
 * Comment model — flat (no replies) comment on a campaign.
 *
 * Posted by any authenticated user. Admins can soft-delete violating content.
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const commentSchema = new Schema(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment must be 500 characters or fewer"],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export type CommentDoc = InferSchemaType<typeof commentSchema> & { _id: string };

export const Comment: Model<CommentDoc> =
  (models.Comment as Model<CommentDoc>) || model<CommentDoc>("Comment", commentSchema);
