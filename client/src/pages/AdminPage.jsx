import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { TrendingUp, Users, Hotel, BookOpen, DollarSign, Loader2, BarChart2 } from 'lucide-react';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, sub, color, href }) {
  const content = (
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
  );

  if (href) {
    return (
      <a href={href} className="card p-5 block hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500">
        {content}
      </a>
    );
  }

  return <div className="card p-5">{content}</div>;
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

  const { overview, monthlyRevenue } = stats || {};

  // Simple bar chart using divs
  const maxRevenue = Math.max(...(monthlyRevenue || []).map((m) => m.revenue), 1);

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
          <StatCard icon={<BookOpen size={20} className="text-brand-600" />} label="Total Bookings" value={overview?.totalBookings || 0} color="bg-brand-100" href="/admin/bookings" />
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Registered Users" value={overview?.totalUsers || 0} color="bg-blue-100" href="/admin/users" />
          <StatCard icon={<Hotel size={20} className="text-purple-600" />} label="Active Hotels" value={overview?.totalHotels || 0} color="bg-purple-100" href="/admin/hotels" />
          <StatCard
            icon={<TrendingUp size={20} className="text-green-600" />}
            label="Occupancy Rate"
            value={`${overview?.occupancyRate || 0}%`}
            sub="Current occupancy"
            color="bg-green-100"
            href="/admin/metrics"
          />
        </div>

        {/* Revenue + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-3 card p-6" id="monthly-revenue">
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

        </div>
      </div>
    </div>
  );
}
