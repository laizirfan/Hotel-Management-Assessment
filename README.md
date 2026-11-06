# Hotel Reservation Management System
application built using React, Node.js, Express, MongoDB, and TypeScript.

*Guests can search for available rooms, make reservations, and manage their bookings. 
*Hotel staff can manage room types, inventory, reservations, and guest check-in/check-out.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt

## Setup

### 1. MongoDB

MongoDB should be installed and running locally.

The application uses MongoDB transactions for reservations, so MongoDB needs to run as a replica set named `rs0`.

If the replica set is already configured, make sure MongoDB is running.

For a new installation, enable replication with `replSetName: rs0` in the MongoDB configuration, restart MongoDB, and initialize the replica set using `rs.initiate()` in `mongosh`.

### 2. Backend

Open a terminal in the project folder:

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and configure:

```env
MONGO_URI=mongodb://127.0.0.1:27017/hotel_management?replicaSet=rs0
JWT_SECRET=replace_with_your_own_long_random_secret
DEMO_STAFF_PASSWORD=HotelDemo@2026
PORT=5000
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

### 3. Frontend

Open another terminal from the project folder:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## How to Test

### Guest

1. Register a new guest account and log in.
2. Select check-in and check-out dates and enter the guest count.
3. Search for available room types.
4. Make a reservation.
5. Open **My Reservations** to view bookings or cancel an eligible reservation.

### Staff

Run `npm run seed` from the backend folder to create the demo staff account in a fresh database.

**Demo credentials**

- Email: `staff@example.com`
- Password: `HotelDemo@2026`

After logging in, staff can:

1. Create and edit room types.
2. Set room inventory and activate or deactivate room types.
3. Search and filter reservations.
4. Check guests in and out.
5. View reservation summary information.

**Note:** The seed script does not overwrite an existing account with the same email. If that account already exists, its password remains unchanged.

### Initial Room Setup

On a fresh database, log in as staff and create room types with prices, capacity, facilities, and inventory.

After creating room types, register a guest account to test availability and reservations.

## Architecture

The application is divided into a React frontend, Express backend, and MongoDB database.

- The frontend handles forms, navigation, and displaying information.
- The backend handles authentication, booking validation, pricing, reservation status, and inventory checks.
- MongoDB stores users, room types, and reservations.

JWT authentication is used to protect guest and staff operations. Passwords are stored as hashes using bcrypt.

The backend is responsible for important booking decisions instead of trusting values submitted by the browser.

## Reservation Logic

The backend validates reservation dates, guest capacity, and room availability.

- Check-out must be after check-in.
- Past check-in dates are rejected.
- Guest count must fit the room type's capacity.
- Availability is checked across the requested date range.
- Total price is calculated on the server using the number of nights and the room price.
- Guests can access only their own reservations.
- Staff can manage reservations and perform check-in/check-out operations.

The application manages inventory by room type rather than assigning individual room numbers.

## API and Pagination

The backend provides REST APIs for authentication, room management, availability checking, and reservations.

**Main API routes:**
- `/api/auth` – User registration and login
- `/api/rooms` – Room details, availability, and staff room management
- `/api/reservations` – Guest bookings and staff reservation management

**Pagination:**

Reservation lists use server-side pagination. The frontend sends `page` and `limit` parameters, and the backend returns the requested reservations along with pagination details.

Staff can also filter reservations by status and check-in date. Filtering and pagination are handled on the backend rather than loading all reservations into the frontend.

## Concurrent Booking Handling

The booking system uses MongoDB transactions and a booking-version update on the room type to help prevent overbooking.

When a reservation is submitted, the backend checks inventory for the requested dates and creates the reservation within a transaction.

The booking-version update helps competing transactions detect conflicts when multiple guests attempt to reserve the same remaining inventory.

If a booking cannot be completed because inventory is unavailable or a conflicting request wins, the API returns an error rather than confirming an overbooked reservation.

This approach depends on MongoDB transaction support and a properly configured replica set. A conflicting request may need to retry after checking availability again.

### Concurrency Test

The booking flow was manually tested by sending two simultaneous requests for the final available room.
Result:
- One reservation succeeded.
- The competing request received HTTP `409`.
- Only one reservation was confirmed.

## Tests

From the `backend` folder:

```bash
npm run build
node --test tests/bookingValidation.test.cjs
```

The automated tests cover booking validation rules.

The reservation flow, staff operations, and concurrent booking behavior were also tested manually.

## Scalability Considerations

The backend uses JWT authentication and stores booking information in 
MongoDB rather than relying on server memory.

Possible improvements for handling more users include:

- Running multiple backend instances behind a load balancer.
- Adding or tuning MongoDB indexes for frequently used queries.
- Using database connection pooling and monitoring slow queries.

The current implementation focuses on a working single-hotel application.

## Known Limitations

- Room inventory is managed by room type, not by individual room number.
- The demo staff seed script does not automatically create room types.
- The application has been tested locally and has not yet been deployed.
- Additional automated integration and concurrency tests can improve the code
- React Native application not implemented.

## AI Assistance

ChatGPT is used for understanding requirements, exploring implementation approaches, debugging, testing guidance, and documentation assistance.





Notes: I couldnt do the add-ons,the design and other logic on logging and rest is of my experience and such 
      do check and also let me know on any bugs or any improvements needed so that i can implement
