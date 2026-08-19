import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach stored token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Named service helpers
export const hotelService = {
  getAll: (params) => api.get('/hotels', { params }),
  getById: (id) => api.get(`/hotels/${id}`),
  getCities: () => api.get('/hotels/cities'),
  create: (data) => api.post('/hotels', data),
};

export const roomService = {
  getByHotel: (hotelId, params) => api.get(`/rooms/${hotelId}`, { params }),
};

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  createCheckoutSession: (data) => api.post('/payments/checkout-session', data),
  getMyBookings: (params) => api.get('/bookings/user', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

export const pricingService = {
  getPrice: (roomId, params) => api.get(`/pricing/${roomId}`, { params }),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllBookings: (params) => api.get('/admin/bookings', { params }),
};

export const reviewService = {
  getByHotel: (hotelId) => api.get(`/reviews/${hotelId}`),
  create: (data) => api.post('/reviews', data),
};
