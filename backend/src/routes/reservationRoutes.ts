import { Router } from "express";
import Reservation from "../models/Reservation";
import roomType from "../models/RoomType";
import { authMiddleware, staffOnly, AuthRequest } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import User from "../models/User";
import { validateBookingDates } from "../utils/bookingValidation";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { roomTypeId, checkIn, checkOut, roomsBooked, guestCount } = req.body;
        //  Validate date
        const dateError = validateBookingDates(checkIn, checkOut);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        //  Calculate number of nights
        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const numberOfNights = (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;

        //  Validate number of rooms
        if (typeof roomsBooked !== "number" || !Number.isInteger(roomsBooked) || roomsBooked < 1) {
            return res.status(400).json({
                message: "Rooms booked must be a positive whole number"
            });
        }

        // Validate guest count
        if (typeof guestCount !== "number" || !Number.isInteger(guestCount) || guestCount < 1) {
            return res.status(400).json({
                message: "Guest count must be a positive whole number"
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

                // Check total guest capacity across booked rooms
                const maximumGuests = room.capacity * roomsBooked;
                if (guestCount > maximumGuests) {
                    throw new Error("GUEST_CAPACITY_EXCEEDED");
                }

                //  Calculate price using database values
                const totalPrice = numberOfNights * room.pricePerNight * roomsBooked;

                //  Find overlapping reservations
                const currentReservations = await Reservation.find({
                    roomType: room._id,
                    status: { $in: ["confirmed", "checked_in", "checked_out"] },
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
                const createdReservations = await Reservation.create(
                    [{
                        guest: req.user!.userId,
                        roomType: room._id,
                        checkIn: startDate,
                        checkOut: endDate,
                        guestCount: guestCount,
                        roomsBooked: roomsBooked,
                        pricePerNight: room.pricePerNight,
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
            // Handle concurrent booking conflicts
            const mongoError = error as Error & { code?: number; errorLabels?: string[]; };
            if (mongoError.code === 112 || mongoError.errorLabels?.includes("TransientTransactionError")) {
                return res.status(409).json({
                    message: "Booking conflict. Please check availability and try again."
                });
            }
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
            if (error.message === "GUEST_CAPACITY_EXCEEDED") {
                return res.status(400).json({
                    message: "Guest count exceeds the capacity of the selected rooms"
                });
            }
        }
        console.error(error);
        return res.status(500).json({
            message: "Booking failed"
        });
    }
});

router.get("/my", authMiddleware, async (req: AuthRequest, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const filter = {
            guest: req.user!.userId
        };
        const [reservations, total] = await Promise.all([
            Reservation.find(filter)
                .populate("roomType", "name pricePerNight capacity")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit),

            Reservation.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Reservations fetched successfully",
            reservations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch reservations"
        });
    }
});

router.patch("/:id/cancel", authMiddleware, async (req: AuthRequest, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
            message: "Invalid reservation ID"
        });
    }
    const session = await mongoose.startSession();
    try {
        let cancelledReservation;

        await session.withTransaction(async () => {
            const reservation = await Reservation.findById(req.params.id)
                .session(session);

            if (!reservation) {
                throw new Error("RESERVATION_NOT_FOUND");
            }

            if (reservation.guest.toString() !== req.user!.userId) {
                throw new Error("NOT_ALLOWED");
            }

            if (reservation.status !== "confirmed") {
                throw new Error("CANNOT_CANCEL");
            }
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            if (reservation.checkIn < today) {
                throw new Error("CANNOT_CANCEL");
            }
            await roomType.updateOne(
                { _id: reservation.roomType },
                { $inc: { bookingVersion: 1 } },
                { session }
            );
            reservation.status = "cancelled";
            await reservation.save({ session });
            cancelledReservation = reservation;
        });

        return res.status(200).json({
            message: "Reservation cancelled successfully",
            reservation: cancelledReservation
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "RESERVATION_NOT_FOUND") {
                return res.status(404).json({
                    message: "Reservation not found"
                });
            }
            if (error.message === "NOT_ALLOWED") {
                return res.status(403).json({
                    message: "You cannot cancel another guest's reservation"
                });
            }
            if (error.message === "CANNOT_CANCEL") {
                return res.status(409).json({
                    message: "This reservation cannot be cancelled"
                });
            }
        }
        console.error(error);
        return res.status(500).json({
            message: "Cancellation failed"
        });

    } finally {
        await session.endSession();
    }
});

