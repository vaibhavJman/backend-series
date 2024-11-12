import mongoose, { Schema } from "mongoose";

const likeVideoSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    // tweet: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Tweet",
    // },

    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const LikeVideo = mongoose.model("LikeVideo", likeVideoSchema);
