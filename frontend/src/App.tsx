import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './context/store';
import { Navbar } from './components/Navbar';

// Screens
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { SignContract } from './screens/SignContract';
import { Dashboard } from './screens/Dashboard';
import { Contracts } from './screens/Contracts';
import { CreateContract } from './screens/CreateContract';
import { ContractDetails } from './screens/ContractDetails';
import { Templates } from './screens/Templates';
import { Obras } from './screens/Obras';
import { ObraDetails } from './screens/ObraDetails';
import { CreatePurchaseOrder } from './screens/CreatePurchaseOrder';
import { Users } from './screens/Users';

// Route protector and general private navigation layout
const PrivateLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col selection:bg-primary/30 selection:text-ink">
      <Navbar />
      <main className="flex-grow w-full bg-canvas">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/assinar/:token" element={<SignContract />} />

        {/* Private Routes */}
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Dashboard />} />
          
          <Route path="/contratos" element={<Contracts />} />
          <Route path="/contratos/novo" element={<CreateContract />} />
          <Route path="/contratos/:uuid" element={<ContractDetails />} />
          
          <Route path="/templates" element={<Templates />} />
          
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/:uuid" element={<ObraDetails />} />
          
          <Route path="/purchase-orders/novo" element={<CreatePurchaseOrder />} />
          
          <Route path="/usuarios" element={<Users />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
