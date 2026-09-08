import { useState } from "react";
import { type DemoTransaction, type Page, type Role } from "../App";
import { type ApiMember } from "../services/apiService";
import { formatRupiah, formatDate } from "../utils/format";

interface TransactionDetailProps {
  transactionId: string;
  role: Role;
  navigate: (page: Page) => void;
  transactions: DemoTransaction[];
  onVoid: (id: string) => Promise<void>;
  members: ApiMember[];
}

export default function TransactionDetail({
  transactionId,
  role,
  navigate,
  transactions,
  onVoid,
  members,
}: TransactionDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const transaction = transactions.find((t) => t.id === transactionId);

  if (!transaction) {
    return (
      <div className="p-6 text-slate-400 text-sm">Transaction not found.</div>
    );
  }

  const createdByMember = members.find((u) => u.user_id === transaction.created_by);
  const createdByName = createdByMember ? createdByMember.name : transaction.created_by;

  const handleVoid = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setVoiding(true);
    setVoidError(null);
    try {
      await onVoid(transaction.id);
      navigate("transactions");
    } catch (err: unknown) {
      setVoidError(err instanceof Error ? err.message : "Failed to void transaction.");
      setVoiding(false);
      setConfirming(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("transactions")} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h2 className="text-slate-900 font-semibold text-lg">Transaction detail</h2>
      </div>

      {/* Hero amount */}
      <div className={`rounded-xl p-6 text-white ${
        transaction.status === "voided"
          ? "bg-slate-400"
          : transaction.type === "income"
          ? "bg-green-600"
          : "bg-red-600"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            {transaction.type === "income" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-white/80 capitalize">{transaction.type}</span>
          {transaction.status === "voided" && (
            <span className="ml-auto text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Voided</span>
          )}
        </div>
        <div className="text-3xl font-bold font-mono">
          {transaction.type === "income" ? "+" : "−"}{formatRupiah(transaction.amount)}
        </div>
        <div className="text-white/70 text-sm mt-1">{transaction.description}</div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <DetailRow label="Transaction ID" value={<span className="font-mono text-xs text-slate-500">{transaction.id}</span>} />
        <DetailRow label="Date" value={formatDate(transaction.date)} />
        <DetailRow label="Category" value={transaction.category} />
        {transaction.note && <DetailRow label="Note" value={transaction.note} />}
        <DetailRow label="Recorded by" value={createdByName} />
        <DetailRow
          label="Status"
          value={
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
              transaction.status === "posted"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          }
        />
      </div>

      {voidError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {voidError}
        </div>
      )}

      {/* Admin actions */}
      {role === "admin" && transaction.status !== "voided" && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate("add-transaction")}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg text-sm border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Add New
          </button>
          <button
            onClick={handleVoid}
            disabled={voiding}
            className={`flex-1 font-medium py-2.5 rounded-lg text-sm border transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
              confirming
                ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                : "bg-white hover:bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {voiding ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
            {voiding ? "Voiding…" : confirming ? "Confirm void" : "Void"}
          </button>
        </div>
      )}
      {confirming && !voiding && (
        <button
          onClick={() => setConfirming(false)}
          className="w-full text-xs text-slate-400 hover:text-slate-600 text-center py-1 cursor-pointer"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-900 text-sm font-medium">{value}</span>
    </div>
  );
}
