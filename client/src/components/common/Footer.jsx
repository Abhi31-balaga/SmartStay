import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center font-display font-bold text-lg">S</div>
              <span className="font-display font-bold text-xl">SmartStay</span>
            </div>
            <p className="text-navy-300 text-sm leading-relaxed max-w-xs">
              India's first dynamic pricing hotel booking platform. Real-time availability, transparent pricing, and exceptional stays.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gold mb-4">Explore</h4>
            <ul className="space-y-2 text-navy-300 text-sm">
              <li><Link to="/hotels" className="hover:text-white transition-colors">All Hotels</Link></li>
              <li><Link to="/hotels?city=Mumbai" className="hover:text-white transition-colors">Mumbai</Link></li>
              <li><Link to="/hotels?city=Delhi" className="hover:text-white transition-colors">Delhi</Link></li>
              <li><Link to="/hotels?city=Bangalore" className="hover:text-white transition-colors">Bangalore</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gold mb-4">Account</h4>
            <ul className="space-y-2 text-navy-300 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Bookings</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-navy-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-navy-400 text-sm">© 2025 SmartStay. Built with the MERN Stack.</p>
          <div className="flex items-center gap-1 text-xs text-navy-500">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Dynamic Pricing Active
          </div>
        </div>
      </div>
    </footer>
  );
}
