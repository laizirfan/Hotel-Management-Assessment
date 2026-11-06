
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User";
import { connectDB } from "../config/db";

async function seedStaff() {
    try {
        const email = "staff@example.com";
        const password = process.env.DEMO_STAFF_PASSWORD;

        if (!password) {
            throw new Error("DEMO_STAFF_PASSWORD is missing in .env");
        }

        await connectDB();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Account already exists. No changes made.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: "Demo Staff",
            email,
            password: hashedPassword,
            role: "staff"
        });

        console.log("Demo staff account created successfully");
    } catch (error) {
        console.error("Error creating demo staff:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedStaff();
