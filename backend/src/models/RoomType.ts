import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 1
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        description: {
            type: String,
            required: true
        },
        facilities: {
            type: [String],
            required: true
        },
        totalInventory: {
            type: Number,
            required: true,
            min: 0
        },
        active: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true }
);

const RoomType = mongoose.model("roomType", roomTypeSchema);

export default RoomType;