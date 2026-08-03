import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, QrCode, Activity, LogOut, Shield } from 'lucide-react';
import { useAuth } from './context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Patients' },
    { path: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
    { path: '/admin/records', icon: QrCode, label: 'QR Logs' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col shrink-0">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-purple-600 p-2 rounded-lg"><Shield className="h-5 w-5 text-white" /></div>
            <span className="font-semibold text-lg">HealthCard</span>
          </Link>
        </div>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-700 font-semibold shrink-0">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <Icon className="h-5 w-5 shrink-0" /><span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full">
            <LogOut className="h-5 w-5" /><span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
