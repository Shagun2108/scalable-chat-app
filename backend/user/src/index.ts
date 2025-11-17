import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectRabbitMq } from "./config/rabbitmq.js";

dotenv.config();
connectDb();
connectRabbitMq();

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing in .env file");
}

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient
  .connect()
  .then(() => {
    console.log("connected to redis");
  })
  .catch(console.error);
const app = express();
app.use(express.json())
app.use("/api/vi", userRoutes);
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`server is listening on port${port}`);
});
