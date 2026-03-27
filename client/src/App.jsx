import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import HotelsPage from './pages/HotelsPage';
import HotelDetailPage from './pages/HotelDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AddHotelPage from './pages/AddHotelPage';

// Pages that shouldn't show Navbar/Footer
const FULLSCREEN_ROUTES = ['/login', '/register'];

function Layout({ children }) {
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => window.location.pathname.startsWith(r));
  if (isFullscreen) return children;
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/hotels/:id" element={<HotelDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route     
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/add-hotel"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AddHotelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center pt-20 flex-col gap-4">
                    <div className="text-6xl">🏨</div>
                    <h1 className="font-display text-3xl font-bold text-navy-900">Page Not Found</h1>
                    <a href="/" className="btn-primary">Go Home</a>
                  </div>
                }
              />
            </Routes>
          </Layout>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
