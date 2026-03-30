import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Contact from "../pages/Contact";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";

import ProtectedRoute from "./ProtectedRoute";

import DietitianDashboard from "../pages/dietitian/DietitianDashboard";
import ClientsPage from "../pages/dietitian/ClientsPage";
import ClientDetailPage from "../pages/dietitian/ClientDetailPage";
import DietitianAppointmentsPage from "../pages/dietitian/AppointmentsPage";
import DietitianProfilePage from "../pages/dietitian/ProfilePage";
import AvailabilityPage from "../pages/dietitian/AvailabilityPage";

import ClientDashboard from "../pages/client/ClientDashboard";
import ClientAppointmentsPage from "../pages/client/AppointmentsPage";
import RecordsPage from "../pages/client/RecordsPage";
import BookAppointmentPage from "../pages/client/BookAppointmentPage";
import ClientSettingsPage from "../pages/client/ClientSettingsPage";
import NotificationsPage from "../pages/NotificationsPage";
import NotFound from "../pages/NotFound";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/iletisim" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/dietitian/dashboard"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <DietitianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/clients"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/clients/:id"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <ClientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/appointments"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <DietitianAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/settings"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <DietitianProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/profile"
        element={<Navigate to="/dietitian/settings" replace />}
      />
      <Route
        path="/dietitian/availability"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <AvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dietitian/notifications"
        element={
          <ProtectedRoute allowedRole="dietitian">
            <NotificationsPage role="dietitian" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/appointments"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/records"
        element={
          <ProtectedRoute allowedRole="client">
            <RecordsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile"
        element={<Navigate to="/client/settings" replace />}
      />
      <Route
        path="/client/book-appointment"
        element={
          <ProtectedRoute allowedRole="client">
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/settings"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/water"
        element={<Navigate to="/client/dashboard" replace />}
      />
      <Route
        path="/client/notifications"
        element={
          <ProtectedRoute allowedRole="client">
            <NotificationsPage role="client" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRouter;