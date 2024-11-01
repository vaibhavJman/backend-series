import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      //one who is subscribing
      type: mongoose.types.ObjectId,
      ref: "User",
    },

    channel: {
      //to whom the 'subscriber' is subcribing
      type: mongoose.types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
