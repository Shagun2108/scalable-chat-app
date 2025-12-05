import axios from "axios";
import tryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "./Messages.js";

export const createNewChat = tryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({ message: "otherUserId is required" });
      return;
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (existingChat) {
      res.json({ message: "Chat already exists", chatId: existingChat._id });

      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({ message: "Create New Chat", chatId: newChat._id });
  }
);

export const getAllChats = tryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401).json({ message: "userId is missing" });
    return;
  }
  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);

      const unseenCount = await Message.countDocuments({
        chatId: chat._id,
        seen: false,
        sender: { $ne: userId },
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/v1/user/${otherUserId}`
        );
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.error("Error fetching user data:", error);

        return {
          user: { _id: otherUserId, name: "Unknown" },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    })
  );

  res.json({
    chats: chatWithUserData,
  });
});



export const sendMessage = tryCatch(async(req: AuthenticatedRequest,res)=>{
    const senderId = req.user?._id;
    const {chatId,text} = req.body;
    const imageFile= req.file;

    if(!senderId){
      res.status(401).json({message:"unAuthroized"});
      return;
    }
    if(!chatId ){
      res.status(400).json({message:"chatId required"});
      return;
    }
    if(!text && !imageFile){
      res.status(400).json({message:"Either text or image is required"});
      return;
    }

    const chat = await Chat.findById(chatId);
    if(!chat){
      res.status(404).json({message:"Chat not found"});
      return;
    }

    const isUserInchat = chat.users.some((userId)=>userId.toString() ===senderId.toString());
    if(!isUserInchat){
      res.status(403).json({message:"you are not a participant of this chat"});
      return;
    }

    const otherUserId = chat.users.find((userId)=>userId.toString() !==senderId.toString());

    
    if(!otherUserId){
      res.status(401).json({message:"No other User in this chat"});
      return;
    }
    //socket SetUP

    let messageData:any ={
      chatId:chatId,
      sender:senderId,
      seen:false,
      seenAt:undefined,
    };

    if(imageFile){
      messageData.image ={
        url:imageFile.path,
        publicId:imageFile.filename,
      };
      messageData.messageType="image";
      messageData.text=text ||"";
    }else{
      messageData.text=text;
      messageData.messageType="text";
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();

    const latestMessagetext =imageFile?"📷 Image":text;

    await  Chat.findByIdAndUpdate(chatId,{
      latestMessage:{
        text:latestMessagetext,
        sender:senderId,
      },
      updatedAt:new Date(),
      },{new:true})

      //emit to sockets
      res.status(201).json({message:"Message Sent Successfully", data:savedMessage});

});