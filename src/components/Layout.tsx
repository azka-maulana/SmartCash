import { useState, type ReactNode } from "react";
import { type Page, type Role } from "../App";

interface DemoUser {
  id: string;
  name: string;
  nim: string;
  role: string;
  initials: string;
}

interface NavItem {
  id: Page;
  label: string;
  icon: ReactNode;
}

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  role: Role;
  navigate: (page: Page) => void;
  onLogout: () => void;
  pageTitle: string;
  currentUser: DemoUser;
  groupName?: string;
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function Layout({ children, currentPage, role, navigate, onLogout, pageTitle, currentUser, groupName }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminNav: NavItem[] = [
    { id: "admin-dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "transactions", label: "Transactions", icon: <TransactionsIcon /> },
    { id: "members", label: "Members", icon: <MembersIcon /> },
    { id: "ai-assistant", label: "AI Assistant", icon: <SparkleIcon /> },
  ];

  const userNav: NavItem[] = [
    { id: "user-dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "transactions", label: "Transactions", icon: <TransactionsIcon /> },
    { id: "user-contribution", label: "My Contribution", icon: <WalletIcon /> },
    { id: "ai-assistant", label: "AI Assistant", icon: <SparkleIcon /> },
  ];

  const navItems = role === "admin" ? adminNav : userNav;
  const isActive = (navigationItem: NavItem) => {
    if (currentPage === navigationItem.id) return true;
    if (navigationItem.id === "transactions" && (currentPage === "transaction-detail" || currentPage === "add-transaction")) return true;
    if (navigationItem.id === "members" && currentPage === "contribution-detail") return true;
    return false;
  };

  return (
    <div className="h-full flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="sc-sidebar hidden md:flex flex-col w-60 shrink-0 bg-[#0F172A] h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-tight">Smart Cash</span>
              <div className="text-[10px] text-slate-400 leading-tight">{groupName ?? "Group"}</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-md ${
            role === "admin"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-slate-700/60 text-slate-400"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {role === "admin" ? "Admin" : "Member"}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((navigationItem) => {
            const active = isActive(navigationItem);
            return (
              <button
                key={navigationItem.id}
                onClick={() => { navigate(navigationItem.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <span className={active ? "text-white" : "text-slate-500"}>{navigationItem.icon}</span>
                {navigationItem.label}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="sc-profile px-3 py-4 border-t border-white/8">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="sc-profile-avatar w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="sc-profile-name text-sm font-semibold truncate">{currentUser.name}</div>
              <div className="sc-profile-role text-xs truncate">{role === "admin" ? "Treasurer" : "Member"}</div>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="sc-header bg-white border-b border-slate-200 px-4 sm:px-6 py-0 flex items-center justify-between shrink-0 h-14">
          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <button
              className="md:hidden text-slate-600 mr-1 cursor-pointer p-2 -ml-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon />
            </button>
            <h1 className="text-slate-900 font-semibold text-base">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="sc-header-avatar w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs">
                {currentUser.initials}
              </div>
              <span className="sc-header-name text-sm font-semibold">{currentUser.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="sc-main flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="sc-mobile-nav md:hidden flex shrink-0 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((navigationItem) => {
            const active = isActive(navigationItem);
            return (
              <button
                key={navigationItem.id}
                onClick={() => navigate(navigationItem.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  active ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <span className={active ? "text-blue-600" : "text-slate-400"}>{navigationItem.icon}</span>
                <span className="leading-tight">{navigationItem.label === "My Contribution" ? "Contribution" : navigationItem.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <button className="absolute inset-0 bg-slate-950/35 cursor-pointer" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu" />
          <aside className="relative w-[min(82vw,20rem)] h-full bg-[#0F172A] shadow-2xl p-4 flex flex-col animate-[slide-in_180ms_ease-out]">
            <div className="flex items-center justify-between px-2 py-2 mb-6">
              <div className="text-white font-semibold">Smart Cash</div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-2 cursor-pointer" aria-label="Close navigation menu">×</button>
            </div>
            <nav className="space-y-1">
              {navItems.map((navigationItem) => (
                <button key={navigationItem.id} onClick={() => { navigate(navigationItem.id); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium cursor-pointer ${isActive(navigationItem) ? "bg-white/12 text-white" : "text-slate-400 hover:bg-white/6 hover:text-white"}`}>
                  {navigationItem.icon}<span>{navigationItem.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-4">
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-400 hover:text-white cursor-pointer"><LogoutIcon /> Sign out</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
