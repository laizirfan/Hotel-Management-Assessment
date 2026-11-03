import { Router } from "express";
import roomType from "../models/RoomType";
import mongoose from "mongoose";
import { authMiddleware, staffOnly } from "../middleware/authMiddleware";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const rooms = await roomType.find({ active: true });
        res.json(rooms);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch rooms"
        });
    }
});

router.post("/", authMiddleware, staffOnly,async (req, res) => {
    try {
        const {
            name,
            pricePerNight,
            capacity,
            description,
            facilities,
            totalInventory } = req.body;

            const newRoom = await roomType.create({
                name,
                pricePerNight,
                capacity,
                description,
                facilities,
                totalInventory
            });
            res.status(201).json(newRoom);
        }
  catch (error) {
    console.error(error);

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            message: error.message
        });
    }

    res.status(500).json({
        message: "Failed to create room"
    });
}
});



export default router;