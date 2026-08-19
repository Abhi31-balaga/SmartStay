import { useState, useEffect } from 'react';
import { X, Calendar, Users, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { bookingService, pricingService } from '../../services/api';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookingModal({ room, hotel, checkIn, checkOut, onClose, onSuccess }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    checkIn: checkIn || format(new Date(), 'yyyy-MM-dd'),
    checkOut: checkOut || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
    guestCount: 1,
    specialRequests: '',
  });
  const [pricing, setPricing] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nights = differenceInDays(new Date(formData.checkOut), new Date(formData.checkIn));

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchPrice = async () => {
      if (!formData.checkIn || !formData.checkOut || nights <= 0) return;
      setLoadingPrice(true);
      try {
        const { data } = await pricingService.getPrice(room._id, {
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
        });
        setPricing(data.data);
      } catch {
        setPricing(null);
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPrice();
  }, [formData.checkIn, formData.checkOut, room._id, isAuthenticated, nights]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (nights <= 0) {
      setError('Check-out must be after check-in');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { data } = await bookingService.createCheckoutSession({
        roomId: room._id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guestCount: formData.guestCount,
        specialRequests: formData.specialRequests,
      });
      window.location.assign(data.data.checkoutUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = pricing?.totalPrice || (room.basePrice * Math.max(nights, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">Complete Booking</h2>
                <p className="text-sm text-gray-500">{room.type} Room · {hotel.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                    <Calendar size={12} className="inline mr-1" />Check-in
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                    <Calendar size={12} className="inline mr-1" />Check-out
                  </label>
                  <input
                    type="date"
                    value={formData.checkOut}
                    min={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                  <Users size={12} className="inline mr-1" />Guests
                </label>
                <select
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })}
                  className="input-field text-sm"
                >
                  {Array.from({ length: room.maxOccupancy || 2 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} Guest{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Special requests */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="e.g. Late check-in, extra pillows..."
                  className="input-field text-sm resize-none"
                />
              </div>

              {/* Price summary */}
              <div className="bg-navy-50 rounded-2xl p-4">
                <div className="text-sm font-medium text-navy-700 mb-3">Price Summary</div>
                {loadingPrice ? (
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-3/4" />
                  </div>
                ) : nights > 0 ? (
                  <div className="space-y-1.5 text-sm">
                    {pricing?.nightlyBreakdown?.slice(0, 3).map((n) => (
                      <div key={n.date} className="flex justify-between text-gray-600">
                        <span>{format(new Date(n.date), 'EEE, dd MMM')}</span>
                        <span>₹{n.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {pricing?.nights > 3 && (
                      <div className="text-gray-400 text-xs">+{pricing.nights - 3} more nights...</div>
                    )}
                    <div className="flex justify-between font-bold text-navy-900 border-t border-navy-200 pt-2 mt-2">
                      <span>{nights} night{nights > 1 ? 's' : ''} total</span>
                      <span className="text-brand-700">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">Please select valid dates</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || nights <= 0}
                className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" />Processing...</>
                ) : (
                  <><CreditCard size={18} />{isAuthenticated ? `Confirm Booking · ₹${totalPrice.toLocaleString('en-IN')}` : 'Sign in to Book'}</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Secure payment powered by Stripe · Free cancellation
              </p>
            </div>
        </>
      </div>
    </div>
  );
}
