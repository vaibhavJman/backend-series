import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//Not completed
const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const subscriberCount = await Subscription.aggregate([
    //Stage-1
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $count: "Subscriber Count",
    },
  ]);

  const videoCount = await Video.aggregate([
    //Stage-1
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    //Stage -2
    {
      $count: "Video Count",
    },
  ]);

  //Not completed
  const likesCount = await Video.aggregate([
    //Stage-1
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    //Stage -2
    {
      $lookup: {
        from: "likevideos",
        localField: "_id",
        foreignField: "video",
        as: "likes",
        pipeline: [
          //Stage -3
          {
            $count: "likes",
          },
        ],
      },
    },

    //Stage-4
    // {
    //   $addFields: {
    //     likes: {
    //       $first: "$likes",
    //     },
    //   },
    // },

    //Stage-4
    {
      $addFields: {
        likes: {
          $ifNull: [{ $first: "$likes.likes" }, 0], // Default to 0 if no likes
        },
      },
    },

    //Stage-5
    // {
    //   $project: {
    //     likes: 1,
    //   },
    // },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      // { subscriberCount, videoCount, likesCount },
      {
        subscriberCount: subscriberCount[0],
        videoCount: videoCount[0],
        likesCount,
      },
      "Channel Stats fetched Successfully!"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
});

export { getChannelStats, getChannelVideos };
