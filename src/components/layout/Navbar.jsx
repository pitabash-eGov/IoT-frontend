import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cpu, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">IoT Dashboard</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
