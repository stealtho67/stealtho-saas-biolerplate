import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">NextCut</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button onClick={signOut} className="text-sm text-red-600 hover:underline">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {profile?.full_name || '—'}</p>
            <p><span className="text-gray-500">Email:</span> {user?.email}</p>
            <p><span className="text-gray-500">Role:</span> {profile?.role || 'user'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Your NextCut dashboard</h2>
          <p className="text-gray-500">Add your Base44 components here.</p>
        </div>
      </main>
    </div>
  );
}
