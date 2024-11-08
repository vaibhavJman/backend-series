import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO:
  // 1. get video
  // 2. upload to cloudinary
  // 3. Get the duration from cloudinary
  // 4. create video

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

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Published Successfully!!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found!!!");
  }

  // console.log(video);        //Debugging

  return res
    .status(200)
    .json(
      new ApiResponse(200, video.videoFile, "Video extracted successfully!!")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  /*1. Take the required video's videoId from the user 
  2. Check for the empty string.
  3. Get the public path of Old thumbnail from database.
  4. Get the updated text(title and description) from the frontend/user
  5. Get the local path of thumbnail file from req.file(it is not array cuz we're uploading only single file) from the local storage.
  6. Check for the empty strings in all 3(title, descripton and new thumbnail) of them.
  7. Upload on cloudinary
  8. Update all the required fields.
  9. Return response
  */

  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }

  // Get the old thumbnail Public Path from the database
  const video = await Video.findById(videoId);
  const oldThumbnail = video.thumbnail;

  //Get the updated thumbnail local path
  const thumbnailLocalPath = req.file?.path;

  const { title, description } = req.body;
  if (!(title || description || thumbnailLocalPath)) {
    throw new ApiError(400, "Title, Description or thumbnail is required!!");
  }

  // console.log("\n req.file --> ", req.file);                                     //Debugging
  //  req.file returns a object containing fieldname, path originalname, etc, cuz we're uploading only single file

  // console.log("\n new Thumbnail local path--> ", thumbnailLocalPath);            //Debugging

  const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // console.log("\nnew Thumbnail  --> ", newThumbnail);         //Debugging

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

  // console.log("\n videoupdate controller --> Video result ", videoUpdated);        //Debugging

  if (!video) {
    throw new ApiError(500, "Error while Updating Title or Description");
  }

  // Todo: Make a utility function to delete old coverImage image
  // Extract the public ID of the old  cover image from the URL.
  const oldThumbnailPublicId = oldThumbnail.split("/").pop().split(".")[0];

  // console.log(oldThumbnailPublicId);

  //Delete the old cover Image from cloudinary
  cloudinary.uploader
    .destroy(oldThumbnailPublicId)
    .then((result) =>
      console.log("Old Thumbnail Image deleted successfully", result)
    );

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoUpdated, "Video Details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  // Get the video ID from the URL
  // check for the empty strings
  // find the video document in the database
  // Get the public URL from the databse and delete the video from cloudinary
  // Delete the
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is missing!!");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
