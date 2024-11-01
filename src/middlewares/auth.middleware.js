import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// In the below line we're not using the res so we can replace it with '_'.
// export const verifyJWT = asyncHandler(async (req, res, next) => {
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // If the toke is store in cookies then we can extract that from the req.cookie?.accessToken.
    // If the user sending the token with the request header then we have to extract it with req.header("Authorization")

    // console.log("\nAuth middleware: ", req.cookies);                 //Debugging

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); //Verify the token using the token secret and extract the info. in it.(sent during the login )
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(400, "Invalid Access Token");
    }

    req.user = user; // Adding new object in the req --> req.<name> = user;

    // console.log("\n Auth Middleware: ", req.user); //Debugging

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
