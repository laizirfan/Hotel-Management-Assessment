import express from 'express';
import "dotenv/config";
import { connectDB } from "./config/db";
import roomRoutes from "./routes/roomRoutes";
import authRoutes from "./routes/authRoutes";
import reservationRoutes from "./routes/reservationRoutes";

const app = express();

app.use(express.json());
app.use("/api/rooms", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);

app.get('/', (req, res) => {
    res.send("Hotel Management  API running");
})

async function startServer() {
    try {
        await connectDB();
        const PORT = Number(process.env.PORT) || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Unable to start server:", error);
        process.exit(1);
    }
}

startServer();