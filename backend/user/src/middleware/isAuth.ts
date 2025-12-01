import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Iuser } from "../models/User.js";
import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
    user?: Iuser|null;
}

export const isAuth = async(req: AuthenticatedRequest, res: Response, next: NextFunction):Promise<void> => {

    try{
        
        const authHeader = req.headers.authorization;        
        if(!authHeader || !authHeader.startsWith('Bearer')){
            res.status(401).json({message:"Unauthorized access"});
            return;
        }
        const token = authHeader.split(' ')[1];
        
        const decodedValue = jwt.verify(token!,process.env.JWT_SECRET as string) as JwtPayload;
        
        if(!decodedValue || !decodedValue.user){
            res.status(401).json({message:"Unauthorized access 2nd"});
            return;
            
        };
        req.user =decodedValue.user;
        next();

    }catch(error){
        res.status(401).json({message:"please login again -jwt Error"});
        return;

    }

 }