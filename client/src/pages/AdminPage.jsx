import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { TrendingUp, Users, Hotel, BookOpen, DollarSign, Loader2, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-navy-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => setError('Failed to load admin stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 text-red-500">{error}</div>
    );
  }

  const { overview, monthlyRevenue, popularHotels, recentBookings } = stats || {};

  // Simple bar chart using divs
  const maxRevenue = Math.max(...(monthlyRevenue || []).map((m) => m.revenue), 1);

  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-3 justify-between">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">SmartStay platform overview</p>
          </div>
          <div className="ml-auto">
            <Link to="/admin/add-hotel" className="btn-primary">Add Hotel</Link>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<BookOpen size={20} className="text-brand-600" />} label="Total Bookings" value={overview?.totalBookings || 0} color="bg-brand-100" />
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Registered Users" value={overview?.totalUsers || 0} color="bg-blue-100" />
          <StatCard icon={<Hotel size={20} className="text-purple-600" />} label="Active Hotels" value={overview?.totalHotels || 0} color="bg-purple-100" />
          <StatCard
            icon={<TrendingUp size={20} className="text-green-600" />}
            label="Occupancy Rate"
            value={`${overview?.occupancyRate || 0}%`}
            sub="Current occupancy"
            color="bg-green-100"
          />
        </div>

        {/* Revenue + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card p-6">
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-1">Monthly Revenue</h2>
            <p className="text-gray-400 text-sm mb-5">Last 6 months performance</p>
            {monthlyRevenue && monthlyRevenue.length > 0 ? (
              <div className="flex items-end gap-3 h-48">
                {monthlyRevenue.map((m, i) => {
                  const height = Math.round((m.revenue / maxRevenue) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-medium">
                        ₹{(m.revenue / 1000).toFixed(0)}k
                      </span>
                      <div
                        className="w-full bg-brand-500 rounded-t-lg hover:bg-brand-600 transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`₹${m.revenue.toLocaleString('en-IN')}`}
                      />
                      <span className="text-xs text-gray-400">{MONTH_NAMES[m._id.month]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No revenue data yet
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Total Revenue</span>
                <span className="font-bold text-navy-900">₹{(overview?.totalRevenue || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Avg. Booking Value</span>
                <span className="font-bold text-navy-900">₹{(overview?.avgBookingValue || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Total Rooms</span>
                <span className="font-bold text-navy-900">{overview?.totalRooms || 0}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-500 text-sm">Occupancy</span>
                  <span className="font-bold text-brand-700">{overview?.occupancyRate || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${overview?.occupancyRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Hotels */}
        {popularHotels?.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">Top Hotels by Bookings</h2>
            <div className="space-y-3">
              {popularHotels.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-navy-800 text-sm">{h.hotel?.name}</p>
                      <p className="text-gray-400 text-xs">{h.hotel?.location?.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy-900 text-sm">{h.bookings} bookings</p>
                    <p className="text-gray-400 text-xs">₹{h.revenue?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Booking Ref</th>
                  <th className="pb-3 font-medium">Guest</th>
                  <th className="pb-3 font-medium">Hotel</th>
                  <th className="pb-3 font-medium">Check-in</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentBookings || []).map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-mono text-xs text-gray-500">{b.bookingRef}</td>
                    <td className="py-3">
                      <p className="font-medium text-navy-800">{b.userId?.name}</p>
                      <p className="text-gray-400 text-xs">{b.userId?.email}</p>
                    </td>
                    <td className="py-3 text-navy-700">{b.hotelId?.name}</td>
                    <td className="py-3 text-gray-500">{format(new Date(b.checkIn), 'dd MMM yyyy')}</td>
                    <td className="py-3 font-semibold text-navy-900">₹{b.totalPrice?.toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span className={`badge ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentBookings?.length && (
              <p className="text-center text-gray-400 py-8">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
