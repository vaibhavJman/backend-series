import mongoose, { Schema } from "mongoose";

const likeCommentSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const LikeComment = mongoose.model("LikeComment", likeCommentSchema);
