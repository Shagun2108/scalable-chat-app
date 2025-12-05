import express from 'express'
const router = express.Router();
import { isAuth } from '../middlewares/isAuth.js';
import { createNewChat, getAllChats, sendMessage } from '../controllers/chat.js';
import { upload } from '../middlewares/multer.js';

router.post('/chat/new',isAuth,createNewChat);
router.get("/chat/all",isAuth,getAllChats);
router.post('/message',isAuth,upload.single("image"),sendMessage)

export default router;