import express from 'express';
import dotenv from 'dotenv'
import { startSendOtpConsumer } from './consumer.js';
dotenv.config();
startSendOtpConsumer()
const app = express();
app.listen(process.env.PORT,()=>{
   ` server is running on ${process.env.PORT}`
})