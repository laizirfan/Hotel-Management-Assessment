import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
    {
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        roomType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "roomType",
            required: true
        },

        checkIn: {
            type: Date,
            required: true
        },

        checkOut: {
            type: Date,
            required: true
        },

        roomsBooked: {
            type: Number,
            required: true,
            min: 1
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["confirmed", "checked_in", "checked_out", "cancelled"],
            default: "confirmed"
        }
    },
    { timestamps: true }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;