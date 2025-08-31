import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import connectDB from '../DB/db.js'
import authRoutes from './routes/auth.js';
dotenv.config()
const app=express()

app.use(express.json({limit:"30mb",extended:true}))
app.use(cors(
    {
        origin:[process.env.CLIENT_URL, "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:8001", "http://localhost:8001", "http://127.0.0.1:8000", "http://localhost:8000","http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174"],
        credentials:true
    }
))
app.use(express.urlencoded({limit:"30mb",extended:true}))
app.use(bodyParser.json())
// routes
app.use("/api/auth/",authRoutes);
// server configuration
app.listen(process.env.PORT,()=>{
    console.log(`Server running on port ${process.env.PORT}`);
});
// test route
app.get("/test",(req,res)=>res.json({message:"server is running successfully"}));

// MongoDB configuration

connectDB()





