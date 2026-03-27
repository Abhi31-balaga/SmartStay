import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Star, Calendar, Wifi, Car, Coffee, Waves, Dumbbell, ArrowLeft, Loader2, WifiIcon } from 'lucide-react';
import { hotelService, roomService, reviewService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import RoomCard from '../components/hotel/RoomCard';
import BookingModal from '../components/booking/BookingModal';
import { format } from 'date-fns';

const amenityIconMap = {
  'Free WiFi': <Wifi size={15} />,
  'Swimming Pool': <Waves size={15} />,
  'Fitness Center': <Dumbbell size={15} />,
  'Valet Parking': <Car size={15} />,
  'Restaurant': <Coffee size={15} />,
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { socket } = useSocket();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [liveUpdate, setLiveUpdate] = useState(null);

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || format(new Date(), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(
    searchParams.get('checkOut') || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  );

  // Fetch hotel + rooms + reviews
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [hotelRes, roomsRes, reviewsRes] = await Promise.all([
          hotelService.getById(id),
          roomService.getByHotel(id, { checkIn, checkOut }),
          reviewService.getByHotel(id),
        ]);
        setHotel(hotelRes.data.data);
        setRooms(roomsRes.data.data || []);
        setReviews(reviewsRes.data.data || []);
      } catch {
        // handled by error boundary
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Re-fetch rooms when dates change
  useEffect(() => {
    if (!hotel) return;
    roomService.getByHotel(id, { checkIn, checkOut })
      .then(({ data }) => setRooms(data.data || []))
      .catch(() => {});
  }, [checkIn, checkOut, id, hotel]);

  // Socket.io real-time availability updates
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join_hotel', id);

    const handleBookingCreated = (data) => {
      if (data.hotelId === id || data.hotelId?.toString() === id) {
        // Update room availability live
        setRooms((prev) =>
          prev.map((r) =>
            r._id === data.roomId || r._id?.toString() === data.roomId?.toString()
              ? { ...r, availableRooms: data.availableRooms }
              : r
          )
        );
        setLiveUpdate({ type: 'booked', message: 'A room was just booked! Availability updated.' });
        setTimeout(() => setLiveUpdate(null), 4000);
      }
    };

    const handleBookingCancelled = (data) => {
      if (data.hotelId === id || data.hotelId?.toString() === id) {
        setRooms((prev) =>
          prev.map((r) =>
            r._id === data.roomId || r._id?.toString() === data.roomId?.toString()
              ? { ...r, availableRooms: (r.availableRooms || 0) + 1 }
              : r
          )
        );
        setLiveUpdate({ type: 'cancelled', message: 'A cancellation freed up a room!' });
        setTimeout(() => setLiveUpdate(null), 4000);
      }
    };

    socket.on('booking_created', handleBookingCreated);
    socket.on('booking_cancelled', handleBookingCancelled);

    return () => {
      socket.emit('leave_hotel', id);
      socket.off('booking_created', handleBookingCreated);
      socket.off('booking_cancelled', handleBookingCancelled);
    };
  }, [socket, id]);

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleBookingSuccess = () => {
    // Refresh rooms after booking
    roomService.getByHotel(id, { checkIn, checkOut })
      .then(({ data }) => setRooms(data.data || []))
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-4xl mb-3">🏨</div>
          <h2 className="font-display text-xl font-semibold text-navy-900">Hotel not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Live update toast */}
      {liveUpdate && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-slide-up flex items-center gap-2 ${
          liveUpdate.type === 'booked' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          {liveUpdate.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-gray-500 hover:text-navy-900 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to hotels
        </button>

        {/* Image gallery */}
        <div className="grid grid-cols-3 gap-3 h-72 md:h-96 rounded-3xl overflow-hidden mb-8">
          <div className="col-span-2 relative">
            <img
              src={hotel.images?.[activeImage] || hotel.images?.[0]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-3">
            {hotel.images?.slice(1, 3).map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(i + 1)}
                className="flex-1 cursor-pointer overflow-hidden rounded-xl hover:opacity-90 transition-opacity"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display text-3xl font-bold text-navy-900">{hotel.name}</h1>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl flex-shrink-0">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-navy-800">{hotel.rating?.average?.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({hotel.rating?.count})</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 mb-4">
                <MapPin size={15} />
                <span>{hotel.location?.address}, {hotel.location?.city}</span>
              </div>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities?.map((a) => (
                  <span key={a} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm text-navy-700">
                    {amenityIconMap[a] || null}
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Policies */}
            {hotel.policies && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-display text-xl font-semibold text-navy-900 mb-3">Hotel Policies</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Check-in</span><p className="font-medium mt-0.5">{hotel.policies.checkIn}</p></div>
                  <div><span className="text-gray-400">Check-out</span><p className="font-medium mt-0.5">{hotel.policies.checkOut}</p></div>
                  <div className="col-span-2"><span className="text-gray-400">Cancellation</span><p className="font-medium mt-0.5 text-green-700">{hotel.policies.cancellation}</p></div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-navy-900 mb-4">Guest Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 4).map((r) => (
                    <div key={r._id} className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-sm">
                          {r.userId?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900 text-sm">{r.userId?.name}</p>
                          <div className="flex">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={11} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — date picker + rooms */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h3 className="font-display font-semibold text-navy-900 text-lg mb-4">Select Dates</h3>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
                    <Calendar size={11} />Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
                    <Calendar size={11} />Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Real-time availability active
              </div>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-6">Available Rooms</h2>
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No rooms found</div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onBook={handleBookRoom}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          hotel={hotel}
          checkIn={checkIn}
          checkOut={checkOut}
          onClose={() => setShowModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
