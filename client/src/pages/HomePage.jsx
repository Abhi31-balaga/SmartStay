import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Zap, Shield, Clock } from 'lucide-react';
import { hotelService } from '../services/api';
import HotelCard from '../components/hotel/HotelCard';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Jaipur'];

export default function HomePage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hotelService.getAll({ limit: 4 })
      .then(({ data }) => setFeaturedHotels(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/hotels${city ? `?city=${city}` : ''}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600"
            alt="Luxury hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/50 to-navy-900/80" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-4 py-2 text-sm mb-6">
            <Zap size={14} className="text-gold" />
            <span>Dynamic Pricing — Always the Fairest Rate</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Stay Smarter,<br />
            <span className="text-gold">Pay Smarter</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Real-time hotel pricing that adapts to demand, season, and availability. 
            Book with full transparency — no hidden fees.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 px-3">
              <MapPin size={18} className="text-brand-500 flex-shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-1 outline-none text-navy-800 text-sm bg-transparent font-medium"
              >
                <option value="">All Destinations</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 !rounded-xl">
              <Search size={18} />
              Search Hotels
            </button>
          </form>

          {/* Quick city links */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {CITIES.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => navigate(`/hotels?city=${c}`)}
                className="text-white/70 hover:text-white text-sm px-3 py-1 rounded-full border border-white/20 hover:border-white/50 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap size={28} className="text-brand-600" />,
                title: 'Dynamic Pricing',
                desc: 'Prices update in real-time based on demand, season, weekends, and remaining availability — you always see the current fair price.',
              },
              {
                icon: <Clock size={28} className="text-brand-600" />,
                title: 'Real-Time Availability',
                desc: 'Powered by Socket.io, availability updates instantly as others book. Never get a booking error on arrival.',
              },
              {
                icon: <Shield size={28} className="text-brand-600" />,
                title: 'Secure & Transparent',
                desc: 'JWT-secured booking flow with a complete pricing breakdown. No surprise fees — every rupee is explained upfront.',
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl bg-gray-50 hover:bg-brand-50 transition-colors group">
                <div className="w-14 h-14 bg-brand-100 group-hover:bg-brand-200 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-navy-900 text-lg mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="section-title">Featured Hotels</h2>
              <p className="text-gray-500 mt-1">Handpicked stays with dynamic pricing</p>
            </div>
            <button onClick={() => navigate('/hotels')} className="btn-secondary !py-2 !px-4 !text-sm">
              View All
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton h-52 w-full" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredHotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Pricing Explainer */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              How Dynamic Pricing Works
            </h2>
            <p className="text-navy-300 max-w-xl mx-auto">
              Our pricing engine factors in multiple real-world signals to give you the most accurate rate.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { emoji: '📊', label: 'Base Price', desc: 'Room\'s standard rate' },
              { emoji: '🔥', label: 'Demand', desc: 'Active booking volume' },
              { emoji: '🏨', label: 'Availability', desc: 'Rooms remaining' },
              { emoji: '📅', label: 'Weekend', desc: 'Fri–Sun multiplier' },
              { emoji: '🌸', label: 'Season', desc: 'Peak vs off-season' },
            ].map((item, i) => (
              <div key={i} className="bg-navy-800 rounded-2xl p-5 text-center hover:bg-navy-700 transition-colors">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="font-semibold text-white text-sm mb-1">{item.label}</div>
                <div className="text-navy-400 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-navy-800 rounded-2xl p-6 font-mono text-sm text-center text-navy-300">
            <span className="text-white">finalPrice</span> = basePrice + demandCharge + weekendCharge + seasonCharge − availabilityDiscount
          </div>
        </div>
      </section>
    </div>
  );
}
