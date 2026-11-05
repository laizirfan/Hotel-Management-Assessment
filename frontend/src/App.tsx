import { Link, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

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
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Welcome to Our Hotel</h1>
                <p>Find and book your perfect room.</p>
              </div>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/my-reservations"
            element={<p>My Reservations page coming soon.</p>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;