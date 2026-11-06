
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const reservationSchema = new mongoose.Schema(
  {
    reservationReference: {
      type: String,
      required: true,
      unique: true,
      default: () => `RES-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`
    },

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

    guestCount: {
      type: Number,
      required: true,
      min: 1
    },

    roomsBooked: {
      type: Number,
      required: true,
      min: 1
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled"
      ],
      default: "confirmed"
    }
  },
  { timestamps: true }
);

reservationSchema.index({
  guest: 1,
  createdAt: -1,
  _id: -1
});

reservationSchema.index({
  roomType: 1,
  checkIn: 1,
  checkOut: 1
});

reservationSchema.index({
  status: 1,
  createdAt: -1,
  _id: -1
});

const Reservation = mongoose.model(
  "Reservation",
  reservationSchema
);

export default Reservation;