// Staff - Dashboard summary
router.get("/staff/summary", authMiddleware, staffOnly, async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const [
            todaysArrivals,
            todaysDepartures,
            occupiedReservations,
            pendingReservations
        ] = await Promise.all([
            Reservation.countDocuments({
                checkIn: { $gte: today, $lt: tomorrow },
                status: "confirmed"
            }),
            Reservation.countDocuments({
                checkOut: { $gte: today, $lt: tomorrow },
                status: "checked_in"
            }),
            Reservation.find({
                status: "checked_in"
            }).select("roomsBooked"),
            Reservation.countDocuments({
                status: "confirmed"
            })
        ]);
        const occupiedRooms = occupiedReservations.reduce(
            (total, reservation) => total + reservation.roomsBooked,
            0
        );
        return res.status(200).json({
            todaysArrivals,
            todaysDepartures,
            occupiedRooms,
            pendingReservations
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to load dashboard summary"
        });
    }
});

// Staff - View reservations with filtering and pagination
router.get("/staff/all", authMiddleware, staffOnly, async (req, res) => {
    try {
        const { status, search, checkInDate } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 10;
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        // Filter reservations by check-in date
        if (typeof checkInDate === "string" && checkInDate) {
            const date = new Date(checkInDate);

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(checkInDate) ||
                Number.isNaN(date.getTime()) ||
                date.toISOString().slice(0, 10) !== checkInDate
            ) {
                return res.status(400).json({
                    message: "Invalid check-in date"
                });
            }
            const nextDate = new Date(date);
            nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            filter.checkIn = {
                $gte: date,
                $lt: nextDate
            };
        }
        if (typeof status === "string" && status) {
            const allowedStatuses = [
                "confirmed",
                "checked_in",
                "checked_out",
                "cancelled"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid reservation status"
                });
            }
            filter.status = status;
        }
        // Search reservations by guest name or email
        if (typeof search === "string" && search.trim()) {
            const searchText = search.trim();
            if (searchText.length > 100) {
                return res.status(400).json({
                    message: "Search must be 100 characters or fewer"
                });
            }

            const safeSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const matchingGuests = await User.find({
                $or: [
                    { name: { $regex: safeSearch, $options: "i" } },
                    { email: { $regex: safeSearch, $options: "i" } }
                ]
            }).select("_id");

            filter.guest = {
                $in: matchingGuests.map((guest) => guest._id)
            };
        }
        const [reservations, total] = await Promise.all([
            Reservation.find(filter)
                .populate("guest", "name email")
                .populate("roomType", "name pricePerNight")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            Reservation.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Reservations fetched successfully",
            reservations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch reservations"
        });
    }
});

// Staff - Check in a guest
router.patch("/:id/check-in", authMiddleware, staffOnly, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid reservation ID"
            });
        }
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }
        if (reservation.status !== "confirmed") {
            return res.status(409).json({
                message: "Only confirmed reservations can be checked in"
            });
        }
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (today < reservation.checkIn || today >= reservation.checkOut) {
            return res.status(409).json({
                message: "Check-in is only allowed during the reservation dates"
            });
        }
        const updatedReservation = await Reservation.findOneAndUpdate(
            {
                _id: reservation._id,
                status: "confirmed"
            },
            { $set: { status: "checked_in" } },
            { new: true }
        );
        if (!updatedReservation) {
            return res.status(409).json({
                message: "Reservation status has already changed"
            });
        }
        return res.status(200).json({
            message: "Guest checked in successfully",
            reservation: updatedReservation
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Check-in failed"
        });
    }
});


// Staff - Check out a guest
router.patch("/:id/check-out", authMiddleware, staffOnly, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid reservation ID"
            });
        }
        const reservation = await Reservation.findOneAndUpdate(
            {
                _id: req.params.id,
                status: "checked_in"
            },
            {
                $set: { status: "checked_out" }
            },
            { new: true }
        );

        if (!reservation) {
            const existingReservation = await Reservation.findById(req.params.id);
            if (!existingReservation) {
                return res.status(404).json({
                    message: "Reservation not found"
                });
            }
            return res.status(409).json({
                message: "Only checked-in reservations can be checked out"
            });
        }

        return res.status(200).json({
            message: "Guest checked out successfully",
            reservation
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Check-out failed"
        });
    }
});


export default router;
