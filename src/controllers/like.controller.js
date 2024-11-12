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
      }, // Upsert: true creates a document if it doesn’t exist
      {
        new: true,
      }
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

//Not required
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

//!----------------------------------------------------------------------------------------------------
//Using Aggregation Pipelines -- Only One Database Call
//Aggregation performs everything in a single query, reducing round-trip latency.
// Aggregation allows MongoDB to process the data on the server side, avoiding excessive memory usage.
const getUserLikedVideos = asyncHandler(async (req, res) => {
  const userLikedVideos = await LikeVideo.aggregate([
    //Stage-1
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    //Stage-2
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          //Sub pipeline
          // Stage-3
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                //Sub pipeline
                // Stage - 4
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          //Stage - 5
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
          //Stage - 6
          {
            $project: {
              _id: 0,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    // Stage - 7
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },

    // It will same work as stage-7
    // {
    //   $unwind: "$video",
    // },

    // {
    //   $project: {
    //     likedBy: 1,
    //     video: 1,
    //   },
    // },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, userLikedVideos, "Liked Videos Fetched Successfully")
    );
});

//-----------------------------------------------------------------------------------------------------
// Two Database Calls
// const getUserLikedVideos = asyncHandler(async (req, res) => {
//   const likedVideos = await LikeVideo.find({ likedBy: req.user?._id });

//   // The likedVideos array will contain all documents that match the query. The result is loaded into the memory of your backend application. This means the data is brought into your server's RAM (Random Access Memory), and the server will hold it there while it processes it.
//   // Problem with Large Datasets: If you have many likedVideos (e.g., if a user has liked hundreds of videos), all those documents will be loaded into your server's memory. If the dataset is too large, it can cause performance problems, especially if the server runs out of memory or if it needs to process and handle too much data.

//   if (!likedVideos) {
//     throw new ApiError(500, "Error while fetching Liked Videos");
//   }

//   //! NOTE: Making individual database calls for each liked video can be inefficient, especially when the user has liked many videos. To improve performance, we can use MongoDB's $in operator to fetch all videos in a single query by first gathering all the video IDs liked by the user, then querying for those videos in bulk.

//   // Extract video IDs from liked videos
//   const videoIds = likedVideos.map((likedVideo) => likedVideo.video);

//   // Fetch all videos in a single query using the $in operator
//   const userLikedVideos = await Video.find({ _id: { $in: videoIds } });
//   // Can't handle error for each video --> If any video is not found in the dbase, Mongoose will simply skip that ID and only return the videos that exist. It does not throw an error if some of the IDs are missing; instead, it returns an array containing only the documents it found.
//   //

//   if (!userLikedVideos) {
//     throw new ApiError(500, "Error while fetching the videos");
//   }
//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         userLikedVideos,
//         "Liked Video Fetched Successfully!!"
//       )
//     );
// });

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getUserLikedVideos,
};
