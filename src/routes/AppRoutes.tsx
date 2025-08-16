import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Departments } from '../pages/Departments';
import { Services } from '../pages/Services';
import { Appointments } from '../pages/Appointments';
// import Citizens from '../pages/Citizens';
import { Officers } from '../pages/Officers';
import { Feedback } from '../pages/Feedback';
import { AppointmentDetails } from '../pages/AppointmentDetails';
import { DocumentView } from '../pages/DocumentView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Departments />
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Services />
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/:appointmentId"
        element={
          <ProtectedRoute>
            <AppointmentDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/:appointmentId/documents/:documentId"
        element={
          <ProtectedRoute>
            <DocumentView />
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/citizens"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Citizens />
            </AdminRoute>
          </ProtectedRoute>
        }
      /> */}

      <Route
        path="/officers"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Officers />
            </AdminRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};