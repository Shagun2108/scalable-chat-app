
import { generateToken } from "../config/generateToken.js"
import { publishToQueue } from "../config/rabbitmq.js"
import tryCatch from "../config/tryCatch.js"
import { redisClient } from "../index.js"
import type { AuthenticatedRequest } from "../middleware/isAuth.js"
import { User } from "../models/User.js"
                                                                                                     9
                                                                                                     
export  const loginUser = tryCatch(async(req,res)=>{
    const {email} = req.body
    //rate limit
    const rateLimitKey = `otp:ratelimit:${email}`
    const rateLimit = await redisClient.get(rateLimitKey)

    if(rateLimit){
        res.status(429).json({
            message:"too many requests please wait before requesting new otp"
        });
        return
    }
    const otp = Math.floor(100000 +Math.random()*900000).toString();
    const otpkey = `otp:${email}`
    await redisClient.set(otpkey,otp,{
        EX:300,
    });

    await redisClient.set(rateLimitKey,"true",{
        EX:60,
    });

    const message = {
        to:email,
        subject:"your otp code",
        body:`your otp is ${otp}. its is valid for 5 minutes`
    }

    await publishToQueue('send-otp',message);

    res.status(200).json({message:'OTP send to your email'})
})

export const verifyUser = tryCatch(async(req,res)=>{

    const {email, otp:enteredOtp} = req.body
    if(!email || !enteredOtp ){
        res.status(400).json({message:"email and otp is required"});
        return;
    }
    const otpkey =`otp:${email}`
    const storedOtp = await redisClient.get(otpkey)
    if(!storedOtp || storedOtp !== enteredOtp ){
     res.status(400).json({message:"invalid or expired OTP"});
     return;
   }

    await redisClient.del(otpkey);
    let user = await User.findOne({email});

    if(!user){
        const name = email.slice(0,8);
        user = await User.create({email,name}); 
    }
    const token = generateToken(user);

    res.json({
        message:"user verified successfully",
        user,
        token
    })

    res.status(200).json({message:"OTP verified successfully"});
})


export const myProfile = tryCatch(async(req: AuthenticatedRequest,res)=>{ 
    const user = req.user;
    res.json(user);
})

export const updatename = tryCatch(async(req: AuthenticatedRequest,res)=>{
    const user = await User.findById(req.user?._id);
    if(!user){
        res.status(404).json({message:"please login again-user not found"});
        return;
    }
    user.name = req.body.name ;
    await user.save();
    const token = generateToken(user);
    res.json({message:"name updated successfully", user, token});
})

export const getAllUsers = tryCatch(async(req :AuthenticatedRequest,res)=>{
    const users = await User.find({});
    res.json(users);
})

export const getUser = tryCatch(async(req: AuthenticatedRequest,res)=>{
    const user = await User.findById(req.params.id);
    res.json(user);
});