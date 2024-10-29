import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //get userdetails from frontend
  //validation  -- not empty
  //check if user already exist -- email, username
  // check for images
  //check for avatar
  //upload them to the cloudinary -- avatar
  //create  user object  -- create entry in database
  //remove password and refresh token field from response
  //check for user creation
  //return response

  //If the data is coming from forms and json format then it can be accessed by req.body
  //If the data is comming from any URL then there are another methods to access the data
  // For now we can't handle files. This code can only handle text data.
  // To handle files we'need to add multer's middleware in the routes
  const { fullName, username, email, password } = req.body;
  
  // console.log(req.body); returns a object with all the fields send by the client/frontend
  console.log("Email: ", email);
  
  //? Array.some function will calls the callback function for each element of the array and if any of these element returns true(i.e. that field is empty) then this function will return true
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }
  // throw new ApiError --> 'new' is for creating new object of ApiError class which is imported from utils/ApiError.js

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  // const existedUser = User.findOne({ email });
  // console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists.");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is requierd!!!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is requierd!!!");
  }

  //When accessing the database. there are 2 things that you need to keep in mind
  // 1. There could potential be an error
  // 2. Database is always in a different continent. That's why it'll take time to connect or access the database.--> use async-await

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User Registration Failed!!!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully!!!"));
});

export { registerUser };