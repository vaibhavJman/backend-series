import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }

  const existingSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  let updateSubscription;
  if (!existingSubscribed) {
    updateSubscription = await Subscription.updateOne(
      {
        subscriber: req.user?._id,
        channel: channelId,
      },
      {
        $set: {
          subscriber: req.user?._id,
          channel: channelId,
        },
      },
      {
        upsert: true,
      } // Upsert: true creates a document if it doesn’t exist
    );
  } else {
    updateSubscription = await Subscription.deleteOne({
      _id: existingSubscribed._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateSubscription,
        "Video subscribed Toggled Successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
