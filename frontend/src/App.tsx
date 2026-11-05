import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import Rooms from './pages/Rooms';
import MyReservations from './pages/MyReservations';
import StaffDashboard from './pages/StaffDashboard';

function App() {

  const navigate = useNavigate();

function handleLogout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  navigate('/login', { replace: true });
}

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
          <button onClick={handleLogout} className="logout-btn">
  Logout
</button>
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