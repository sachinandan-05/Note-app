import { signup, login } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import express from "express";
const router=express.Router();

// routes
router.post("/signup",signup);
router.post("/login",login,verifyToken);
export default router;