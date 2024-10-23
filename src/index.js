import dotenv from "dotenv";
import connectDB from "./db/db.js";
import express from "express";

const app = express();

const port = process.env.PORT || 8000;

dotenv.config();
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed ", err);
  });
