
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [checking, setChecking] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomsBooked, setRoomsBooked] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  const bookingFormRef = useRef<HTMLDivElement | null>(null);

  const getToday = () => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().split('T')[0];
  };

  const today = getToday();

  const numberOfNights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round(
        (new Date(checkOut).getTime() -
          new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      : 0;

  const estimatedTotal = selectedRoom
    ? numberOfNights * selectedRoom.pricePerNight * roomsBooked
    : 0;

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
        toast.error('Unable to load rooms');
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      bookingFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedRoom]);

  // Clear old availability when dates change
  function handleDateChange(
    type: 'checkIn' | 'checkOut',
    value: string
  ) {
    if (type === 'checkIn') {
      setCheckIn(value);
    } else {
      setCheckOut(value);
    }

    setAvailability({});
    setSelectedRoom(null);
  }

  // Check available inventory for the selected dates
  async function checkAvailability() {
    if (checking) return;

    if (!checkIn || !checkOut) {
      toast.error('Please select both dates');
      return;
    }
    if (checkIn < today) {
      toast.error('Check-in cannot be in the past');
      return;
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }

    setChecking(true);
    setAvailability({});
    setSelectedRoom(null);

    try {
      const results: Record<string, number> = {};

      for (const room of rooms) {
        const response = await fetch(
          `/api/rooms/${room._id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Failed to check availability'
          );
        }

        results[room._id] = data.availableRooms;
      }

      setAvailability(results);
      toast.success('Room availability updated');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );
    } finally {
      setChecking(false);
    }
  }

  // Create a reservation
  async function confirmBooking() {
    if (!selectedRoom || bookingLoading || checking) return;

    const token = sessionStorage.getItem('token');

    if (!token) {
      toast.error('Please login before booking');
      return;
    }

    const availableRooms = availability[selectedRoom._id];

    if (
      !Number.isInteger(roomsBooked) ||
      roomsBooked < 1 ||
      availableRooms === undefined ||
      roomsBooked > availableRooms
    ) {
      toast.error('Please enter a valid number of rooms');
      return;
    }
    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      toast.error('Please enter a valid number of guests');
      return;
    }

    const maximumGuests = selectedRoom.capacity * roomsBooked;

    if (guestCount > maximumGuests) {
      toast.error(
        `Maximum ${maximumGuests} guests allowed for ${roomsBooked} room(s)`
      );
      return;
    }
    setBookingLoading(true);

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
          guestCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed');
      }

      toast.success('Reservation created successfully!');

      setSelectedRoom(null);
      setAvailability({});
      setRoomsBooked(1);
      setGuestCount(1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Something went wrong'
      );
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rooms-loading">
        <LoadingSpinner text="Loading rooms..." />
      </div>
    );
  }

  return (
    <div className="guest-rooms-page">
      <h1>Available Room Types</h1>

      {/* Date selection */}
      <div className="date-selection">
        <label>
          Check-in
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              const newDate = e.target.value;

              handleDateChange('checkIn', newDate);

              if (checkOut && checkOut <= newDate) {
                setCheckOut('');
              }
            }}
            disabled={checking || bookingLoading}
          />
        </label>

        <label>
          Check-out
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) =>
              handleDateChange('checkOut', e.target.value)
            }
            disabled={checking || bookingLoading}
          />
        </label>

        <button
          type="button"
          onClick={checkAvailability}
          disabled={checking || bookingLoading}
        >
          {checking ? (
            <LoadingSpinner text="Checking..." />
          ) : (
            'Check Availability'
          )}
        </button>
      </div>

      {/* Room cards */}
      <div className="room-grid">
        {rooms.map((room) => (
          <div className="guest-room-card" key={room._id}>
            <div className="staff-room-header">
              <h3>{room.name}</h3>

              <span className="staff-room-inventory">
                {room.totalInventory} rooms
              </span>
            </div>

            <p className="guest-room-description">
              {room.description}
            </p>

            <div className="staff-room-price">
              ₹{room.pricePerNight.toLocaleString('en-IN')}
              <span> / night</span>
            </div>

            <p className="staff-room-capacity">
              Capacity: {room.capacity} guests
            </p>

            <p className="staff-room-facilities">
              Facilities: {room.facilities.join(', ') || 'Not listed'}
            </p>

            {availability[room._id] !== undefined && (
              <div className="guest-availability">
                {availability[room._id] > 0 ? (
                  <span className="available-text">
                    {availability[room._id]} available for selected dates
                  </span>
                ) : (
                  <span className="unavailable-text">
                    Fully booked for selected dates
                  </span>
                )}
              </div>
            )}

            {availability[room._id] > 0 && (
              <button
                type="button"
                className="book-btn guest-book-btn"
                disabled={checking || bookingLoading}
                onClick={() => {
                  setSelectedRoom(room);
                  setRoomsBooked(1);
                  setGuestCount(1);
                }}
              >
                Book Now
              </button>
            )}
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <p>No rooms available.</p>
      )}

      {/* Booking form */}
      {selectedRoom && (
        <div className="booking-form" ref={bookingFormRef}>
          <h2>Book {selectedRoom.name}</h2>

          <p>Check-in: {checkIn}</p>
          <p>Check-out: {checkOut}</p>

          <p>
            Price per night: ₹
            {selectedRoom.pricePerNight.toLocaleString('en-IN')}
          </p>

          <label>
            Number of rooms:
            <input
              type="number"
              min="1"
              max={availability[selectedRoom._id]}
              value={roomsBooked}
              disabled={bookingLoading}
              onChange={(e) =>
                setRoomsBooked(Number(e.target.value))
              }
            />
          </label>

          <label>
            Number of guests:
            <input
              type="number"
              min="1"
              max={selectedRoom.capacity * roomsBooked}
              value={guestCount}
              disabled={bookingLoading}
              onChange={(e) =>
                setGuestCount(Number(e.target.value))
              }
            />
          </label>

          <p>
            Maximum guests: {selectedRoom.capacity * roomsBooked}
          </p>

          <div className="booking-price-summary">
            <p>Number of nights: {numberOfNights}</p>

            <p>
              ₹{selectedRoom.pricePerNight.toLocaleString('en-IN')}
              {' × '}
              {numberOfNights} night(s)
              {' × '}
              {roomsBooked} room(s)
            </p>

            <h3>
              Estimated Total: ₹
              {estimatedTotal.toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="booking-actions">
            <button
              type="button"
              disabled={bookingLoading}
              onClick={() => setSelectedRoom(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <LoadingSpinner text="Booking..." />
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;
