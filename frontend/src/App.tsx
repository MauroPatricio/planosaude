import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './store/authStore';

import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import TeamPage from './pages/TeamPage';
import PlansPage from './pages/PlansPage';
import SalesPage from './pages/SalesPage';
import CommissionsPage from './pages/CommissionsPage';
import LeadsPage from './pages/LeadsPage';
import InstitutionsPage from './pages/InstitutionsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import PaymentsPage from './pages/PaymentsPage';
import ClaimsPage from './pages/ClaimsPage';
import B2BDashboardPage from './pages/B2BDashboardPage';
import ClientPortal from './pages/ClientPortal';
import NewClientsPage from './pages/NewClientsPage';
import NewSalesPage from './pages/NewSalesPage';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleGuard = ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
  const user = useAuthStore((state) => state.user);
  if (!user || !roles.includes(user.role)) {
    const home = user?.role === 'client' ? "/portal" : user?.role === 'hr_admin' ? "/b2b" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><DashboardPage /></RoleGuard>} />
            <Route path="/clients" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><ClientsPage /></RoleGuard>} />
            <Route path="/team" element={<RoleGuard roles={['superAdmin', 'admin', 'manager']}><TeamPage /></RoleGuard>} />
            <Route path="/plans" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><PlansPage /></RoleGuard>} />
            <Route path="/sales" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><SalesPage /></RoleGuard>} />
            <Route path="/commissions" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><CommissionsPage /></RoleGuard>} />
            <Route path="/leads" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><LeadsPage /></RoleGuard>} />
             <Route path="/institutions" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><InstitutionsPage /></RoleGuard>} />
            <Route path="/approvals" element={<RoleGuard roles={['superAdmin', 'admin', 'manager']}><ApprovalsPage /></RoleGuard>} />
            <Route path="/admin/new-clients" element={<RoleGuard roles={['superAdmin', 'admin', 'manager']}><NewClientsPage /></RoleGuard>} />
            <Route path="/new-sales" element={<RoleGuard roles={['superAdmin', 'admin', 'manager']}><NewSalesPage /></RoleGuard>} />
            <Route path="/payments" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><PaymentsPage /></RoleGuard>} />
            <Route path="/claims" element={<RoleGuard roles={['superAdmin', 'admin', 'manager', 'broker']}><ClaimsPage /></RoleGuard>} />
            <Route path="/portal" element={<RoleGuard roles={['client']}><ClientPortal /></RoleGuard>} />
            <Route path="/b2b" element={<RoleGuard roles={['hr_admin']}><B2BDashboardPage /></RoleGuard>} />
            <Route 
              path="/" 
              element={
                <Navigate to={useAuthStore.getState().user?.role === 'client' ? "/portal" : useAuthStore.getState().user?.role === 'hr_admin' ? "/b2b" : "/dashboard"} replace />
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
