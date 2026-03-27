import { useState } from 'react';
import { format, isPast } from 'date-fns';
import { MapPin, Calendar, Hash, Loader2, X } from 'lucide-react';
import { bookingService } from '../../services/api';

const statusConfig = {
  confirmed: { label: 'Confirmed', classes: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-600' },
  completed: { label: 'Completed', classes: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
};

export default function BookingCard({ booking, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  const nights = Math.ceil((checkOut - checkIn) / 86400000);
  const isUpcoming = !isPast(checkIn) && booking.status === 'confirmed';
  const isPastBooking = isPast(checkOut) || booking.status === 'completed';

  const statusCfg = statusConfig[booking.status] || statusConfig.pending;

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(true);
    setError('');
    try {
      await bookingService.cancel(booking._id);
      if (onCancel) onCancel(booking._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const image = booking.hotelId?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="flex flex-col sm:flex-row">
        {/* Hotel image */}
        <div className="sm:w-36 h-32 sm:h-auto flex-shrink-0">
          <img
            src={image}
            alt={booking.hotelId?.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'; }}
          />
        </div>

        {/* Details */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-display font-semibold text-navy-900 text-lg leading-tight">
                {booking.hotelId?.name || 'Hotel'}
              </h3>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                <MapPin size={12} />
                <span>{booking.hotelId?.location?.city}</span>
                <span className="mx-1">·</span>
                <span>{booking.roomId?.type} Room</span>
              </div>
            </div>
            <span className={`badge ${statusCfg.classes} flex-shrink-0`}>{statusCfg.label}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Calendar size={10} />Check-in
              </div>
              <div className="font-medium text-navy-800">{format(checkIn, 'dd MMM yyyy')}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Calendar size={10} />Check-out
              </div>
              <div className="font-medium text-navy-800">{format(checkOut, 'dd MMM yyyy')}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Duration</div>
              <div className="font-medium text-navy-800">{nights} night{nights > 1 ? 's' : ''}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
                <Hash size={10} />{booking.bookingRef}
              </div>
              <div className="text-lg font-bold text-navy-900">
                ₹{booking.totalPrice?.toLocaleString('en-IN')}
              </div>
            </div>

            {isUpcoming && (
              <div>
                {error && <p className="text-red-500 text-xs mb-1">{error}</p>}
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
