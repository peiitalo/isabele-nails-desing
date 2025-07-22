import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ClientLayout from './layouts/ClientLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/client/Home'
import Services from './pages/client/Services'
import Booking from './pages/client/Booking'
import Profile from './pages/client/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminBookings from './pages/admin/Bookings'
import AdminServices from './pages/admin/Services'
import AdminClients from './pages/admin/Clients'
import Login from './pages/Login'
import AdminLogin from './pages/admin/AdminLogin'
import Register from './pages/Register'
import AdminCalendar from './pages/admin/Calendar';
import WorkingHours from './pages/admin/WorkingHours';
import SpecialDays from './pages/admin/SpecialDays';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Rotas públicas */}
        <Route path="/login" element={<PageFade><Login /></PageFade>} />
        <Route path="/register" element={<PageFade><Register /></PageFade>} />
        <Route path="/admin/login" element={<PageFade><AdminLogin /></PageFade>} />
        {/* Rotas do cliente */}
        <Route path="/" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route index element={<PageFade><Home /></PageFade>} />
          <Route path="services" element={<PageFade><Services /></PageFade>} />
          <Route path="booking" element={<PageFade><Booking /></PageFade>} />
          <Route path="profile" element={<PageFade><Profile /></PageFade>} />
        </Route>
        {/* Rotas do admin */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<PageFade><AdminDashboard /></PageFade>} />
          <Route path="bookings" element={<PageFade><AdminBookings /></PageFade>} />
          <Route path="services" element={<PageFade><AdminServices /></PageFade>} />
          <Route path="clients" element={<PageFade><AdminClients /></PageFade>} />
          <Route path="/admin/calendar" element={<PageFade><AdminCalendar /></PageFade>} />
          <Route path="/admin/working-hours" element={<PageFade><WorkingHours /></PageFade>} />
          <Route path="/admin/special-days" element={<PageFade><SpecialDays /></PageFade>} />
        </Route>
        {/* Rota padrão - redireciona para login se não autenticado */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AnimatedRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                fontSize: '1rem',
                borderRadius: '8px',
                boxShadow: '0 2px 12px #0001',
                border: '1px solid #f3f3f3',
              },
              success: { iconTheme: { primary: '#ec4899', secondary: '#fff' } },
              error: { iconTheme: { primary: '#be185d', secondary: '#fff' } },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App; 