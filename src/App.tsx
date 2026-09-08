import { useState, useEffect, useCallback } from "react";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import TransactionDetail from "./pages/TransactionDetail";
import Members from "./pages/Members";
import UserContribution from "./pages/UserContribution";
import AIAssistant from "./pages/AIAssistant";
import { deriveStatus } from "./data/demoData";
import {
  fetchTransactions,
  fetchContributions,
  fetchContributionHistory,
  fetchMembers,
  fetchGroup,
  fetchGroupSummary,
  postMember,
  postTransaction,
  patchVoidTransaction,
  postPayment,
  type ApiTransaction,
  type ApiContribution,
  type ApiMember,
  type ApiGroup,
  type ApiGroupSummary,
  type AuthUser,
} from "./services/apiService";

export type Role = "admin" | "user";

export type Page =
  | "landing"
  | "login"
  | "admin-dashboard"
  | "user-dashboard"
  | "transactions"
  | "add-transaction"
  | "transaction-detail"
  | "members"
  | "contribution-detail"
  | "user-contribution"
  | "ai-assistant";

// Re-export the API types under the old names so page components keep working
export type DemoTransaction = ApiTransaction;
export type DemoContribution = ApiContribution;

interface NavParams {
  id?: string;
  type?: string;
}

const PAGE_TITLES: Record<Page, string> = {
  landing: "Smart Cash",
  login: "Sign in",
  "admin-dashboard": "Dashboard",
  "user-dashboard": "Dashboard",
  transactions: "Transactions",
  "add-transaction": "Add Transaction",
  "transaction-detail": "Transaction Detail",
  members: "Members",
  "contribution-detail": "Contribution Detail",
  "user-contribution": "My Contribution",
  "ai-assistant": "AI Assistant",
};

