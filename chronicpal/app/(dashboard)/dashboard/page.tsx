import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {session?.user?.email}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Labs', 'Treatments', 'Symptoms'].map((name) => (
          <a
            key={name}
            href={`/${name.toLowerCase()}`}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-medium text-gray-800">{name}</h2>
            <p className="text-sm text-gray-500 mt-1">View and log your {name.toLowerCase()}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
