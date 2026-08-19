# 🏨 SmartStay – Dynamic Pricing Hotel Booking System

A full-stack MERN application with real-time dynamic pricing, live availability updates, and a complete hotel booking workflow.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js, REST API |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| HTTP Client | Axios |
| Payments | Razorpay Checkout |

---

## 📁 Project Structure

```
smartstay/
├── server/
│   ├── config/          # DB connection
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth, error handler
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── utils/           # Pricing engine, seed script
│   └── server.js        # Entry point
└── client/
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # Auth + Socket contexts
        ├── pages/       # Route pages
        └── services/    # API service layer
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & install dependencies

```bash
git clone https://github.com/Abhi31-balaga/SmartStay.git
cd smartstay
npm install
npm run install:all
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/smartstay
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NODE_ENV=development
```

### 3. Seed the database

```bash
cd server && npm run seed
```

This creates the initial demo data:
- 8 hotels across major Indian cities
- 32 rooms
- 3 test user accounts

To add three hotels in each of India's 28 states (92 hotels total, including the seeded hotels):

```bash
cd server && npm run add-indian-hotels
```

**Test Accounts:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@smartstay.com | admin123 |
| User | arjun@example.com | user123 |
| User | priya@example.com | user123 |

### 4. Start development servers

```bash
# From root directory
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |

### Hotels
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/hotels` | List hotels (with filters) |
| GET | `/api/hotels/:id` | Hotel detail |
| GET | `/api/hotels/cities` | Available cities |
| POST | `/api/hotels` | Create hotel (admin/owner) |

**Query params for GET /api/hotels:**
- `city` — filter by city (case-insensitive)
- `minPrice`, `maxPrice` — price range
- `minRating` — minimum average rating
- `page`, `limit` — pagination

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms/:hotelId` | Rooms for a hotel (with dynamic pricing) |

**Query params:**
- `checkIn`, `checkOut` — check availability for date range

### Pricing
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pricing/:roomId` | Get dynamic price |

**Query params:**
- `date` — single date pricing
- `checkIn`, `checkOut` — total price for date range

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/order` | User | Create a Razorpay order for a booking |
| POST | `/api/payments/verify` | User | Verify Razorpay payment and confirm booking |
| POST | `/api/bookings` | User | Direct booking creation is blocked; payment is required |
| GET | `/api/bookings/user` | User | My bookings |
| GET | `/api/bookings/:id` | User/Admin | Booking detail |
| DELETE | `/api/bookings/:id` | User/Admin | Cancel booking |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/bookings` | Admin | All bookings |

Admin detail pages:
- `/admin/bookings` - all bookings
- `/admin/users` - registered users
- `/admin/hotels` - active hotels
- `/admin/metrics` - occupancy and platform metrics

### Payments

SmartStay uses Razorpay in INR. The booking flow creates a pending booking, opens Razorpay Checkout, verifies the payment signature on the server, and only then marks the booking as confirmed and reduces room availability.

Use Razorpay test keys during development. Never commit `server/.env`; it is ignored by Git. The public Razorpay key is sent to the browser, while `RAZORPAY_KEY_SECRET` stays on the server.

---

## 💰 Dynamic Pricing Engine

Located in `server/utils/pricingEngine.js`

```
finalPrice = basePrice
           + demandCharge       (0–20% based on occupancy rate)
           + weekendCharge      (+15% on Fri/Sat/Sun)
           + seasonCharge       (+30% peak, -15% low season)
           - availabilityDiscount (discount if >70% available, premium if <2 left)
           - lastMinuteDiscount  (-8% if booking for today/tomorrow with low demand)
           - earlyBirdDiscount   (-5% if booking 30+ days in advance)
```

**Season Multipliers (India):**
- Peak (+30%): Dec, Jan, Apr, May, Jun, Oct
- Regular: Feb, Mar, Nov
- Low (-15%): Jul, Aug, Sep (monsoon)

**Minimum price floor:** 70% of base price (prevents race-to-bottom)

---

## ⚡ Real-Time Features (Socket.io)

The server emits these events on state changes:

| Event | Payload | Trigger |
|---|---|---|
| `booking_created` | `{ roomId, hotelId, availableRooms }` | When any user books a room |
| `booking_cancelled` | `{ roomId, hotelId, bookingId }` | When a booking is cancelled |

The hotel detail page subscribes to these events and updates availability counts live without any page refresh.

---

## 🔒 Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens expire after 7 days
- Role-based access control on all protected routes
- Hotel owners cannot assign themselves admin role
- Only booking owners or admins can view/cancel a booking

---

## 🚢 Deployment

### Frontend → Vercel
1. Push `client/` to GitHub
2. Import in Vercel, set build command: `npm run build`, output: `dist`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render / Railway
1. Push `server/` to GitHub
2. Set start command: `node server.js`
3. Add all env vars from `.env`

### Database → MongoDB Atlas
1. Create free cluster
2. Whitelist `0.0.0.0/0` for Render/Railway IP
3. Copy connection string to `MONGO_URI`

---

## 🧪 Key Design Decisions

1. **Conflict Detection:** Uses MongoDB query `checkIn < existingCheckOut && checkOut > existingCheckIn` to detect overlaps, then compares count against `totalRooms` for multi-room support.

2. **Socket.io in Controllers:** `req.io` is injected via middleware so any controller can emit events without coupling to the socket layer.

3. **Pricing at Query Time:** Room prices are calculated fresh on each API call based on current DB state, ensuring real-time accuracy without cached stale prices.

4. **JWT in Context:** `AuthContext` manages token storage and axios header injection centrally, avoiding repetitive auth code.
