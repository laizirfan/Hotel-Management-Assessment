
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

  const [name, setName] = useState('');
const [price, setPrice] = useState('');
const [capacity, setCapacity] = useState('');
const [inventory, setInventory] = useState('');
const [description, setDescription] = useState('');
const [facilities, setFacilities] = useState('');
const [message, setMessage] = useState('');

const [editingRoom, setEditingRoom] = useState<Room | null>(null);

async function createRoom(e: React.SubmitEvent<HTMLFormElement>) {
  e.preventDefault();
  const token = sessionStorage.getItem('token');
  if (!token) {
    setMessage('Please login as staff');
    return;
  }
  setMessage('');
  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        pricePerNight: Number(price),
        capacity: Number(capacity),
        totalInventory: Number(inventory),
        description: description.trim(),
        facilities: facilities
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create room');
    }

    setMessage('Room type created successfully!');

    setName('');
    setPrice('');
    setCapacity('');
    setInventory('');
    setDescription('');
    setFacilities('');
    const roomsResponse = await fetch('/api/rooms');
    if (roomsResponse.ok) {
      const updatedRooms: Room[] = await roomsResponse.json();
      setRooms(updatedRooms);
    }
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : 'Something went wrong'
    );
  }
}

async function updateRoom(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!editingRoom) return;

  const token = sessionStorage.getItem('token');

  if (!token) {
    setMessage('Please login as staff');
    return;
  }

  try {
    const response = await fetch(`/api/rooms/${editingRoom._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editingRoom.name.trim(),
        pricePerNight: editingRoom.pricePerNight,
        capacity: editingRoom.capacity,
        description: editingRoom.description.trim(),
        facilities: editingRoom.facilities
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update room');
    }

    setMessage('Room updated successfully!');
    setEditingRoom(null);

    // Update the room details shown on the dashboard
    setRooms((previous) =>
      previous.map((room) =>
        room._id === editingRoom._id
          ? { ...room, ...data.room }
          : room
      )
    );
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : 'Something went wrong'
    );
  }
}

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

      <div className="form-container">
  <h2>Create New Room Type</h2>

 <form onSubmit={createRoom}>
    <input
      placeholder="Room name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      required
    />

    <input
      type="number"
      placeholder="Price per night"
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      min="1"
      required
    />

    <input
      type="number"
      placeholder="Guest capacity"
      value={capacity}
      onChange={(e) => setCapacity(e.target.value)}
      min="1"
      required
    />

    <input
      type="number"
      placeholder="Total inventory"
      value={inventory}
      onChange={(e) => setInventory(e.target.value)}
      min="0"
      required
    />

    <input
      placeholder="Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />

    <input
      placeholder="Facilities (comma separated)"
      value={facilities}
      onChange={(e) => setFacilities(e.target.value)}
    />

    <button type="submit">Create Room Type</button>
  </form>

  {message && <p>{message}</p>}
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
            <button
  className="book-btn"
  onClick={() => {
    setEditingRoom(room);
  }}
>
  Edit Room
</button>
          </div>
        ))}
      </div>
      {editingRoom && (
  <div className="form-container">
    <h2>Edit {editingRoom.name}</h2>

    <form onSubmit={updateRoom}>
      <input
        value={editingRoom.name}
        onChange={(e) =>
          setEditingRoom({ ...editingRoom, name: e.target.value })
        }
        placeholder="Room name"
        required
      />

      <input
        type="number"
        value={editingRoom.pricePerNight}
        onChange={(e) =>
          setEditingRoom({
            ...editingRoom,
            pricePerNight: Number(e.target.value),
          })
        }
        placeholder="Price per night"
        min="1"
        required
      />

      <input
        type="number"
        value={editingRoom.capacity}
        onChange={(e) =>
          setEditingRoom({
            ...editingRoom,
            capacity: Number(e.target.value),
          })
        }
        placeholder="Capacity"
        min="1"
        required
      />

      <input
        value={editingRoom.description}
        onChange={(e) =>
          setEditingRoom({
            ...editingRoom,
            description: e.target.value,
          })
        }
        placeholder="Description"
      />

      <input
        value={editingRoom.facilities.join(', ')}
        onChange={(e) =>
          setEditingRoom({
            ...editingRoom,
            facilities: e.target.value.split(','),
          })
        }
        placeholder="Facilities (comma separated)"
      />

      <button type="submit">Save Changes</button>

      <button type="button" onClick={() => setEditingRoom(null)}>
        Cancel
      </button>
    </form>
  </div>
)}
    </div>
  );
}

export default StaffDashboard;
