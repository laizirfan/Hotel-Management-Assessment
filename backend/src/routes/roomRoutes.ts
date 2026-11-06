import { Router } from "express";
import roomType from "../models/RoomType";
import mongoose from "mongoose";
import { authMiddleware, staffOnly } from "../middleware/authMiddleware";
import Reservation from "../models/Reservation";
const router = Router();


// Staff - Get all room types, including inactive rooms
router.get("/staff/all", authMiddleware, staffOnly, async (req, res) => {
  try {
    const rooms = await roomType.find().sort({ name: 1 });

    return res.status(200).json(rooms);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch room types"
    });
  }
});

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


// Staff - Update room details
router.patch("/:id", authMiddleware, staffOnly, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid room type ID"
            });
        }

        const { name, pricePerNight, capacity, description, facilities, active } = req.body;

        const updates: Record<string, unknown> = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({ message: "Invalid room name" });
            }
            updates.name = name.trim();
        }

        if (pricePerNight !== undefined) {
            if (typeof pricePerNight !== "number" || !Number.isFinite(pricePerNight) || pricePerNight <= 0) {
                return res.status(400).json({ message: "Invalid price" });
            }
            updates.pricePerNight = pricePerNight;
        }

        if (capacity !== undefined) {
            if (!Number.isInteger(capacity) || capacity < 1) {
                return res.status(400).json({ message: "Invalid capacity" });
            }
            updates.capacity = capacity;
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({ message: "Invalid description" });
            }
            updates.description = description;
        }

        if (facilities !== undefined) {
            if (!Array.isArray(facilities) || !facilities.every(item => typeof item === "string")) {
                return res.status(400).json({ message: "Invalid facilities" });
            }
            updates.facilities = facilities;
        }

        if (active !== undefined) {
            if (typeof active !== "boolean") {
                return res.status(400).json({ message: "Invalid active value" });
            }
            updates.active = active;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields provided" });
        }

        const room = await roomType.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({ message: "Room type not found" });
        }

        return res.status(200).json({
            message: "Room type updated successfully",
            room
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update room type"
        });
    }
});

// Staff - Update room inventory safely
router.patch("/:id/inventory", authMiddleware, staffOnly, async (req, res) => {
    const { totalInventory } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: "Invalid room type ID"
        });
    }

    if (!Number.isInteger(totalInventory) || totalInventory < 0) {
        return res.status(400).json({
            message: "Inventory must be a non-negative whole number"
        });
    }

    const session = await mongoose.startSession();

    try {
        let updatedRoom;

        await session.withTransaction(async () => {
            const room = await roomType.findById(req.params.id).session(session);

            if (!room) {
                throw new Error("ROOM_NOT_FOUND");
            }

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            // Include reservations that occupy future dates
            const reservations = await Reservation.find({
                roomType: room._id,
                status: {
                    $in: ["confirmed", "checked_in", "checked_out"]
                },
                checkOut: { $gt: today }
            }).session(session);

            // Check inventory for each reserved night
            for (const reservation of reservations) {
                for (
                    let date = new Date(reservation.checkIn);
                    date < reservation.checkOut;
                    date.setUTCDate(date.getUTCDate() + 1)
                ) {
                    if (date < today) continue;

                    const bookedRooms = reservations
                        .filter(r => r.checkIn <= date && r.checkOut > date)
                        .reduce((sum, r) => sum + r.roomsBooked, 0);

                    if (bookedRooms > totalInventory) {
                        throw new Error("INVENTORY_TOO_LOW");
                    }
                }
            }

            room.totalInventory = totalInventory;
            room.bookingVersion += 1;

            await room.save({ session });
            updatedRoom = room;
        });

        return res.status(200).json({
            message: "Room inventory updated successfully",
            room: updatedRoom
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "ROOM_NOT_FOUND") {
                return res.status(404).json({
                    message: "Room type not found"
                });
            }

            if (error.message === "INVENTORY_TOO_LOW") {
                return res.status(409).json({
                    message: "Cannot reduce inventory below existing reservations"
                });
            }
        }

        console.error(error);

        return res.status(500).json({
            message: "Failed to update room inventory"
        });

    } finally {
        await session.endSession();
    }
});

// Guest - Check room availability
router.get("/:id/availability", async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid room type ID"
            });
        }

        if (
            typeof checkIn !== "string" ||
            typeof checkOut !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)
        ) {
            return res.status(400).json({
                message: "Valid check-in and check-out dates are required (YYYY-MM-DD)"
            });
        }

        const start = new Date(checkIn + "T00:00:00.000Z");
        const end = new Date(checkOut + "T00:00:00.000Z");

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            start.toISOString().slice(0, 10) !== checkIn ||
            end.toISOString().slice(0, 10) !== checkOut ||
            start < today ||
            end <= start
        ) {
            return res.status(400).json({
                message: "Invalid date range"
            });
        }

        const room = await roomType.findById(req.params.id);

        if (!room || !room.active) {
            return res.status(404).json({
                message: "Room type not found"
            });
        }

        const reservations = await Reservation.find({
            roomType: room._id,
            status: {
                $in: ["confirmed", "checked_in", "checked_out"]
            },
            checkIn: { $lt: end },
            checkOut: { $gt: start }
        });

        let maxBooked = 0;

        // Check each night in the selected date range
        for (
            let date = new Date(start);
            date < end;
            date.setUTCDate(date.getUTCDate() + 1)
        ) {
            const bookedRooms = reservations
                .filter(r => r.checkIn <= date && r.checkOut > date)
                .reduce((sum, r) => sum + r.roomsBooked, 0);

            maxBooked = Math.max(maxBooked, bookedRooms);
        }

        const availableRooms = Math.max(
            0,
            room.totalInventory - maxBooked
        );

        return res.status(200).json({
            roomTypeId: room._id,
            roomTypeName: room.name,
            checkIn,
            checkOut,
            totalInventory: room.totalInventory,
            availableRooms,
            pricePerNight: room.pricePerNight
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to check room availability"
        });
    }
});


export default router;