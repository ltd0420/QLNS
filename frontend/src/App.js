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
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
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
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  console.log('App component rendered');

  // Define role IDs
  const EMPLOYEE_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7c';
  const MANAGER_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7b';
  const DEPARTMENT_HEAD_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7d';
  const SUPER_ADMIN_ROLE = '01926d2c-a8d1-7c3e-8f2a-1b3c4d5e6f7a';

  // Get current user to determine dashboard
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && currentUser.role_id === SUPER_ADMIN_ROLE;
  const isEmployee = currentUser && (currentUser.role_id === EMPLOYEE_ROLE || currentUser.role_id === DEPARTMENT_HEAD_ROLE || currentUser.role_id === MANAGER_ROLE);

  const isAuthenticated = authService.isAuthenticated();

  // Memoize role-based routing logic to prevent unnecessary re-renders
  const getDashboardElement = () => {
    if (!isAuthenticated) {
      return <Navigate to="/" replace />;
    }

    if (isAdmin) {
      return (
        <RoleBasedRoute allowedRoles={[SUPER_ADMIN_ROLE]}>
          <AdminDashboard />
        </RoleBasedRoute>
      );
    }

    if (isEmployee) {
      return <EmployeeDashboard />;
    }

    return <Navigate to="/" replace />;
  };

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
          element={getDashboardElement()}
        />
        {/* Admin routes - only for Super Admin */}
        <Route
          path="/admin/*"
          element={
            <RoleBasedRoute allowedRoles={[SUPER_ADMIN_ROLE]}>
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        {/* Department Head routes - redirect to employee dashboard */}
        <Route
          path="/department/*"
          element={
            <RoleBasedRoute allowedRoles={[DEPARTMENT_HEAD_ROLE]}>
              <EmployeeDashboard />
            </RoleBasedRoute>
          }
        />
        {/* Redirect any unknown routes to dashboard if authenticated, otherwise to login */}
        <Route
          path="*"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" replace /> :
              <Navigate to="/" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
