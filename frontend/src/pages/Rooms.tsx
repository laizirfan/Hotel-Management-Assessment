
import { useEffect, useState } from 'react';

type Room = {
    _id: string;
    name: string;
    pricePerNight: number;
    capacity: number;
    description: string;
    facilities: string[];
    totalInventory: number;
};

function Rooms() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [availability, setAvailability] = useState<Record<string, number>>({});
    const [availabilityMessage, setAvailabilityMessage] = useState('');
    const [checking, setChecking] = useState(false);

    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomsBooked, setRoomsBooked] = useState(1);

    const [bookingLoading, setBookingLoading] = useState(false);
const [bookingMessage, setBookingMessage] = useState('');

    async function checkAvailability() {
        if (!checkIn || !checkOut) {
            setAvailabilityMessage('Please select both dates');
            return;
        }

        if (checkOut <= checkIn) {
            setAvailabilityMessage('Check-out must be after check-in');
            return;
        }

        setChecking(true);
        setAvailabilityMessage('');
        setAvailability({});

        try {
            const results: Record<string, number> = {};

            for (const room of rooms) {
                const response = await fetch(
                    `/api/rooms/${room._id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to check availability');
                }

                results[room._id] = data.availableRooms;
            }

            setAvailability(results);
        } catch (error) {
            setAvailabilityMessage(
                error instanceof Error ? error.message : 'Something went wrong'
            );
        } finally {
            setChecking(false);
        }
    }

    async function confirmBooking() {
  if (!selectedRoom) return;

  const token = sessionStorage.getItem('token');

  if (!token) {
    setBookingMessage('Please login before booking');
    return;
  }

  if (
    !Number.isInteger(roomsBooked) ||
    roomsBooked < 1 ||
    roomsBooked > availability[selectedRoom._id]
  ) {
    setBookingMessage('Please enter a valid number of rooms');
    return;
  }

  setBookingLoading(true);
  setBookingMessage('');

  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        roomTypeId: selectedRoom._id,
        checkIn,
        checkOut,
        roomsBooked,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Booking failed');
    }

    setBookingMessage('Reservation created successfully!');
    setSelectedRoom(null);
    setAvailability({});
  } catch (error) {
    setBookingMessage(
      error instanceof Error ? error.message : 'Something went wrong'
    );
  } finally {
    setBookingLoading(false);
  }
}


    useEffect(() => {
        async function fetchRooms() {
            try {
                const response = await fetch('/api/rooms');

                if (!response.ok) {
                    throw new Error('Failed to fetch rooms');
                }

                const data: Room[] = await response.json();
                setRooms(data);
            } catch {
                setError('Unable to load rooms');
            } finally {
                setLoading(false);
            }
        }

        fetchRooms();
    }, []);

    if (loading) {
        return <p>Loading rooms...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Available Room Types</h1>
            <div className="date-selection">
                <label>Check-in
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /> </label>
                <label>Check-out
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
                <button onClick={checkAvailability} disabled={checking}>
                    {checking ? 'Checking...' : 'Check Availability'}
                </button>
            </div>

            {availabilityMessage && <p>{availabilityMessage}</p>}

            <div className="room-grid">
                {rooms.map((room) => (
                    <div className="room-card" key={room._id}>
                        <h2>{room.name}</h2>
                        <p>{room.description}</p>
                        <h3>₹{room.pricePerNight} / night</h3>
                        <p>Capacity: {room.capacity} guests</p>
                        <p>Facilities: {room.facilities.join(', ')}</p>
                        <p>Total Rooms: {room.totalInventory}</p>
                        {availability[room._id] !== undefined && (
                            <p> Available Rooms: <strong>{availability[room._id]}</strong></p>
                        )}
                        {availability[room._id] > 0 && (
                            <button
                                className="book-btn"
                                onClick={() => {
                                    setSelectedRoom(room);
                                    setRoomsBooked(1);
                                }}
                            >
                                Book Now
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {rooms.length === 0 && <p>No rooms available.</p>}
{bookingMessage && <p>{bookingMessage}</p>}
            {selectedRoom && (
  <div className="booking-form">
    <h2>Book {selectedRoom.name}</h2>

    <p>Check-in: {checkIn}</p>
    <p>Check-out: {checkOut}</p>
    <p>Price per night: ₹{selectedRoom.pricePerNight}</p>

    <label>
      Number of rooms:
      <input
        type="number"
        min="1"
        max={availability[selectedRoom._id]}
        value={roomsBooked}
        onChange={(e) => setRoomsBooked(Number(e.target.value))}
      />
    </label>

    <div className="booking-actions">
      <button onClick={() => setSelectedRoom(null)}>
        Cancel
      </button>

      <button
  onClick={confirmBooking}
  disabled={bookingLoading}
>
  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
</button>
    </div>
  </div>
)}
        </div>
    );
}

export default Rooms;
