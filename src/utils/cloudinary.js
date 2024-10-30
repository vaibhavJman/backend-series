import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log(cloudinary.config());       //debugging -- checking the env variables

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;
  // Upload an image
  try {
    // console.log("In cloudinary file", localFilePath);              // Debugging
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    
    console.log("File uploaded on Cloudinary", response.url);       //debugging -- Public URL of uploaded file
    fs.unlinkSync(localFilePath); //Remove the locally save temporary file on successful upload.
    // console.log(response);                                           // Debugging

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //Remove the locally save temporary file as the upload operation got failed
    console.log(
      "Error in uploading files on cloudinary.!!!! Files removed from local storage"
    );
    return null;
  }
};

export { uploadOnCloudinary };