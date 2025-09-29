import React, { useState } from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
  useNavigate,
} from "react-router-dom"

import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import HighLevelAccounts from "./components/HighLevelAccounts"
import TransmitAccounts from "./components/TransmitAccounts"
import AccountManagement from "./components/AccountManagement"
import SMSMonitoring from "./components/SMSMonitoring"
import Analytics from "./components/Analytics"
import Logs from "./components/Logs"
import Layout from "./components/Layout"
import store from "./store/store"
import { Provider, useSelector } from "react-redux"
import WalletTransactions from "./components/WalletTransactions"
import UserDashboard from "./components/user/userDashboard"

function RequireAuth({ children }) {
  const location = useLocation()
  const access = localStorage.getItem('access')

  if (!access) {
    return <Navigate to="/login" replace state={{ from: location }} />  
  }
  return children
}

function RedirectIfAuth({ children }) {
  const access = localStorage.getItem('access')
  const location = useLocation();

  if (access) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public login page */}
          <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
          <Route path="/user/dashboard" element={<UserDashboard />} />

          {/* Protected routes wrapped in Layout */}
          <Route
            element={
              <RequireAuth >
                <Layout >
                  <Outlet />
                </Layout>
              </RequireAuth>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="highlevel-accounts" element={<HighLevelAccounts />} />
            <Route path="transmit-accounts" element={<TransmitAccounts />} />
            <Route path="account-mapping" element={<AccountManagement />} />
            <Route path="sms-monitoring" element={<SMSMonitoring />} />
            <Route path="wallets" element={<WalletTransactions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="logs" element={<Logs />} />
            {/* fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
