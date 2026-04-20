'use client';

import { useState } from 'react';

type ActiveLink = {
  id: string;
  caregiverEmail: string;
  linkedSince: string;
};

export default function ActiveCaregiverLinks({ initialLinks }: { initialLinks: ActiveLink[] }) {
  const [links, setLinks] = useState(initialLinks);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (links.length === 0) return null;

  const handleRevoke = async (linkId: string) => {
    setRevoking(linkId);
    try {
      const res = await fetch('/api/patient/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, action: 'REVOKE' }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } finally {
      setRevoking(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Revoke caregiver access?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This caregiver will no longer be able to view your health data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void handleRevoke(confirmId)}
                disabled={revoking === confirmId}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {revoking === confirmId ? 'Revoking...' : 'Revoke Access'}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-base font-bold text-blue-800 mb-3">Active Caregivers ({links.length})</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{link.caregiverEmail}</p>
              <p className="text-xs text-gray-400">
                Linked since{' '}
                {new Date(link.linkedSince).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => setConfirmId(link.id)}
              disabled={revoking === link.id}
              className="text-sm text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors flex-shrink-0"
            >
              Revoke Access
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
