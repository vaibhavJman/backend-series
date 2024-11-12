import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { LikeVideo } from "../models/likeVideo.model.js";
import { LikeComment } from "../models/likeComment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  // Check the videoID
  // Find the video in dbase and check if it exist or not.
  // find the LikeVideo document in the dbase-- > filter to look for a document by both videoId and req.user._id
  // if it finds the document that means user already liked the video --> remove the document
  // If it doesn't then --> Add the document --> Update the video and likedBy field
  // return response
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not Found");
  }

  const existingLike = await LikeVideo.findOne({
    video: videoId,
    likedBy: req.user?._id, // Ensure we're checking for a unique user-video combination
  });

  let updatedLike;
  if (!existingLike) {
    // If no like exists for this user-video combination, add a new one
    updatedLike = await LikeVideo.updateOne(
      {
        video: videoId,
        likedBy: req.user?._id,
      },
      {
        $set: {
          video: videoId,
          likedBy: req.user?._id,
        },
      },
      {
        upsert: true,
      } // Upsert: true creates a document if it doesn’t exist
    );
  } else {
    // If a like exists, remove it by deleting the document
    updatedLike = await LikeVideo.deleteOne({
      _id: existingLike._id,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedLike, "Video Like Toggled Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  // Check the commentID
  // Find the comment in dbase and check if it exist or not.
  // find the LikeComment document in the dbase-- > filter to look for a document by both commentId and req.user._id
  // if it finds the document that means user already liked the comment --> remove the document
  // If it doesn't then --> Add the document --> Update the comment and likedBy field
  // return response
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid VideoID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Video not Found");
  }

  const existingLike = await LikeComment.findOne({
    comment: commentId,
    likedBy: req.user?._id, // Ensure we're checking for a unique user-video combination
  });

  let updatedLike;
  if (!existingLike) {
    // If no like exists for this user-video combination, add a new one
    updatedLike = await LikeComment.updateOne(
      {
        comment: commentId,
        likedBy: req.user?._id,
      },
      {
        $set: {
          comment: commentId,
          likedBy: req.user?._id,
        },
      },
      {
        upsert: true,
      } // Upsert: true creates a document if it doesn’t exist
    );
  } else {
    // If a like exists, remove it by deleting the document
    updatedLike = await LikeComment.deleteOne({
      _id: existingLike._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedLike, "Comment Like Toggled Successfully")
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
