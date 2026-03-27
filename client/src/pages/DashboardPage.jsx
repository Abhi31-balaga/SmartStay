import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/api';
import BookingCard from '../components/booking/BookingCard';
import { LayoutDashboard, Calendar, Clock, Loader2 } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All Bookings', icon: LayoutDashboard },
  { key: 'confirmed', label: 'Upcoming', icon: Calendar },
  { key: 'cancelled', label: 'Cancelled', icon: Clock },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchBookings = async (status) => {
    setLoading(true);
    try {
      const params = status && status !== 'all' ? { status } : {};
      const { data } = await bookingService.getMyBookings(params);
      setBookings(data.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab === 'all' ? '' : activeTab);
  }, [activeTab]);

  const handleCancelled = (id) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b))
    );
  };

  const upcomingCount = bookings.filter(
    (b) => b.status === 'confirmed' && new Date(b.checkIn) > new Date()
  ).length;

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900 mb-1">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500">Manage your hotel bookings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: '📋' },
            { label: 'Upcoming Stays', value: upcomingCount, icon: '✈️' },
            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: '💳' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="font-bold text-xl text-navy-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Booking list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="font-display text-xl font-semibold text-navy-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-4">Start exploring hotels and make your first booking.</p>
            <a href="/hotels" className="btn-primary inline-block">Explore Hotels</a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} onCancel={handleCancelled} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
