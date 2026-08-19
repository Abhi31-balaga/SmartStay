import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { adminService, hotelService } from '../services/api';

const pageConfig = {
  bookings: { title: 'All Bookings', description: 'Review every booking on the platform.' },
  users: { title: 'Registered Users', description: 'Review user accounts registered on SmartStay.' },
  hotels: { title: 'Active Hotels', description: 'Review the hotels currently listed on the platform.' },
  metrics: { title: 'Occupancy & Metrics', description: 'Review the current platform performance metrics.' },
};

const statusColors = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
};

export default function AdminDetailPage() {
  const { section } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const config = pageConfig[section] || pageConfig.metrics;

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = section === 'bookings'
          ? await adminService.getAllBookings({ limit: 100 })
          : section === 'hotels'
            ? await hotelService.getAll({ limit: 100 })
            : await adminService.getStats();
        setContent(response.data.data);
      } catch {
        setError(`Failed to load ${config.title.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [section, config.title]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-6">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">{config.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{config.description}</p>
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-brand-600" /></div>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && section === 'users' && <UsersTable users={content?.registeredUsers || []} />}
        {!loading && !error && section === 'bookings' && <BookingsTable bookings={content || []} />}
        {!loading && !error && section === 'hotels' && <HotelsTable hotels={content || []} />}
        {!loading && !error && section === 'metrics' && <Metrics overview={content?.overview} />}
      </div>
    </div>
  );
}

function UsersTable({ users }) {
  return (
    <DataTable headers={['Name', 'Email', 'Role', 'Registered']}>
      {users.map((user) => (
        <tr key={user._id} className="border-b border-gray-50">
          <td className="py-3 font-medium text-navy-800">{user.name}</td>
          <td className="py-3 text-gray-500">{user.email}</td>
          <td className="py-3"><span className="badge bg-blue-100 text-blue-700">{user.role}</span></td>
          <td className="py-3 text-gray-500">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
        </tr>
      ))}
    </DataTable>
  );
}

function BookingsTable({ bookings }) {
  return (
    <DataTable headers={['Booking Ref', 'Guest', 'Hotel', 'Check-in', 'Amount', 'Status']}>
      {bookings.map((booking) => (
        <tr key={booking._id} className="border-b border-gray-50">
          <td className="py-3 font-mono text-xs text-gray-500">{booking.bookingRef}</td>
          <td className="py-3 text-gray-700">{booking.userId?.name}</td>
          <td className="py-3 text-gray-700">{booking.hotelId?.name}</td>
          <td className="py-3 text-gray-500">{format(new Date(booking.checkIn), 'dd MMM yyyy')}</td>
          <td className="py-3 font-semibold text-navy-900">₹{booking.totalPrice?.toLocaleString('en-IN')}</td>
          <td className="py-3"><span className={`badge ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>{booking.status}</span></td>
        </tr>
      ))}
    </DataTable>
  );
}

function HotelsTable({ hotels }) {
  return (
    <DataTable headers={['Hotel', 'Location', 'Category', 'Rating']}>
      {hotels.map((hotel) => (
        <tr key={hotel._id} className="border-b border-gray-50">
          <td className="py-3 font-medium text-navy-800">{hotel.name}</td>
          <td className="py-3 text-gray-500">{hotel.location?.city}, {hotel.location?.country}</td>
          <td className="py-3 text-gray-500">{hotel.starCategory}-star</td>
          <td className="py-3 text-gray-700">{hotel.rating?.average || 0} ({hotel.rating?.count || 0})</td>
        </tr>
      ))}
    </DataTable>
  );
}

function Metrics({ overview = {} }) {
  const metrics = [
    ['Total Bookings', overview.totalBookings || 0],
    ['Registered Users', overview.totalUsers || 0],
    ['Active Hotels', overview.totalHotels || 0],
    ['Total Rooms', overview.totalRooms || 0],
    ['Total Revenue', `₹${(overview.totalRevenue || 0).toLocaleString('en-IN')}`],
    ['Average Booking Value', `₹${(overview.avgBookingValue || 0).toLocaleString('en-IN')}`],
    ['Occupancy Rate', `${overview.occupancyRate || 0}%`],
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="card p-5">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-navy-900 mt-2">{value}</p>
        </div>
      ))}
    </div>
  );
}

function DataTable({ headers, children }) {
  return (
    <div className="card p-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-100">
            {headers.map((header) => <th key={header} className="pb-3 font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
