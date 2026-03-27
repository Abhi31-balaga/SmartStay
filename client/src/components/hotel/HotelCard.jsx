import { Link } from 'react-router-dom';
import { Star, MapPin, Wifi, Coffee, Dumbbell, Waves } from 'lucide-react';

const amenityIcons = {
  'Free WiFi': Wifi,
  'Restaurant': Coffee,
  'Fitness Center': Dumbbell,
  'Swimming Pool': Waves,
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-sm font-medium text-navy-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function HotelCard({ hotel }) {
  const image = hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
  const isLowAvailability = hotel.hasAvailability && hotel.availableRooms <= 3;

  return (
    <Link to={`/hotels/${hotel._id}`} className="group block">
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={image}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600'; }}
          />
          {/* Star category badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-0.5">
            {Array.from({ length: hotel.starCategory || 3 }).map((_, i) => (
              <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
          {/* Availability badge */}
          {!hotel.hasAvailability && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-lg">
              Sold Out
            </div>
          )}
          {isLowAvailability && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-lg animate-pulse">
              Almost Full!
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-navy-900 text-lg leading-tight group-hover:text-brand-600 transition-colors line-clamp-1">
              {hotel.name}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin size={13} />
            <span>{hotel.location?.city}, {hotel.location?.country}</span>
          </div>

          <div className="mb-4">
            <StarRating rating={hotel.rating?.average || 0} />
            <span className="text-xs text-gray-400 mt-0.5 block">{hotel.rating?.count || 0} reviews</span>
          </div>

          {/* Amenity icons */}
          <div className="flex items-center gap-2 mb-4">
            {hotel.amenities?.slice(0, 4).map((amenity) => {
              const Icon = amenityIcons[amenity];
              return Icon ? (
                <div key={amenity} title={amenity} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon size={13} className="text-gray-500" />
                </div>
              ) : null;
            })}
            {hotel.amenities?.length > 4 && (
              <span className="text-xs text-gray-400">+{hotel.amenities.length - 4} more</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Starting from</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-navy-900">
                  ₹{hotel.minPrice?.toLocaleString('en-IN') || '—'}
                </span>
                <span className="text-gray-400 text-sm">/night</span>
              </div>
              <span className="text-xs text-brand-600 font-medium">Dynamic pricing active</span>
            </div>
            <div className="btn-primary !py-2 !px-4 !text-sm group-hover:shadow-gold">
              View Rooms
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
