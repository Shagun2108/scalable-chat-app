import mongoose from "mongoose";

const connectDb = async () => {
  const url = process.env.MONGO_URI;
  if (!url) {
    throw new Error("MONGO_URI is not defined in the enviornmnet variables");
  }

  try {
    mongoose.connect(url, {
      dbName: "chatappmicroserviceapp",
    });
    console.log("connected to mongoDb");
 } catch (error) {
    console.error("failed to connect to mongoDb");
    process.exit(1);
  }
};
export default connectDb;
