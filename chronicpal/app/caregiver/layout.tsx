import { redirect } from 'next/navigation';
import { auth, signOut } from '@/auth';

export default async function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'CAREGIVER') redirect('/dashboard');

  const email = session.user.email ?? '';
  const initials = email.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
          Caregiver
        </span>
        <span className="text-xl font-semibold text-gray-900">ChronicPal</span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
