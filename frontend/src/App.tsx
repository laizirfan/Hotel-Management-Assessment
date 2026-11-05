import { Link, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import Rooms from './pages/Rooms';
import MyReservations from './pages/MyReservations';
import StaffDashboard from './pages/StaffDashboard';

function App() {
  return (
    <div>
      <nav className="navbar">
        <h2>Hotel Management</h2>

        <div className="nav-links">
          <Link to="/">Rooms</Link>
          <Link to="/my-reservations">My Reservations</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/staff">Staff Dashboard</Link>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/"element={<Rooms /> } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-reservations" element={<MyReservations />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;