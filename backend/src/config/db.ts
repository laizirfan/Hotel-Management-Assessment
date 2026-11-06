import mongoose from "mongoose";

export async function connectDB() {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error("MongoDB connection string is missing")
        }
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully");
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}