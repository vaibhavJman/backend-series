import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  const existingLike = await Like.findOne({
    video: videoId,
  });
  console.log("\n Existing Like :", existingLike);

  let updatedLike;
  if (!existingLike) {
    updatedLike = await Like.updateOne(
      { likedBy: req.user._id },
      {
        $set: {
          video: videoId,
        },
      },
      {
        upsert: true,
      }
    );
  } else {
    // console.log("\n else block");
    updatedLike = await Like.updateOne(
      { _id: existingLike._id },
      {
        $unset: {
          video: 1,
        },
      }
    );
  }
  console.log("\nupdated Like :", updatedLike);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLike, "Video Liked Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
  });
  console.log("\n Existing Like :", existingLike);

  let updatedLike;
  if (!existingLike) {
    updatedLike = await Like.updateOne(
      { likedBy: req.user._id },
      {
        $set: {
          comment: commentId,
        },
      },
      {
        upsert: true,
      }
    );
  } else {
    // console.log("\n else block");
    updatedLike = await Like.updateOne(
      { _id: existingLike._id },
      {
        $unset: {
          comment: 1,
        },
      }
    );
  }
  console.log("\nupdated Like :", updatedLike);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLike, "comment Liked Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
