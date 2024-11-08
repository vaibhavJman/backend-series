import { v2 as cloudinary } from "cloudinary";
import { Console } from "console";
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

    // console.log("File uploaded on Cloudinary", response.url);       //debugging -- Public URL of uploaded file
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

const deleteFromCloudinary = async (publicFilePath) => {
  if (!publicFilePath) return null;

  try {
    const publicId = publicFilePath.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader
      .destroy(publicId)
      .then((result) => console.log("Old File deleted successfully", result))
      .catch((error) => console.error("Error deleting old files", error));

    return response;
  } catch (error) {
    console.log("Error in deleting files on cloudinary.!", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };

//----------------------------------------------------------------------------------------------------------------------------------
//Sample Public URL of avatar  --> http://res.cloudinary.com/dyzkcadf6/image/upload/v1730869666/dfavgxz586qislyskgbi.jpg

// const oldAvatarPublicId = oldAvatarPublicPath.split("/").pop().split(".")[0]; // splitting the URL on / and then taking the last part (which includes the file name with the extension) and splitting again on '.' to remove the extension.

// To delete one  asset at a time .Use 'destroy(public ID of asset)' method
// //! The destroy() method needs public ID of the asset not the public url     -- default resource_type: "image" and type: "upload" will be used. --> It can't delete video assets until define explicity --> resource_type: "video".
// const deleteavatar = await cloudinary.uploader
//   .destroy(oldAvatarPublicId)
//   .then(
//     (result) => console.log("Old Avatar Image deleted successfully", result) //If the result is 'not found' that means destroy() function didn't find the asset.
//   )
//   .catch((error) => console.error("Error deleting old avatar", error));

// If you try to delete a video without specifying resource_type: 'video', Cloudinary will treat the asset as an image and return a not found result if the asset is a video. This is not an error; it's simply the expected behavior, as Cloudinary doesn't throw errors when mismatched resource types are used. This is why it doesn’t enter the .catch() block when there's a resource type mismatch. The catch block is only triggered for actual exceptions, such as network issues or incorrect API credentials.