// The current demo period — shared across the app
const CURRENT_PERIOD = new Date().toISOString().slice(0, 7);

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    try {
      const stored = localStorage.getItem("smart-cash.demo-user");
      const user = stored ? JSON.parse(stored) as AuthUser : null;
      return user?.role === "admin" ? "admin-dashboard" : user?.role === "user" ? "user-dashboard" : "landing";
    } catch {
      return "landing";
    }
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("smart-cash.demo-user");
      return stored ? JSON.parse(stored) as AuthUser : null;
    } catch {
      return null;
    }
  });
  const role = authUser?.role ?? null;
  const [params, setParams] = useState<NavParams>({});

  // ── Real backend state ──────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<DemoTransaction[]>([]);
  const [contributions, setContributions] = useState<DemoContribution[]>([]);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [summary, setSummary] = useState<ApiGroupSummary | null>(null);
  const [contributionHistory, setContributionHistory] = useState<ApiContribution[]>([]);

  // Loading / error states for data fetching
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // ── Fetch all data from the backend ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [groupData, summaryData, txData, contribData, historyData, memberData] = await Promise.all([
        fetchGroup(),
        fetchGroupSummary(CURRENT_PERIOD),
        fetchTransactions(),
        fetchContributions(CURRENT_PERIOD),
        fetchContributionHistory(),
        fetchMembers(),
      ]);
      setGroup(groupData);
      setSummary(summaryData);
      setTransactions(txData);
      setContributions(contribData);
      setContributionHistory(historyData);
      setMembers(memberData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data from backend.";
      console.error("[App] loadData error:", msg);
      setDataError(msg);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (role !== null) {
      loadData();
    }
  }, [role, loadData]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = (nextPage: Page, nextParams?: Record<string, string>) => {
    setPage(nextPage);
    setParams(nextParams ?? {});
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem("smart-cash.demo-user", JSON.stringify(user));
    navigate(user.role === "admin" ? "admin-dashboard" : "user-dashboard");
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem("smart-cash.demo-user");
    setTransactions([]);
    setContributions([]);
    setMembers([]);
    setGroup(null);
    setSummary(null);
    setContributionHistory([]);
    setDataError(null);
    navigate("landing");
  };

  // ── Transaction mutations — go through backend ───────────────────────────────
  const addTransaction = async (body: {
    type: "income" | "expense";
    description: string;
    category: string;
    amount: number;
    date: string;
  }): Promise<DemoTransaction> => {
    const newTx = await postTransaction(body);
    await loadData();
    return newTx;
  };

  const voidTransaction = async (id: string) => {
    await patchVoidTransaction(id);
    await loadData();
  };

  // ── Contribution mutations — go through backend ──────────────────────────────
  const recordPayment = async (userId: string, period: string, additionalAmount: number) => {
    await postPayment({ userId, period, amount: additionalAmount });
    await loadData();
  };

  const addMember = async (body: { name: string; email: string }) => {
    await postMember(body);
    await loadData();
  };

  // ── Derived current user ────────────────────────────────────────────────────
  const currentUser = authUser
    ? { id: authUser.userId, name: authUser.name, nim: "", role: authUser.role, initials: authUser.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() }
    : null;

  // ── Derived contribution for current user ───────────────────────────────────
  const currentUserContribution =
    contributions.find(
      (c) => c.user_id === currentUser?.id && c.period === CURRENT_PERIOD
    ) ?? null;

  if (page === "landing") return <Landing onGetStarted={() => navigate("login")} />;
  if (page === "login") return <Login onLogin={handleLogin} onBack={() => navigate("landing")} />;

  if (!role || !currentUser) {
    navigate("landing");
    return null;
  }

  const renderPage = () => {
    // Show a global data error banner above the page if backend is unreachable
    const errorBanner = dataError ? (
      <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>Backend error:</strong> {dataError} — Ensure the backend server is running and{" "}
          <button
            onClick={loadData}
            className="underline font-medium cursor-pointer"
          >
            retry
          </button>
          .
        </span>
      </div>
    ) : null;

    switch (page) {
      case "admin-dashboard":
        return (
          <>
            {errorBanner}
            <AdminDashboard
              navigate={navigate}
              transactions={transactions}
              contributions={contributions}
              members={members}
              loading={dataLoading}
              period={CURRENT_PERIOD}
              group={group}
              summary={summary}
            />
          </>
        );
      case "user-dashboard":
        return (
          <>
            {errorBanner}
            <UserDashboard
              navigate={navigate}
              transactions={transactions}
              contributions={contributions}
              members={members}
              currentUser={currentUser}
              currentUserContribution={currentUserContribution}
              deriveStatus={deriveStatus}
              loading={dataLoading}
              period={CURRENT_PERIOD}
              group={group}
              summary={summary}
            />
          </>
        );
      case "transactions":
        return (
          <>
            {errorBanner}
            <Transactions
              role={role}
              navigate={navigate}
              transactions={transactions}
              loading={dataLoading}
            />
          </>
        );
      case "add-transaction":
        return (
          <AddTransaction
            initialType={(params.type as "income" | "expense") ?? "expense"}
            navigate={navigate}
            onSave={addTransaction}
          />
        );
      case "transaction-detail":
        return (
          <TransactionDetail
            transactionId={params.id ?? ""}
            role={role}
            navigate={navigate}
            transactions={transactions}
            onVoid={voidTransaction}
            members={members}
          />
        );
      case "members":
        return (
          <>
            {errorBanner}
            <Members
              contributions={contributions}
              members={members}
              onRecordPayment={recordPayment}
              onAddMember={addMember}
              loading={dataLoading}
              period={CURRENT_PERIOD}
            />
          </>
        );
      case "user-contribution":
        return (
          <UserContribution
            navigate={navigate}
            currentUser={currentUser}
            contribution={currentUserContribution}
            history={contributionHistory.filter((c) => c.user_id === currentUser.id)}
            deriveStatus={deriveStatus}
          />
        );
      case "ai-assistant":
        return <AIAssistant groupName={group?.name ?? "Group"} />;
      default:
        return (
          <div className="p-6 text-slate-500 text-sm">Page not found</div>
        );
    }
  };

  return (
    <Layout
      currentPage={page}
      role={role}
      navigate={navigate}
      onLogout={handleLogout}
      pageTitle={PAGE_TITLES[page] ?? "Smart Cash"}
      currentUser={currentUser}
      groupName={group?.name}
    >
      {renderPage()}
    </Layout>
  );
}
