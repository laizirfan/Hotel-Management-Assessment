import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Room = {
  _id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  totalInventory: number;
  description: string;
  facilities: string[];
};

type Reservation = {
  _id: string;
  guest: {
    name: string;
    email: string;
  };
  roomType: {
    name: string;
  };
  checkIn: string;
  checkOut: string;
  roomsBooked: number;
  totalPrice: number;
  status: string;
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
  const [inventoryRoom, setInventoryRoom] = useState<Room | null>(null);
  const [newInventory, setNewInventory] = useState('');
  const [inventoryMessage, setInventoryMessage] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const [activeSection, setActiveSection] = useState<'rooms' | 'reservations'>('rooms');
const [showCreateRoom, setShowCreateRoom] = useState(false);


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
          facilities: facilities.split(',').map((item) => item.trim()).filter(Boolean),
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
          facilities: editingRoom.facilities.map((item) => item.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update room');
      }
      setMessage('Room updated successfully!');
      setEditingRoom(null);

      setRooms((previous) =>
        previous.map((room) => room._id === editingRoom._id ? { ...room, ...data.room } : room
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  }

  async function updateInventory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inventoryRoom) return;
    const totalInventory = Number(newInventory);
    if (
      newInventory.trim() === '' ||
      !Number.isInteger(totalInventory) ||
      totalInventory < 0
    ) {
      setInventoryMessage('Enter a valid inventory number');
      return;
    }
    const token = sessionStorage.getItem('token');
    if (!token) {
      setInventoryMessage('Please login as staff');
      return;
    }
    setInventoryMessage('');
    try {
      const response = await fetch(
        `/api/rooms/${inventoryRoom._id}/inventory`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ totalInventory }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Inventory update failed');
      }

      setInventoryMessage('Inventory updated successfully!');

      setRooms((previous) =>
        previous.map((room) =>
          room._id === inventoryRoom._id
            ? { ...room, totalInventory }
            : room
        )
      );

      setInventoryRoom({
        ...inventoryRoom,
        totalInventory,
      });
    } catch (error) {
      setInventoryMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  }

  async function fetchReservations(pageNumber = 1) {

    
      // API request here

    const token = sessionStorage.getItem('token');
    if (!token) {
      setReservationError('Please login as staff');
      return;
    }
    setReservationLoading(true);
    setReservationError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNumber));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const response = await fetch(
        `/api/reservations/staff/all?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load reservations');
      }
setReservations(data.reservations);
setPage(data.pagination.page);
setTotalPages(data.pagination.totalPages);
    } catch (error) {
      setReservationError(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      setReservationLoading(false);
    }
  }


  async function updateReservationStatus(
    reservationId: string,
    action: 'check-in' | 'check-out'
  ) {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setReservationError('Please login as staff');
      return;
    }
    setReservationError('');
    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/${action}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update reservation');
      }

      toast.success(
  action === 'check-in'
    ? 'Guest checked in successfully!'
    : 'Guest checked out successfully!'
);

  await fetchReservations(page);

    } catch (error) {
       toast.error(
    error instanceof Error
      ? error.message
      : 'Something went wrong'
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

  <div
    className="dashboard-card"
    onClick={() => setActiveSection('rooms')}
    style={{
      cursor: 'pointer',
      border: activeSection === 'rooms'
        ? '2px solid #2563eb'
        : '2px solid transparent'
    }}
  >
    <h2>Room Management</h2>
    <p>Add room types, update prices and manage inventory.</p>
  </div>

  <div
    className="dashboard-card"
    onClick={() => {
      setActiveSection('reservations');
      fetchReservations(1);
    }}
    style={{
      cursor: 'pointer',
      border: activeSection === 'reservations'
        ? '2px solid #2563eb'
        : '2px solid transparent'
    }}
  >
    <h2>Reservations</h2>
    <p>View guest bookings, check guests in and check them out.</p>
  </div>

</div>
{activeSection === 'rooms' && (
  <>
      <div className="form-container">
        <h2>Create New Room Type</h2>
        <form onSubmit={createRoom}>
          <input
            placeholder="Room name" value={name}
            onChange={(e) => setName(e.target.value)} required
          />
          <input
            type="number" placeholder="Price per night"
            value={price} onChange={(e) => setPrice(e.target.value)}
            min="1" required
          />
          <input
            type="number" placeholder="Guest capacity"
            value={capacity} onChange={(e) => setCapacity(e.target.value)}
            min="1" required
          />
          <input
            type="number" placeholder="Total inventory"
            value={inventory} onChange={(e) => setInventory(e.target.value)}
            min="0" required
          />
          <input
            placeholder="Description" value={description}
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
            <button className="book-btn" onClick={() => { setEditingRoom(room); }}>Edit Room</button>
            <button
              className="book-btn"
              style={{ marginLeft: '10px' }}
              onClick={() => {
                setInventoryRoom(room);
                setNewInventory(String(room.totalInventory));
                setInventoryMessage('');
              }}
            >
              Manage Inventory
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

      {inventoryRoom && (
        <div className="form-container">
          <h2>Manage Inventory — {inventoryRoom.name}</h2>
          <p>Current Inventory: {inventoryRoom.totalInventory}</p>
          <form onSubmit={updateInventory}>
            <label>New Total Inventory</label>
            <input type="number" min="0"
              step="1" value={newInventory}
              onChange={(e) => setNewInventory(e.target.value)}
              required
            />
            <button type="submit">Update Inventory</button>
            <button type="button" onClick={() => setInventoryRoom(null)}>
              Cancel
            </button>
          </form>
          {inventoryMessage && <p>{inventoryMessage}</p>}
        </div>
      )}
        </>
)}

{activeSection === 'reservations' && (
      <div style={{ marginTop: '40px' }}>
        <h2>Guest Reservations</h2>
        <div className="reservation-filters">
          <label>
            Search Guest
            <input
              type="text"
              placeholder="Name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label>
            Reservation Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
        
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <button className="book-btn" onClick={() => fetchReservations(1)}>
            Search Reservations
          </button>
        </div>
        {reservationLoading && <p>Loading reservations...</p>}
        {reservationError && <p>{reservationError}</p>}
        <div className="room-grid">
          {reservations.map((reservation) => (
            <div className="room-card" key={reservation._id}>
              <h2>{reservation.guest?.name || 'Guest'}</h2>
              <p>Email: {reservation.guest?.email || 'N/A'}</p>
              <p>Room: {reservation.roomType?.name || 'N/A'}</p>
              <p>Check-in: {new Date(reservation.checkIn).toLocaleDateString()}</p>
              <p>Check-out: {new Date(reservation.checkOut).toLocaleDateString()}</p>
              <p>Rooms Booked: {reservation.roomsBooked}</p>
              <p>Total Price: ₹{reservation.totalPrice}</p>
              <p>Status: <strong>{reservation.status}</strong></p>

              {reservation.status === 'confirmed' && (
                <button className="book-btn" onClick={() => updateReservationStatus(reservation._id, 'check-in')}>
                  Check In</button>
              )}

              {reservation.status === 'checked_in' && (
                <button className="book-btn" onClick={() => updateReservationStatus(reservation._id, 'check-out')}>
                  Check Out</button>
              )}
            </div>
          ))}
        </div>
        {reservations.length > 0 && (
  <div style={{ display: 'flex', gap: '15px', marginTop: '20px', alignItems: 'center' }}>
    <button
      className="book-btn"
      disabled={page === 1 || reservationLoading}
      onClick={() => fetchReservations(page - 1)}
    >
      Previous
    </button>

    <span>Page {page} of {totalPages}</span>

    <button
      className="book-btn"
      disabled={page >= totalPages || reservationLoading}
      onClick={() => fetchReservations(page + 1)}
    >
      Next
    </button>
  </div>
)}
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
