'use client';

import { useState, FormEvent } from 'react';

export default function LinkPatientForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/caregiver/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail: email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('Link request sent! The patient will be notified.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Failed to send request. Please check the email and try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
      <p className="text-gray-500 font-medium text-base">+ Request to link a new patient</p>
      <p className="text-sm text-gray-400 mt-1">
        Enter your patient&apos;s email address to send a link request
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2 max-w-sm mx-auto">
        <input
          type="email"
          required
          placeholder="patient@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? 'Sending...' : 'Send Request'}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
