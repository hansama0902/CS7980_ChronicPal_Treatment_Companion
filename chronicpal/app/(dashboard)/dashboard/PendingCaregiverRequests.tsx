'use client';

import { useState } from 'react';

type PendingLink = {
  id: string;
  caregiverEmail: string;
  requestedAt: string;
};

export default function PendingCaregiverRequests({
  initialLinks,
}: {
  initialLinks: PendingLink[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [processing, setProcessing] = useState<string | null>(null);

  if (links.length === 0) return null;

  const handleAction = async (linkId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessing(linkId);
    try {
      const res = await fetch('/api/patient/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      }
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
      <h2 className="text-base font-bold text-yellow-800 mb-3">
        Pending Caregiver Requests ({links.length})
      </h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{link.caregiverEmail}</p>
              <p className="text-xs text-gray-400">
                Requested{' '}
                {new Date(link.requestedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleAction(link.id, 'APPROVE')}
                disabled={processing === link.id}
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(link.id, 'REJECT')}
                disabled={processing === link.id}
                className="text-sm bg-white text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
