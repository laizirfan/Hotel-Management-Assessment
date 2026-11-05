
import { useEffect, useState } from 'react';

type Room = {
  _id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  totalInventory: number;
  description: string;
  facilities: string[];
};

function StaffDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRooms() {
      try {
        const response = await fetch('/api/rooms');

        if (!response.ok) {
          throw new Error('Failed to load rooms');
        }

        const data: Room[] = await response.json();
        setRooms(data);
      } catch {
        setError('Unable to load room types');
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  return (
    <div>
      <h1>Staff Dashboard</h1>
      <p>Manage hotel rooms and guest reservations here.</p>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Room Management</h2>
          <p>Add new room types, update prices and manage inventory.</p>
        </div>

        <div className="dashboard-card">
          <h2>Reservations</h2>
          <p>View guest bookings, check guests in and check them out.</p>
        </div>
      </div>

      <h2 style={{ marginTop: '35px' }}>Existing Room Types</h2>

      {loading && <p>Loading rooms...</p>}
      {error && <p>{error}</p>}

      <div className="room-grid">
        {rooms.map((room) => (
          <div className="room-card" key={room._id}>
            <h2>{room.name}</h2>
            <p>Price: ₹{room.pricePerNight} / night</p>
            <p>Capacity: {room.capacity} guests</p>
            <p>Total Inventory: {room.totalInventory}</p>
            <p>Facilities: {room.facilities.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffDashboard;
