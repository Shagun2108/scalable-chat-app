import express from "express";
import dotenv from "dotenv";
import chatRoutes from "./routes/route.js";
dotenv.config();
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
app.use("/api/v1",chatRoutes);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
