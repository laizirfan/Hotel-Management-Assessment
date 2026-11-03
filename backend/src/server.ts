import express from 'express';
import "dotenv/config";
import { connectDB } from "./config/db";
import roomRoutes from "./routes/roomRoutes";
import authRoutes from "./routes/authRoutes";

const app = express();

app.use(express.json());
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);


app.get('/', (req, res) => {
    res.send("Hotel Managment API running");
})

async function startServer() {
    try {
        await connectDB();
        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    } catch (error) {
        console.error("Unable to start server:", error);
        process.exit(1);
    }
}

startServer();