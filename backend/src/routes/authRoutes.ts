import { Router } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { MongoServerError } from "mongodb";
import jwt from "jsonwebtoken";

const router = Router();
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ) {
            return res.status(400).json({
                message: "Valid name, email and password (minimum 8 characters) are required"
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "guest"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } 
    catch (error) {
        console.error(error);
        if (error instanceof MongoServerError && error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }
        res.status(500).json({
            message: "Registration failed"
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
) {
    return res.status(400).json({
        message: "Email and password are required"
    });
}

const normalizedEmail = email.trim().toLowerCase();
const user = await User.findOne({
    email: normalizedEmail
});

if (!user) {
    return res.status(401).json({
        message: "Invalid email or password"
    });
}
const isPasswordValid = await bcrypt.compare(password, user.password);
if (!isPasswordValid) {
    return res.status(401).json({
        message: "Invalid email or password"
    });
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT secret is missing");
}

const token = jwt.sign(
    {
        userId: user._id.toString(),
        role: user.role
    },
    jwtSecret,
    { expiresIn: "1d" }
)

return res.status(200).json({
    message: "Login successful",
    token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
});


    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Login failed"
        });
    }
});

export default router;