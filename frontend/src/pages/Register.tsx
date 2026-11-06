import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registration successful!'); setMessage('Registration successful! You can now login.');
        setName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch {
      setMessage('Cannot connect to the server');
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <h2>Guest Registration</h2>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? <LoadingSpinner text="Registering..." /> : 'Register'}
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Register;
