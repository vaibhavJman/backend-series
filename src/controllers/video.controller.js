import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO:
  // 1. Get the title and description
  // 2. Check for the empty strings
  // 3. get video
  // 4. Get the thumbnail
  // 5. upload to cloudinary
  // 6. Get the duration from cloudinary response
  // 7. create video in the dbase

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields are Required");
  }

  let videoFileLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoFileLocalPath = req.files.videoFile[0].path;
  }

  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is requierd!!!");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is requierd!!!");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // console.log("\npublishAVideo  --> video public path : ", videoFile); //debugging

  if (!videoFile) {
    throw new ApiError(400, "Error uploading video file on cloud!!!");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Error uploading thumbnail file on cloud!!!");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  return res.status(200).json(new ApiResponse(200, video, "Video Published!!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }

  // It returns true if the input is a properly formatted ObjectId and false otherwise.
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Fetched successfully!!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  /*
  1. Take the required video's videoId from the user 
  2. Check for the empty string.
  3. Get the public path of Old thumbnail from database and check if the video exist or not.
  4. Get the updated text(title and description) from the frontend/user
  5. Get the local path of thumbnail file from req.file(it is not array cuz we're uploading only single file) from the local storage.
  6. Check for the empty strings in all 3(title, descripton and new thumbnail) of them.
  7. Check for the owner.
  8. Upload on cloudinary
  9. Update all the required fields.
  10. Delete previous thumbnail from cloud.
  11. Return response
  */

  const user = req.user._id;
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invlid Video ID");
  }

  // Get the old thumbnail Public Path  and check if the video exist or not from the database
  const video = await Video.findById(videoId);
  const oldThumbnail = video.thumbnail;
  if (!video) {
    throw new ApiError(404, "Video not found!!");
  }

  //Get the updated thumbnail local path
  const thumbnailLocalPath = req.file?.path;

  const { title, description } = req.body;
  if (!(title || description || thumbnailLocalPath)) {
    throw new ApiError(400, "Title, Description or thumbnail is required!!");
  }

  if (!video.owner.equals(user)) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  // console.log(req.file);
  //  req.file returns a object containing fieldname, path originalname, etc, cuz we're uploading only single file

  const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!newThumbnail) {
    throw new ApiError(500, "Error while uploading new thumbnail");
  }

  const videoUpdated = await Video.findByIdAndUpdate(
    videoId,
    {
      title: title,
      description: description,
      thumbnail: newThumbnail ? newThumbnail.url : oldThumbnail,
    },
    {
      new: true,
    }
  );

  if (!videoUpdated) {
    throw new ApiError(500, "Error while Updating Title or Description");
  }

  //!Delete old file
  await deleteFromCloudinary(oldThumbnail);

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoUpdated, "Video Details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  // Get the video ID from the URL
  // Check for the empty strings
  // Find the video document in the database
  // Get the public URL of the video and thumbnail from the databse and delete them from cloudinary
  // Delete the Video document from the dbase
  // Return the response

  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invlid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!Video) {
    throw new ApiError(404, "Video not found!!");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  let resource_type;
  await deleteFromCloudinary(video.videoFile, (resource_type = "video"));
  await deleteFromCloudinary(video.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  // console.log(deletedVideo);
  if (!deletedVideo) {
    throw new ApiError(500, "Error while deleting video!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!");
  }

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
