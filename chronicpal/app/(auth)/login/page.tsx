'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-gray-200 rounded-2xl p-10 w-80 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-normal text-gray-900 tracking-tight">ChronicPal</h1>
        <h2 className="text-2xl font-normal text-gray-800">Log In</h2>

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
              className="bg-gray-400 rounded px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-gray-500 w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-400 rounded px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-gray-500 w-full"
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-gray-600 text-white rounded px-4 py-2 w-full hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Please wait…' : 'Log In'}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">New User?</span>
          <Link
            href="/register"
            className="bg-gray-500 text-white rounded px-3 py-1.5 text-sm hover:bg-gray-600 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
