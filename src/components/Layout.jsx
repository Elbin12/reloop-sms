"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { useDispatch } from "react-redux"
import { logoutUser } from "../store/slices/authSlice"

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const dispatch = useDispatch();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const logout = ()=>{
    dispatch(logoutUser());
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={logout} isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`
        flex-1 flex flex-col overflow-hidden
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? "md:ml-16" : ""}
        ml-0
      `}
      >
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">Welcome back, Admin</div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default Layout
