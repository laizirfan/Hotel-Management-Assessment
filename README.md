# Hotel Reservation Management System

## Setting done

### 1.Backend
Open a terminal in the project folder:
```bash
cd backend
npm install
```
Create `backend/.env` (you can copy `backend/.env.example` if available) and set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/hotel_management?replicaSet=rs0
JWT_SECRET=replace_with_your_own_secret__-key
DEMO_STAFF_PASSWORD=HotelDemo@2026
```

Create the demo staff account:

```bash
npm run seed
```
Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 2. Frontend

Open another terminal from the project folder:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## How to Test

### Guest

1. Register a guest account and log in.
2. Select check-in and check-out dates and browse room types.
3. Check availability and make a reservation.
4. Open **My Reservations** to view or cancel reservations.

### Staff

Run `npm run seed` in `backend` before using the demo staff login on a new database.

- **Email:** `staff@example.com`
- **Password:** `HotelDemo@2026`

After logging in, use the staff dashboard to:

1. Create and edit room types, change inventory, and activate or deactivate room types.
2. Search and filter reservations by guest, status, or check-in date.
3. Check guests in and out.

**Note:** The seed script does not overwrite an account that already uses `staff@example.com`. On an existing database, that account may have a different password.

## Tests

From the `backend` folder:

```bash
npm run build
node --test tests/bookingValidation.test.cjs
```

These automated tests cover booking date validation. The booking flow was also manually tested with two simultaneous requests for the final available room: one succeeded and the other received a `409` response.

## Implementation Notes

* The backend is used in calculating booking totals and checks inventory for each night.
- MongoDB transactions and a room booking-version update help prevent overbooking.
- Reservation lists use server-side pagination and stable sorting.
- The system tracks room types and available inventory, not individual room numbers.

## AI Assistance

AI tools were used for implementation guidance, debugging, and documentation. The application was tested locally.

Notes: I couldnt do the add-ons,the design and other logic on logging and rest is of my experience and such 
      do check and also let me know on any bugs or any improvements needed so that i can implement
