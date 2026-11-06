import { useEffect, useState } from 'react';

type Reservation = {
    _id: string;
    roomType: {
        name: string;
    };
    checkIn: string;
    checkOut: string;
    roomsBooked: number;
    totalPrice: number;
    status: string;
};

function MyReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    async function cancelReservation(id: string) {
        const confirmed = window.confirm(
            'Are you sure you want to cancel this reservation?'
        );

        if (!confirmed) return;

        const token = sessionStorage.getItem('token');

        if (!token) {
            setError('Please login again');
            return;
        }

        try {
            const response = await fetch(`/api/reservations/${id}/cancel`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Cancellation failed');
            }

            setReservations((previous) =>
                previous.map((reservation) =>
                    reservation._id === id
                        ? { ...reservation, status: 'cancelled' }
                        : reservation
                )
            );
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Something went wrong');
        }
    }

    useEffect(() => {
        async function fetchReservations() {
            const token = sessionStorage.getItem('token');
            if (!token) {
                setError('Please login to view your reservations');
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/reservations/my?page=${page}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to load reservations');
                }
                setReservations(data.reservations);
                setTotalPages(data.pagination.totalPages);
                setError('');
            } catch (error) {
                setError(
                    error instanceof Error ? error.message : 'Something went wrong'
                );
            } finally {
                setLoading(false);
            }
        }
        setLoading(true);
        fetchReservations();
    }, [page]);

    if (loading) return <p>Loading reservations...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>My Reservations</h1>

            {reservations.length === 0 && <p>No reservations found.</p>}

            <div className="room-grid">
                {reservations.map((reservation) => (
                    <div className="room-card" key={reservation._id}>
                        <h2>{reservation.roomType?.name || 'Room'}</h2>

                        <p>Check-in: {new Date(reservation.checkIn).toLocaleDateString()}</p>
                        <p>Check-out: {new Date(reservation.checkOut).toLocaleDateString()}</p>
                        <p>Rooms Booked: {reservation.roomsBooked}</p>
                        <p>Total Price: ₹{reservation.totalPrice}</p>
                        <p>Status: {reservation.status}</p>
                        {reservation.status === 'confirmed' &&
                            new Date(reservation.checkIn).getTime() > Date.now() && (
                                <button
                                    className="cancel-btn"
                                    onClick={() => cancelReservation(reservation._id)}
                                >
                                    Cancel Reservation
                                </button>
                            )}
                    </div>
                ))}
            </div>
            {totalPages > 1 && (
    <div
        className="pagination-controls"
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '15px',
            marginTop: '24px',
        }}
    >
        <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
        >
            Previous
        </button>

        <span>
            Page {page} of {totalPages}
        </span>

        <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
        >
            Next
        </button>
    </div>
)}
        </div>
    );
}

export default MyReservations;
