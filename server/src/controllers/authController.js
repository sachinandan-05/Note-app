import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


// signup controller
export const signup=async(req,res)=>{

    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({message:"All fields are required"})
    }

    // check if user already exists
    const user=await User.findOne({email})
    if(user){
        return res.status(400).json({message:"User already exists"})
    }

    // hash password
    const salt=await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);

    // create user
    await User.create({name,email,password:hashedPassword});

    res.json({message:"Signup successful"})
}

// login controller
export const login=async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({message:"All fields are required"})
    }

    const user=await User.findOne({email});
    if(!user){
        return res.status(400).json({message:"User not found"})
    }

    const isPasswordValid=await bcrypt.compare(password,user.password);
    if(!isPasswordValid){
        return res.status(400).json({message:"Invalid credentials"})
    }

    const token=jwt.sign({_id:user._id},process.env.JWT_SECRET);
    res.json({token,message:"Login successful"});  


}