/**
 * Update model — campaign creator's progress update.
 *
 * Only the campaign owner can post updates on their own campaign.
 * Visible to anyone who can see the campaign.
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const updateSchema = new Schema(
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
      required: [true, "Update body is required"],
      trim: true,
      minlength: [1, "Update cannot be empty"],
      maxlength: [2000, "Update must be 2000 characters or fewer"],
    },
  },
  { timestamps: true }
);

export type UpdateDoc = InferSchemaType<typeof updateSchema> & { _id: string };

export const Update: Model<UpdateDoc> =
  (models.Update as Model<UpdateDoc>) || model<UpdateDoc>("Update", updateSchema);
