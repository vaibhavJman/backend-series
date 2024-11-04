import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("--> In the generateAccessAndRefreshToken() : ", user); //Debugging

    const accessToken = user.generateAccessToken();
    // console.log(
    //   "--> In the generateAccessAndRefreshToken() : \n Access Token: ",
    //   accessToken
    // ); //Debugging

    const refreshToken = user.generateRefreshToken();
    // console.log(
    //   "--> In the generateAccessAndRefreshToken : \n Refresh Token: ",
    //   accessToken
    // ); //Debugging

    user.refreshToken = refreshToken;
    // when you save the user then all the fields of user.model will kick in.that's means password should be mantory as in specified in the model. But we don't have password in this user object.
    // That's why we have to use validateBeforeSave: false
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token."
    );
  }
};

const options = {
  httpOnly: true,
  secure: true, //cookies are only modiafiable by the server not the client/frontend
};

//--------------------------------------------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  //  get userdetails from frontend
  //  validation  -- not empty
  //  check if user already exist -- email, username
  // check for images
  //  check for avatar
  //  upload them to the cloudinary -- avatar
  //  create  user object  -- create entry in database
  //  remove password and refresh token field from response
  //  check for user creation
  //  return response

  //  If the data is coming from forms and json format then it can be accessed by req.body
  //  If the data is comming from any URL then there are another methods to access the data
  //  For now we can't handle files. This code can only handle text data.
  //  To handle files we'need to add multer's middleware in the routes
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
    throw new ApiError(401, "User with email or username already exists.");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

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

//--------------------------------------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
  //  Take the user input from the frontend
  //  Check for the username or email
  //  find the user in the database.
  //  password check.
  //  Generate Access and refresh token
  //  Send cookie.

  const { username, email, password } = req.body;
  // console.log("--> Loginuser controller function :", email || username); //Debugging

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required!!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], //$or --> MongoDB operators
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In successfully!!!"
      )
    );
});

//--------------------------------------------------------------------------------------------------------
//For logout we have to access the delete the cookie(cuz it contain the access and refresh token) and refresh token field from the user model.
// But we can't find user in the logout function cuz we don't have access to the _id.
// that's why we have to create a middle which will add the user object to the req so that we can access _id in the logout function

const logoutUser = asyncHandler(async (req, res) => {
  // console.log("\nLogoutUser : ", req.user); //Debugging

  // First delete the refresh token in the user model
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  // Delete the cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

//------------------------------------------------------------------------------------------------------
//Access token:- short lived tokens. Only stored in cookies
// Refresh token:- long lived tokens. Stored in cookies as well as database. Used to renew access token.
// When the user's access token expires. Frontend make request to an endpoint with the refresh token saved in cookies and then backedn verify that refresh token with one saved in the database(refresh token in user model). If the user is verified backend will renew the access token.
// This method will make an endpoint where the users can make a request and renew their access token.
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Extract the refresh token from the cookies of the user or from the request body.
  // Check the incoming Refresh token
  // Decode this token
  // Verify this refresh token by sending request to the database.
  // Compare the token with the stored refresh token
  // Generate new tokens
  // Return response with new tokens
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used!!!!");
    }

    //refreshToken: newRefreshToken --> This renames refreshToken as newRefreshToken, making sure it matches the usage in refreshAccessToken.
    // In this line 'refreshToken' is the variable sent by the generateAccessAndRefreshToken() function and 'newRefreshToken' is the renamed variable.
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Renewed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

//------------------------------------------------------------------------------------------------------
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Get the old and new password from the user
  // Check the old password in the database and fetch the user.
  // Change the password in the database.
  // Return response

  const { oldPassword, newPassword } = req.body;

  //If the user is changing his password that means he is logged in. That's means the middleware verifyJWT will verify the request and add 'user' object to the request.
  const user = await User.findById(req.user?._id);
  const passwordCheck = await user.isPasswordCorrect(oldPassword);

  if (!passwordCheck) {
    throw new ApiError(400, "Incorrect Old password!!");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true }); //If there are any other validation in the user model's fields then they will not trigger. Only the password field's validation will trigger.
  //The password will be hashed automatically as we wrote the function using Pre-Hook in the user model.

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

//--------------------------------------------------------------------------------------------------------
const getCurrentUser = asyncHandler((req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      { user: req.user }, //req.user ---> the user object came from the middleware verifyJWT.
      "Current User Fetched Successfully"
    )
  );
});

//Updating Text
const updateAccountDetails = asyncHandler(async (req, res) => {
  // Get the details from the frontend
  // Check for the empty string
  // Check if the username or email are the same as the previous
  // Update the required fields
  // Remove the password field from the request
  // Return response

  const { fullName, email } = req.body;

  //Both fields are mandatory
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required!!");
  }

  if (email === req.user.email) {
    throw new ApiError(400, "Email match the previous emailId");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName, //--> it's similar to fullName: fullName;
      email: email,
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated!!"));
});

//Updating Files
const updateUserAvatar = asyncHandler(async (req, res) => {
  // multar middleware will take the file from user and upload it to the local storage and add a object file to the request.
  // Upload on cloudinary
  // Update the avatar object in the user model.
  // Delete the previous avatar file.
  // Return response

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar on cloud");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: avatar.url,
    },
    {
      new: true,
    }
  ).select("-password");

  // Todo: delete old avatar image

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar file Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage on cloud");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      coverImage: coverImage.url,
    },
    {
      new: true,
    }
  ).select("-password");

  // Todo: delete old coverImage image

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image file Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username is missing");
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
