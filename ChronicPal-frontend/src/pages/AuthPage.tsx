import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Mode = 'register' | 'login';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'register') {
        await register({ email, password });
      } else {
        await login({ email, password });
      }
      navigate('/');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
      ) {
        setError(String((err.response.data as { error: unknown }).error));
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'register' ? 'login' : 'register'));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-gray-200 rounded-2xl p-10 w-80 flex flex-col items-center gap-6">
        {/* Title */}
        <h1 className="text-4xl font-normal text-gray-900 tracking-tight">ChronicPal</h1>

        {/* Subtitle */}
        <h2 className="text-2xl font-normal text-gray-800">
          {mode === 'register' ? 'New User?' : 'Log In'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-400 rounded px-3 py-2 text-gray-900 placeholder-gray-600 outline-none focus:ring-2 focus:ring-gray-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-400 rounded px-3 py-2 text-gray-900 placeholder-gray-600 outline-none focus:ring-2 focus:ring-gray-500 w-full"
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-gray-600 text-white rounded px-4 py-2 w-full hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 text-center">
            {mode === 'register' ? 'Have account already?' : 'New User?'}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            className="bg-gray-500 text-white rounded px-3 py-1.5 text-sm hover:bg-gray-600 transition-colors"
          >
            {mode === 'register' ? 'Log in' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
