import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';

type Room = {
  _id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
  totalInventory: number;
  description: string;
  facilities: string[];
    active: boolean;
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


type DashboardSummary = {
  todaysArrivals: number;
  todaysDepartures: number;
  occupiedRooms: number;
  pendingReservations: number;
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

const [summary, setSummary] = useState<DashboardSummary | null>(null);

const roomActionRef = useRef<HTMLDivElement | null>(null);
const reservationRequestId = useRef(0);

function resetCreateRoomForm() {
  setName('');
  setPrice('');
  setCapacity('');
  setInventory('');
  setDescription('');
  setFacilities('');
  setMessage('');
  setShowCreateRoom(false);
}

useEffect(() => {
  if (editingRoom || inventoryRoom) {
    roomActionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}, [editingRoom, inventoryRoom]);


async function fetchSummary() {
  const token = sessionStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/reservations/staff/summary', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load summary');
    }

    const data: DashboardSummary = await response.json();
    setSummary(data);
  } catch (error) {
    console.error(error);
    toast.error('Failed to load dashboard summary');
  }
}

useEffect(() => {
  fetchSummary();
}, []);

async function toggleRoomStatus(room: Room) {
  const token = sessionStorage.getItem('token');

  if (!token) {
    toast.error('Please login as staff');
    return;
  }

  try {
    const response = await fetch(`/api/rooms/${room._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        active: !room.active,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update room status');
    }

    setRooms((previous) =>
      previous.map((item) =>
        item._id === room._id ? { ...item, active: data.room.active } : item
      )
    );

    toast.success(
      data.room.active ? 'Room activated' : 'Room deactivated'
    );
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Something went wrong'
    );
  }
}

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
      toast.success('Room type created successfully!');
setShowCreateRoom(false);
      setName('');
      setPrice('');
      setCapacity('');
      setInventory('');
      setDescription('');
      setFacilities('');
      const roomsResponse = await fetch('/api/rooms/staff/all', {
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
})
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

  async function fetchReservations(pageNumber = 1, guestSearch = search, reservationStatus = statusFilter) {

    const token = sessionStorage.getItem('token');
    if (!token) {
      setReservationError('Please login as staff');
      return;
    }
    const requestId = ++reservationRequestId.current;
    setReservationLoading(true);
    setReservationError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNumber));

      if (guestSearch.trim()) {
        params.set('search', guestSearch.trim());
      }

      if (reservationStatus) {
        params.set('status', reservationStatus);
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
if (requestId !== reservationRequestId.current) return;
setReservations(data.reservations);
setPage(data.pagination.page);
setTotalPages(data.pagination.totalPages);
    } catch (error) {
      if (requestId !== reservationRequestId.current) return;
      setReservationError(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    } finally {
      if (requestId === reservationRequestId.current) setReservationLoading(false);
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
  await fetchSummary();

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
        const response = await fetch('/api/rooms/staff/all', {
  headers: {
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
  },
})
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
    <h3>Today's Arrivals</h3>
    <h2>{summary?.todaysArrivals ?? '—'}</h2>
  </div>

  <div className="dashboard-card">
    <h3>Today's Departures</h3>
    <h2>{summary?.todaysDepartures ?? '—'}</h2>
  </div>

  <div className="dashboard-card">
    <h3>Occupied Rooms</h3>
    <h2>{summary?.occupiedRooms ?? '—'}</h2>
  </div>

  <div className="dashboard-card">
    <h3>Pending Reservations</h3>
    <h2>{summary?.pendingReservations ?? '—'}</h2>
  </div>
</div>
    <div className="dashboard-grid">

  <div
    className="dashboard-card"
    onClick={() => {
       setActiveSection('rooms');
       reservationRequestId.current += 1;
       setReservationLoading(false);
       setSearch('');
       setStatusFilter('');
       setReservations([]);
       setPage(1);
       setTotalPages(1);
       setReservationError('');
     }}
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
  resetCreateRoomForm();

  setEditingRoom(null);
  setInventoryRoom(null);

  setActiveSection('reservations');
  setSearch('');
  setStatusFilter('');
  setPage(1);

  fetchReservations(1, '', '');
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
  <div style={{ marginTop: '25px', marginBottom: '20px' }}>
  <button
    className="book-btn"
    onClick={() => {
  if (showCreateRoom) {
    resetCreateRoomForm();
  } else {
    resetCreateRoomForm();
    setShowCreateRoom(true);
  }
}}
  >
    {showCreateRoom ? 'Cancel' : '+ Create New Room'}
  </button>
</div>
{showCreateRoom && (
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
      )}
      
      <h2 style={{ marginTop: '35px' }}>Existing Room Types</h2>
      {loading && <p>Loading rooms...</p>}
      {error && <p>{error}</p>}
     <div className="room-grid">
  {rooms.map((room) => (
    <div className="staff-room-card" key={room._id}>
      <div className="staff-room-header">
        <h3>{room.name}</h3>
        <span className="staff-room-inventory">
          {room.totalInventory} rooms
        </span>
      </div>

      <div className="staff-room-price">
        ₹{room.pricePerNight.toLocaleString('en-IN')}
        <span> / night</span>
      </div>

      <p className="staff-room-capacity">
        Capacity: {room.capacity} guests
      </p>

      <p className="staff-room-facilities">
        {room.facilities.join(' • ') || 'No facilities listed'}
      </p>
    <p>Status: {room.active ? 'Active' : 'Inactive'}</p>
      <div className="staff-room-actions">
        <button
          className="book-btn"
          onClick={() => {
            setInventoryRoom(null);
            setEditingRoom(room);
          }}
        >
          Edit Room
        </button>

        <button
  type="button"
  className="book-btn"
  onClick={() => toggleRoomStatus(room)}
>
  {room.active ? 'Deactivate' : 'Activate'}
</button>

        <button
          className="book-btn"
          onClick={() => {
            setEditingRoom(null);
            setInventoryRoom(room);
            setNewInventory(String(room.totalInventory));
            setInventoryMessage('');
          }}
        >
          Manage Inventory
        </button>
      </div>
    </div>
  ))}
</div>

      {editingRoom && (
        <div className="form-container"  ref={roomActionRef}>
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
        <div className="form-container" ref={roomActionRef}>
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
        <button
  type="button"
  onClick={() => setInventoryRoom(null)}
>
  Cancel
</button>
          </form>
          {inventoryMessage && <p>{inventoryMessage}</p>}
        </div>
      )}
        </>
)}

{activeSection === 'reservations' && (
      <div style={{ marginTop: '30px' }}>
      <div style={{ marginBottom: '20px' }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <h2 style={{ margin: 0 }}>Guest Reservations</h2>

      <button
        type="button"
        onClick={() => fetchReservations(page)}
        disabled={reservationLoading}
        title="Refresh Reservations"
        aria-label="Refresh Reservations"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          padding: 0,
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          background: 'white',
          color: '#1e293b',
          cursor: reservationLoading ? 'wait' : 'pointer'
        }}
      >
        <RefreshCw size={17} />
      </button>
    </div>

    <p>Search bookings and manage guest check-ins and check-outs.</p>
  </div>
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
        <div className="reservation-grid">
  {reservations.map((reservation) => (
    <div className="reservation-card" key={reservation._id}>

      <div className="reservation-card-header">
        <div>
          <h3>{reservation.guest?.name || 'Guest'}</h3>
          <p>{reservation.guest?.email || 'N/A'}</p>
        </div>

        <span className={`status-badge ${reservation.status}`}>
          {reservation.status.replace('_', ' ')}
        </span>
      </div>

      <div className="reservation-room">
        <strong>{reservation.roomType?.name || 'N/A'}</strong>
      </div>

      <div className="reservation-details">
        <div>
          <small>CHECK-IN</small>
          <strong>{new Date(reservation.checkIn).toLocaleDateString()}</strong>
        </div>

        <div>
          <small>CHECK-OUT</small>
          <strong>{new Date(reservation.checkOut).toLocaleDateString()}</strong>
        </div>

        <div>
          <small>ROOMS BOOKED</small>
          <strong>{reservation.roomsBooked}</strong>
        </div>

        <div>
          <small>TOTAL PRICE</small>
          <strong>₹{reservation.totalPrice.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {reservation.status === 'confirmed' && (
        <button
          className="book-btn reservation-action"
          onClick={() => updateReservationStatus(reservation._id, 'check-in')}
        >
          Check In
        </button>
      )}

      {reservation.status === 'checked_in' && (
        <button
          className="book-btn reservation-action"
          onClick={() => updateReservationStatus(reservation._id, 'check-out')}
        >
          Check Out
        </button>
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
