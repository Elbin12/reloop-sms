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
import Configuration from "./components/Configuration"
import Analytics from "./components/Analytics"
import Logs from "./components/Logs"
import Layout from "./components/Layout"

function RequireAuth({ isAuthenticated, children }) {
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <Router>
      <Routes>
        {/* Public login page */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Protected routes wrapped in Layout */}
        <Route
          element={
            <RequireAuth isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}>
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
          {/* <Route path="configuration" element={<Configuration />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} /> */}
          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
