import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authService from './services/authService';
import LoginPage from './components/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';

// Protected Route component
function ProtectedRoute({ children }) {
  return authService.isAuthenticated() ? children : <Navigate to="/" replace />;
}

// Role-based Route component
function RoleBasedRoute({ children, allowedRoles }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const currentUser = authService.getCurrentUser();
  if (!currentUser || !allowedRoles.includes(currentUser.role_id)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Public Route component (redirect to dashboard if already authenticated)
function PublicRoute({ children }) {
  return authService.isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  console.log('App component rendered');

  // Define role IDs
  const EMPLOYEE_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7c';
  const MANAGER_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7b';
  const SUPER_ADMIN_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7a';

  // Get current user to determine dashboard
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && (currentUser.role_id === MANAGER_ROLE || currentUser.role_id === SUPER_ADMIN_ROLE);
  const isEmployee = currentUser && currentUser.role_id === EMPLOYEE_ROLE;

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            authService.isAuthenticated() ? (
              isAdmin ? (
                <RoleBasedRoute allowedRoles={[MANAGER_ROLE, SUPER_ADMIN_ROLE]}>
                  <AdminDashboard />
                </RoleBasedRoute>
              ) : isEmployee ? (
                <EmployeeDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Admin routes - only for Manager and Super Admin */}
        <Route
          path="/admin/*"
          element={
            <RoleBasedRoute allowedRoles={[MANAGER_ROLE, SUPER_ADMIN_ROLE]}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        {/* Redirect any unknown routes to dashboard if authenticated, otherwise to login */}
        <Route
          path="*"
          element={
            authService.isAuthenticated() ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
