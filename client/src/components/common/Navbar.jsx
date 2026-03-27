import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-sm group-hover:shadow-gold transition-shadow">
              S
            </div>
            <span className="font-display font-bold text-xl text-navy-900">
              Smart<span className="text-brand-600">Stay</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/hotels"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/hotels') ? 'bg-brand-50 text-brand-700' : 'text-navy-700 hover:bg-gray-100'
              }`}
            >
              Explore Hotels
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-brand-50 text-brand-700' : 'text-navy-700 hover:bg-gray-100'
                }`}
              >
                My Bookings
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin') ? 'bg-brand-50 text-brand-700' : 'text-navy-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-700 font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-navy-800">{user?.name?.split(' ')[0]}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slide-up">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-navy-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      My Bookings
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-gray-50 transition-colors"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !px-4 !py-2 !text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 !text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 animate-slide-up">
          <Link to="/hotels" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg text-navy-700 hover:bg-gray-50">
            Explore Hotels
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg text-navy-700 hover:bg-gray-50">
              My Bookings
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 rounded-lg text-navy-700 hover:bg-gray-50">
              Admin Panel
            </Link>
          )}
          <div className="pt-2 border-t border-gray-100 flex gap-2">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="w-full btn-secondary !text-sm text-red-600">
                Sign Out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 btn-secondary !text-sm text-center">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary !text-sm text-center">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
