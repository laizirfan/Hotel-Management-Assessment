import { Router } from "express";
import Reservation from "../models/Reservation";
import roomType from "../models/RoomType";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { roomTypeId, checkIn, checkOut, roomsBooked } = req.body;

        if (typeof checkIn !== "string" || typeof checkOut !== "string") {
            return res.status(400).json({ message: "Dates are required" });
        }
        //date validation
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        function isValidDate(value: string, date: Date) {
            return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value;
        }

        if (!isValidDate(checkIn, startDate) || !isValidDate(checkOut, endDate)) {
            return res.status(400).json({ message: "Invalid date" });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ message: "Check-out must be after check-in" });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                message: "Check-in date must be today or a future date"
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const numberOfNights =
            (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;

        if (
            typeof roomsBooked !== "number" ||
            !Number.isInteger(roomsBooked) ||
            roomsBooked < 1
        ) {
            return res.status(400).json({
                message: "Rooms booked must be a positive whole number"
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Booking failed" });
    }
});

export default router;