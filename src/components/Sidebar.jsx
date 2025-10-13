"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Building2,
  Radio,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Wallet2Icon,
  Wallet,
  Phone,
} from "lucide-react"

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: Users,
    label: "Account Management",
    submenu: [
      {
        icon: Building2,
        label: "HighLevel Accounts",
        path: "/highlevel-accounts",
      },
      {
        icon: Radio,
        label: "Transmit SMS Accounts",
        path: "/transmit-accounts",
      },
      {
        icon: Users,
        label: "Account Mapping",
        path: "/account-mapping",
      },
    ],
  },
  {
    icon: MessageSquare,
    label: "SMS Monitoring",
    path: "/sms-monitoring",
  },
  {
    icon: Wallet,
    label: "Wallet Transactions",
    path: "/wallets",
  },
  {
    icon: Phone,
    label: "Available Numbers",
    path: "/numbers/available",
  },
  // {
  //   icon: BarChart3,
  //   label: "Analytics",
  //   path: "/analytics",
  // },
  // {
  //   icon: FileText,
  //   label: "Logs",
  //   path: "/logs",
  // },
]

const   Sidebar = ({ onLogout, isCollapsed, onToggleCollapse }) => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({ 1: true }) // Account Management expanded by default
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const isSubmenuActive = (submenu) => {
    return submenu.some((item) => location.pathname === item.path)
  }

  const toggleSubmenu = (index) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const closeMobile = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 md:hidden"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeMobile} />}

      {/* Sidebar */}
      <div
        className={`
        fixed md:relative inset-y-0 left-0 z-50 flex flex-col
        ${isCollapsed ? "w-16" : "w-72"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        bg-white shadow-xl border-r border-gray-200
        transition-all duration-300 ease-in-out
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-900">Reloop SMS</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          )}

          {/* Mobile Close Button */}
          <button onClick={closeMobile} className="p-1 rounded-lg hover:bg-gray-100 md:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>

          {/* Desktop Collapse Button */}
          <button onClick={onToggleCollapse} className="hidden md:block p-1 rounded-lg hover:bg-gray-100">
            <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => !isCollapsed && toggleSubmenu(index)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left
                        transition-all duration-200 group
                        ${
                          isSubmenuActive(item.submenu)
                            ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }
                        ${isCollapsed ? "justify-center" : ""}
                      `}
                      title={isCollapsed ? item.label : ""}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"} flex-shrink-0`} />
                        {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        <div className="flex-shrink-0">
                          {expandedMenus[index] ? (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Submenu */}
                    {!isCollapsed && expandedMenus[index] && (
                      <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100 pl-4">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            onClick={closeMobile}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                              transition-all duration-200
                              ${
                                isActive(subItem.path)
                                  ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }
                            `}
                          >
                            <subItem.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={closeMobile}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    title={isCollapsed ? item.label : ""}
                  >
                    <item.icon className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"} flex-shrink-0`} />
                    {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer - Logout Button */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={() => {
              onLogout()
              closeMobile()
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-red-600 hover:text-red-700 hover:bg-red-50
              transition-all duration-200
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className={`${isCollapsed ? "h-5 w-5" : "h-4 w-4"} flex-shrink-0`} />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
