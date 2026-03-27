import { useState, useEffect } from 'react';
import { Users, Maximize2, Bed, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { pricingService } from '../../services/api';
import { format } from 'date-fns';

function PriceTag({ tag }) {
  const classes = {
    urgent: 'badge-urgent',
    warning: 'badge-warning',
    info: 'badge-info',
    deal: 'badge-deal',
    peak: 'badge-peak',
  };
  return <span className={classes[tag.type] || 'badge bg-gray-100 text-gray-600'}>{tag.label}</span>;
}

export default function RoomCard({ room, checkIn, checkOut, onBook }) {
  const [pricing, setPricing] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      setLoadingPrice(true);
      try {
        const params = {};
        if (checkIn && checkOut) {
          params.checkIn = format(new Date(checkIn), 'yyyy-MM-dd');
          params.checkOut = format(new Date(checkOut), 'yyyy-MM-dd');
        } else {
          params.date = format(new Date(), 'yyyy-MM-dd');
        }
        const { data } = await pricingService.getPrice(room._id, params);
        setPricing(data.data);
      } catch {
        // fallback to static price
        setPricing(null);
      } finally {
        setLoadingPrice(false);
      }
    };
    fetchPricing();
  }, [room._id, checkIn, checkOut]);

  const displayPrice = pricing?.finalPrice || room.dynamicPrice || room.basePrice;
  const priceChange = displayPrice - room.basePrice;
  const priceChangePercent = ((priceChange / room.basePrice) * 100).toFixed(0);

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)
    : null;

  const totalPrice = nights ? pricing?.totalPrice || displayPrice * nights : null;

  return (
    <div className={`card p-6 transition-all duration-300 ${!room.isAvailableForDates ? 'opacity-60' : 'hover:-translate-y-1'}`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Room image */}
        <div className="md:w-48 h-36 md:h-auto rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'}
            alt={room.type}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'; }}
          />
        </div>

        {/* Room info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-display font-semibold text-xl text-navy-900">{room.type} Room</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                {room.bedType && (
                  <span className="flex items-center gap-1"><Bed size={13} /> {room.bedType} Bed</span>
                )}
                {room.maxOccupancy && (
                  <span className="flex items-center gap-1"><Users size={13} /> {room.maxOccupancy} Guests</span>
                )}
                {room.size && (
                  <span className="flex items-center gap-1"><Maximize2 size={13} /> {room.size} sq ft</span>
                )}
              </div>
            </div>
            {/* Availability */}
            <div className="text-right">
              {room.isAvailableForDates !== false ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  {room.availableRooms} left
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <AlertCircle size={11} /> Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {room.amenities.slice(0, 5).map((a) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{a}</span>
              ))}
            </div>
          )}

          {/* Price tags */}
          {(room.priceTags || pricing?.tags)?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(room.priceTags || pricing?.tags || []).map((tag, i) => (
                <PriceTag key={i} tag={tag} />
              ))}
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="flex items-end justify-between mt-auto pt-3 border-t border-gray-100">
            <div>
              {loadingPrice ? (
                <div className="skeleton h-8 w-24 mb-1" />
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-navy-900">
                      ₹{displayPrice?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-400 text-sm">/night</span>
                    {priceChange !== 0 && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${priceChange > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {priceChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(priceChangePercent)}% {priceChange > 0 ? 'surge' : 'off'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Base price: ₹{room.basePrice?.toLocaleString('en-IN')}
                  </div>
                  {nights && totalPrice && (
                    <div className="text-sm font-semibold text-brand-700 mt-1">
                      ₹{totalPrice.toLocaleString('en-IN')} total for {nights} night{nights > 1 ? 's' : ''}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => onBook(room, displayPrice)}
              disabled={!room.isAvailableForDates}
              className={`${room.isAvailableForDates !== false ? 'btn-gold' : 'bg-gray-200 text-gray-400 cursor-not-allowed px-6 py-3 rounded-xl font-medium'} transition-all`}
            >
              {room.isAvailableForDates !== false ? 'Book Now' : 'Unavailable'}
            </button>
          </div>

          {/* Price breakdown tooltip */}
          {pricing?.breakdown && (
            <div className="mt-2 text-xs text-gray-400 flex flex-wrap gap-3">
              {pricing.breakdown.demandCharge > 0 && (
                <span>+₹{pricing.breakdown.demandCharge} demand</span>
              )}
              {pricing.breakdown.weekendCharge > 0 && (
                <span>+₹{pricing.breakdown.weekendCharge} weekend</span>
              )}
              {pricing.breakdown.seasonCharge > 0 && (
                <span>+₹{pricing.breakdown.seasonCharge} season</span>
              )}
              {pricing.breakdown.availabilityDiscount > 0 && (
                <span className="text-green-600">-₹{pricing.breakdown.availabilityDiscount} discount</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
