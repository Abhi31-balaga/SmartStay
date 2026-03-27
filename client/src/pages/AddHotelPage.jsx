import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelService } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function AddHotelPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    country: 'India',
    lat: '',
    lng: '',
    images: '',
    amenities: '',
    starCategory: 3,
    checkIn: '14:00',
    checkOut: '11:00',
    cancellation: 'Free cancellation up to 24 hours before check-in',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.description || !form.city || !form.address) {
      setError('Please fill required fields');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      location: {
        city: form.city,
        address: form.address,
        country: form.country,
        coordinates: {
          lat: form.lat ? parseFloat(form.lat) : undefined,
          lng: form.lng ? parseFloat(form.lng) : undefined,
        },
      },
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
      starCategory: parseInt(form.starCategory) || 3,
      policies: {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        cancellation: form.cancellation,
      },
    };

    try {
      setLoading(true);
      await hotelService.create(payload);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="font-display text-2xl font-bold mb-4">Add New Hotel</h1>
        <form onSubmit={handleSubmit} className="space-y-4 card p-6">
          {error && <div className="text-red-600">{error}</div>}
          <div>
            <label className="block text-sm text-gray-600">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input mt-1 w-full" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input mt-1 w-full h-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">City *</label>
              <input name="city" value={form.city} onChange={handleChange} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Address *</label>
              <input name="address" value={form.address} onChange={handleChange} className="input mt-1 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Country</label>
              <input name="country" value={form.country} onChange={handleChange} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Latitude</label>
              <input name="lat" value={form.lat} onChange={handleChange} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Longitude</label>
              <input name="lng" value={form.lng} onChange={handleChange} className="input mt-1 w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Images (comma separated URLs)</label>
            <input name="images" value={form.images} onChange={handleChange} className="input mt-1 w-full" />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Amenities (comma separated)</label>
            <input name="amenities" value={form.amenities} onChange={handleChange} className="input mt-1 w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Star Category</label>
              <select name="starCategory" value={form.starCategory} onChange={handleChange} className="input mt-1 w-full">
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Check-In</label>
              <input name="checkIn" value={form.checkIn} onChange={handleChange} className="input mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Check-Out</label>
              <input name="checkOut" value={form.checkOut} onChange={handleChange} className="input mt-1 w-full" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600">Cancellation Policy</label>
            <input name="cancellation" value={form.cancellation} onChange={handleChange} className="input mt-1 w-full" />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Create Hotel'}
            </button>
            <button type="button" onClick={() => navigate('/admin')} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
