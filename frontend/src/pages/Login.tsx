
import { useState ,useEffect} from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

type LoginProps = {
  onLoginSuccess: (token: string, role: string) => void;
};

function Login({ onLoginSuccess }: LoginProps) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

useEffect(() => {
  setEmail('');
  setPassword('');
}, [location.key]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (loading) return;

  setMessage('');
  setLoading(true);

  try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

    
if (response.ok && data.token) {
  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('role', data.user.role);
 onLoginSuccess(data.token, data.user.role);
  setEmail('');
  setPassword('');

  if (data.user.role === 'staff') {
    navigate('/staff', { replace: true });
  } else {
    navigate('/', { replace: true });
  }
}
 else {
        setMessage(data.message || 'Login failed');
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
      <h2>Guest / Staff Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
       <div className="password-field">
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    autoComplete="current-password"
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
  {loading ? <LoadingSpinner text="Logging in..." /> : 'Login'}
</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Login;
