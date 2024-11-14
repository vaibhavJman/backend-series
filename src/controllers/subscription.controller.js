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
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const ChannelSubscribers = await Subscription.aggregate([
    //Stage-1
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    //Stage-2
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          //Stage -3
          {
            $project: {
              _id: 1,
              username: 1,
            },
          },
        ],
      },
    },

    //Stage - 4
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    //Stage - 5
    {
      $project: {
        _id: 1,
        channel: 1,
        subscriber: 1,
      },
    },
  ]);

  if (!ChannelSubscribers) {
    throw new ApiError(400, "Error Fetching Subscribers List");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        ChannelSubscribers,
        "Channel Subscribers fetched Successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const subscribedChannels = await Subscription.aggregate([
    // Stage -1
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    // Stage -2
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          //Stage -3
          {
            $project: {
              _id: 1,
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },

    //Stage - 4
    {
      $addFields: {
        channel: {
          $first: "$channel",
        },
      },
    },
    //Stage - 5
    {
      $project: {
        _id: 1,
        channel: 1,
        subscriber: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "User Subscribed Channel fetched Successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
