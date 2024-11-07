import "dotenv/config.js";
// import express from "express";
import connectDB from "./db/db.js";
import { app } from "./app.js";

// const app = express();
const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    //app.on is event listener to listen events (like error, etc)
    // Check express is listening or not
    // The app.on("error", callback) listens for the "error" event, which could occur during the lifetime of the server.
    // In this case, if there is an error related to the app (for example, server issues, missing routes, etc.), the callback function will be triggered.
    app.on("error", (error) => {
      console.log("ERROR :", error);
      throw error;
    });

    //When the error is re-thrown using throw, it will propagate upwards in the call stack (unless it is caught by another catch block).

    //Start server
    app.listen(port, () => {
      console.log(`⚙️  Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log(`MONGODB connection Failed!!! ${err}`);
  });

/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})();
*/
