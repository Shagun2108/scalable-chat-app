import axios from "axios";
import  tryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "./Messages.js";

export const createNewChat = tryCatch(async(req:AuthenticatedRequest,res)=>{
    const userId = req.user?._id ;
    const {otherUserId} = req.body;

    if(!otherUserId){
        res.status(400).json({message:"otherUserId is required"});
        return;
    }

    const existingChat = await Chat.findOne({

        users:{$all :[userId,otherUserId],$size:2},
    })

    if(existingChat){
        res.json({message:"Chat already exists",
            chatId:existingChat._id
        });

        return;
    }

    const newChat = await Chat.create({
        users: [userId, otherUserId],
    });

    res.status(201).json({message:"Create New Chat",
        chatId: newChat._id
    });


})


export const getAllChats = tryCatch(async(req:AuthenticatedRequest,res)=>{
    const userId = req.user?._id;
    if(!userId){
        res.status(401).json({message: "userId is missing"});
        return;

    }
    const chats = await Chat.find({users:userId}).sort({updatedAt: -1});
    const chatWithUserData = await Promise.all(chats.map(async(chat)=>{
    const otherUserId = chat.users.find(id=>id !== userId);

    const unseenCount = await Message.countDocuments({
        chatId :chat._id,
        seen:false,
        sender:{$ne:userId},
    });

    try{
        const {data} = await axios.get(`${process.env.USER_SERVICE_URL}/api/v1/user/${otherUserId}`);
        return{
            user:data,
            chat:{
                ...chat.toObject(),
                latestMessage: chat.latestMessage|| null,
                 unseenCount,
            }
        }

    }catch(error){
        console.error("Error fetching user data:", error);

         return{
            user: {_id:otherUserId, name:"Unknown"},
            chat:{
                ...chat.toObject(),
                latestMessage: chat.latestMessage|| null,
                 unseenCount,
            }
        }
    }


})
 );

res.json({
    chats : chatWithUserData,
})
})