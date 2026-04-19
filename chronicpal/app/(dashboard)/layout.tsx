import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { signOut } from '@/auth';

const NAV_LINKS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Labs', href: '/dashboard/labs' },
  { label: 'Diet', href: '/dashboard/diet' },
  { label: 'Treatments', href: '/dashboard/treatments' },
  { label: 'Symptoms', href: '/dashboard/symptoms' },
  { label: 'Summary', href: '/dashboard/summary' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-semibold text-gray-900">ChronicPal</span>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">{session.user?.email}</span>
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
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
