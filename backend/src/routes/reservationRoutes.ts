import { Router } from "express";
import Reservation from "../models/Reservation";
import roomType from "../models/RoomType";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { roomTypeId, checkIn, checkOut, roomsBooked } = req.body;

        //  Validate date
        if (typeof checkIn !== "string" || typeof checkOut !== "string") {
            return res.status(400).json({ message: "Dates are required" });
        }

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
            return res.status(400).json({
                message: "Check-out must be after check-in"
            });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                message: "Check-in date must be today or a future date"
            });
        }

        //  Calculate number of nights
        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const numberOfNights =
            (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;

        //  Validate number of rooms
        if (
            typeof roomsBooked !== "number" ||
            !Number.isInteger(roomsBooked) ||
            roomsBooked < 1
        ) {
            return res.status(400).json({
                message: "Rooms booked must be a positive whole number"
            });
        }

        // Validate MongoDB room ID

        if (!mongoose.isValidObjectId(roomTypeId)) {
            return res.status(400).json({
                message: "Invalid room type ID"
            });
        }

        //  Start MongoDB session
        const session = await mongoose.startSession();
        let createdReservation;
        try {
            await session.withTransaction(async () => {
                // Fetch room inside transaction
                const room = await roomType.findById(roomTypeId).session(session);
                if (!room || !room.active) {
                    throw new Error("ROOM_NOT_FOUND");
                }
                if (roomsBooked > room.totalInventory) {
                    throw new Error("ROOM_NOT_AVAILABLE");
                }

                //  Calculate price using database values
                const totalPrice = numberOfNights * room.pricePerNight * roomsBooked;

                //  Find overlapping reservations
                const currentReservations = await Reservation.find({
                    roomType: room._id,
                    status: { $in: ["confirmed", "checked_in"] },
                    checkIn: { $lt: endDate },
                    checkOut: { $gt: startDate }
                }).session(session);

                // Check availability for every night
                for (
                    let date = new Date(startDate);
                    date < endDate;
                    date.setUTCDate(date.getUTCDate() + 1)
                ) {
                    let bookedRooms = 0;
                    for (const reservation of currentReservations) {
                        if (
                            reservation.checkIn <= date &&
                            reservation.checkOut > date
                        ) {
                            bookedRooms += reservation.roomsBooked;
                        }
                    }
                    const availableRooms = room.totalInventory - bookedRooms;
                    if (roomsBooked > availableRooms) {
                        throw new Error("ROOM_NOT_AVAILABLE");
                    }
                }
                //  Update booking version
                await roomType.updateOne(
                    { _id: room._id },
                    { $inc: { bookingVersion: 1 } },
                    { session }
                );

                //  Create reservation
        const createdReservations =   await Reservation.create(
                    [{
                            guest: req.user!.userId,
                            roomType: room._id,
                            checkIn: startDate,
                            checkOut: endDate,
                            roomsBooked: roomsBooked,
                            totalPrice: totalPrice,
                            status: "confirmed"
                        }
                    ],
                    { session }
                );
                createdReservation = createdReservations[0];
            });

        } finally {
            await session.endSession();
        }

return res.status(201).json({
    message: "Reservation created successfully",
    reservation: createdReservation
});

    } catch (error) {
         if (error instanceof Error) {
        if (error.message === "ROOM_NOT_FOUND") {
            return res.status(404).json({
                message: "Room type not found"
            });
        }
        if (error.message === "ROOM_NOT_AVAILABLE") {
            return res.status(409).json({
                message: "Not enough rooms available"
            });
        }
    }
    console.error(error);
    return res.status(500).json({
        message: "Booking failed"
    });
    }
});

export default router;
