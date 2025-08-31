// auth controller
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
// login controller
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      message: "Login successful"
    });
  };

// signup controller
export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });
  
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);
  
    res.json({
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      message: "Signup successful"
    });
  };
  