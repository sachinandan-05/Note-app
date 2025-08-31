import mongoose from "mongoose";
import pkg from "sachii-safe-logger";
const {maskToken, SafeLogger}=pkg
import dotenv from "dotenv";
dotenv.config()

const connectDB=async()=>{
    try {
       console.log(maskToken(process.env.DB_URI))
        await mongoose.connect(process.env.DB_URI)
        console.log("Database connected")
    } catch (error) {
        SafeLogger.error(error,"Database connection error")
    }
}

export default connectDB