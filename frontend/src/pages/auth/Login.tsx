import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'patient') navigate('/dashboard', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      // Navigation will be handled by the auth state change in AuthContext
      // The user will be redirected based on their role in the app routing
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'patient' | 'doctor' | 'admin') => {
    const creds = {
      patient: { email: 'patient@healthcard.app', password: 'patient123' },
      doctor:  { email: 'doctor@healthcard.app',  password: 'doctor123'  },
      admin:   { email: 'admin@healthcard.app',   password: 'admin123'   },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="bg-blue-600 p-3 rounded-xl">
              <QrCode className="h-7 w-7 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">HealthCard</span>
          </Link>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline font-medium">Sign up free</Link>
          </div>

          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <Link to="/doctor/register" className="text-green-600 hover:underline">Register as a Doctor →</Link>
            </div>
          </div>

          {/* Demo shortcuts */}
          <div className="mt-6 pt-5 border-t">
            <p className="text-xs text-gray-400 text-center mb-3">Quick login with demo accounts</p>
            <div className="flex gap-2">
              <button onClick={() => fillDemo('patient')} className="flex-1 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">👤 Patient</button>
              <button onClick={() => fillDemo('doctor')}  className="flex-1 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">🩺 Doctor</button>
              <button onClick={() => fillDemo('admin')}   className="flex-1 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">🔐 Admin</button>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Admin sign in uses fixed, pre-registered admin credentials. Please use an existing admin account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
