import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { hotelService } from '../services/api';
import HotelCard from '../components/hotel/HotelCard';

export default function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
  });

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minRating) params.minRating = filters.minRating;

      const { data } = await hotelService.getAll(params);
      setHotels(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // load cities for quick-filters
  useEffect(() => {
    let mounted = true;
    const fetchCities = async () => {
      setCitiesLoading(true);
      try {
        const { data } = await hotelService.getCities();
        if (mounted) setCities(data.data || []);
      } catch (err) {
        if (mounted) setCities([]);
      } finally {
        if (mounted) setCitiesLoading(false);
      }
    };
    fetchCities();
    return () => {
      mounted = false;
    };
  }, []);

  const applyFilters = () => {
    const params = {};
    if (filters.city) params.city = filters.city;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating) params.minRating = filters.minRating;
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ city: '', minPrice: '', maxPrice: '', minRating: '' });
    setSearchParams({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-navy-900 truncate">
              {filters.city ? `Hotels in ${filters.city}` : 'All Hotels'}
            </h1>
            <p className="text-sm text-gray-400">{loading ? '…' : `${total} properties found`}</p>
          </div>

          {/* City quick-filters */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 flex-nowrap">
            <button
              onClick={() => setFilters({ ...filters, city: '' })}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !filters.city ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              All
            </button>
            {citiesLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400">Loading…</div>
            ) : (
              cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilters({ ...filters, city: c })}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    filters.city === c ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {c}
                </button>
              ))
            )}
          </div>

          {/* Advanced filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0 ${
              activeFilterCount > 0 ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Price (₹/night)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="input-field !w-36 !py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Price (₹/night)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="input-field !w-36 !py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                  className="input-field !w-32 !py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={applyFilters} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1">
                  <Search size={14} /> Apply
                </button>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary !py-2 !px-3 !text-sm flex items-center gap-1 text-red-500">
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hotel grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-52" />
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏨</div>
            <h3 className="font-display text-xl font-semibold text-navy-900 mb-2">No hotels found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search a different city.</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
