import express from 'express'
const router = express.Router();
import { isAuth } from '../middlewares/isAuth.js';
import { createNewChat, getAllChats } from '../controllers/chat.js';

router.post('/chat/new',isAuth,createNewChat);
router.get("/chat/all",isAuth,getAllChats);

export default router;