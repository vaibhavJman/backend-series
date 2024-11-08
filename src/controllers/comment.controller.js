import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) {
    throw new ApiError(404, "Video not found");
  }

  if (!content) {
    throw new ApiError(400, "Comment content is missing!!");
  }

  // Check if the video exist or not
  const video = Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(500, "Error while saving a comment!!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, comment, "Comment saved successfully!!"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Comment ID is missing!!");
  }

  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Comment content is required!!");
  }

  const user = req.user._id;
  const originalComment = await Comment.findById(commentId);
  // console.log(originalComment);   /debugging
  if (!originalComment) {
    throw new ApiError(404, "Comment not found!!");
  }

  // The .equals() method on ObjectId ensures that the two ObjectIds have the same value, regardless of the object references themselves.
  if (!originalComment.owner.equals(user)) {
    throw new ApiError(403, "You don't have permission to update this comment");
  }

  const updateComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: content, //Can use $set field
    },
    {
      new: true,
    }
  );

  if (!updateComment) {
    throw new ApiError(500, "Error while updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // Get the comment ID from the URL
  // Check for the empty strings
  // Find the comment in the database (to check if the comment exist or not)
  // Check for the owner of the comment
  // Delete the comment
  // Return response

  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Comment ID is missing !!");
  }

  // Checking for the owner of the comment.
  const user = req.user._id;
  const originalComment = await Comment.findById(commentId);

  if (!originalComment) {
    throw new ApiError(404, "Comment not found!!");
  }

  if (!originalComment.owner.equals(user)) {
    throw new ApiError(403, "You don't have permission to update this comment");
  }

  const commentStatus = await Comment.deleteOne({ _id: commentId }); //Use await otherwise it'll go ahead and send the response but will not delete the comment from the database.

  if (!commentStatus) {
    throw new ApiError(500, "Error while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentStatus, "Comment deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
