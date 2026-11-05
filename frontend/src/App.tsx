import { Link, Route, Routes, useNavigate,Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import Rooms from './pages/Rooms';
import MyReservations from './pages/MyReservations';
import StaffDashboard from './pages/StaffDashboard';
import { useState } from 'react';

function App() {

  const navigate = useNavigate();
const [token, setToken] = useState(sessionStorage.getItem('token'));
const [role, setRole] = useState(sessionStorage.getItem('role'));

function handleLoginSuccess(newToken: string, newRole: string) {
  setToken(newToken);
  setRole(newRole);
}

 function handleLogout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  setToken(null);
  setRole(null);
  navigate('/login', { replace: true });
}

  return (
    <div>
      <nav className="navbar">

        <h2>Hotel Management</h2>

    <div className="nav-links">
  <Link to="/">Rooms</Link>

  {token && (
    <Link to="/my-reservations">My Reservations</Link>
  )}

  {role === 'staff' && token && (
    <Link to="/staff">Staff Dashboard</Link>
  )}

  {!token ? (
    <>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </>
  ) : (
    <button onClick={handleLogout} className="logout-btn">
      Logout
    </button>
  )}
</div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Rooms />} />
         <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />}/>
          <Route path="/register" element={<Register />} />
          <Route path="/my-reservations"element={token ? <MyReservations /> : <Navigate to="/login" replace />}/>
          <Route path="/staff" element={token && role === 'staff'? <StaffDashboard />: <Navigate to="/login" replace />}/>
        </Routes>
      </main>
    </div>
  );
}

export default App;