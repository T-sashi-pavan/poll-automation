import mongoose from "mongoose";
import app from "./app";
import connectDB from "./config/db";
import { userSchema } from "./models/user.model";

const PORT = process.env.PORT || 5003;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});