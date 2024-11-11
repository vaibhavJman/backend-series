import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!(name && description)) {
    throw new ApiError(400, "All Fields are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Error while creating playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "Playlist Created Successfully"));
});

//------------------------------------------------------------------------------------------
const getPlaylistById = asyncHandler(async (req, res) => {
  // TODO: get playlist by id
  // Check the playlistID is valid
  // find the playlist in the database.
  // return response.

  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Fetched Successfully"));
});

//------------------------------------------------------------------------------------------
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User Not found!!");
  }

  const userPlaylist = await Playlist.find({ owner: user._id }); //Returns array of document
  // console.log(userPlaylist);
  if (!userPlaylist) {
    throw new ApiResponse(500, "Error while fetching User Playlist!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "User Playlist Fetched"));
});

//------------------------------------------------------------------------------------------
const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  // Check if the user is authorized to delete the playlist or not

  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist Not found!!");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      401,
      "User doesn't have permission to delete playlist!!"
    );
  }

  // Can use findByIdAndDelete() function.
  // It will return the deleted item also.

  const deletePlaylist = await Playlist.deleteOne({ _id: playlistId });
  if (!deletePlaylist) {
    throw new ApiError(500, "Error while deleting the playlist!!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletePlaylist, "Playlist Deleted Successfully")
    );
});

//------------------------------------------------------------------------------------------
const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistID!");
  }

  if (!(name || description)) {
    throw new ApiError(400, "Name or Description is required!");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist Not Found!!");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(400, "You don't have permission to update playlist!!");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name,
      description: description,
    },
    {
      new: true,
    }
  );

  // console.log(updatedPlaylist);

  if (!updatedPlaylist) {
    throw new ApiError(500, "Error while updating the playlist!!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist Updated Successfully")
    );
});

//------------------------------------------------------------------------------------------
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  // Get the videoID and playlistID from the user
  // Check the validation for both
  // Find both(video and playlist) in the  database
  // Check owner of the video and playlist
  // Check if the video already exist in the playlist
  // Add the video in the playlist
  // Return Response

  const { videoId, playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check owner of the video and playlist
  if (
    !(video.owner.equals(req.user._id) && playlist.owner.equals(req.user._id))
  ) {
    throw new ApiError(401, "You don't have permission to update playlist");
  }

  // Check if the Video is already exist in the playlist
  if (playlist.videos.some((field) => field.equals(videoId))) {
    throw new ApiError(400, "Video Already exist in the playlist");
  }
  // console.log(playlist.videos);    //It'll return an array of videos added in playlist

  // Add the video in the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  /* In your schema, videos is an array of ObjectId references to the Video model. To add a new video, you only need to push videoId (not { videoId }).
  Wrapping it in { videoId } would create an object instead of a direct reference, leading to a schema mismatch. */

  if (!updatedPlaylist) {
    throw new ApiError(500, "Error while adding the video from playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video Added Successfully"));
});

//------------------------------------------------------------------------------------------
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // Get the videoID and playlistID from the user
  // Check the validation for both
  // Find both(video and playlist) in the  database
  // Check if the Video exist in the playlist or not.
  // Check owner of the video and playlist
  // Delete the video in the playlist
  // Return Response

  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Check owner of the video and playlist
  if (
    !(video.owner.equals(req.user._id) && playlist.owner.equals(req.user._id))
  ) {
    throw new ApiError(401, "You don't have permission to update playlist");
  }

  // Check if the Video exist in the playlist or not.
  if (!playlist.videos.some((field) => field.equals(videoId))) {
    throw new ApiError(400, "Video does not exist in the playlist");
  }

  // Delete the video in the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Error while deleting the video from playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video Deleted Successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
