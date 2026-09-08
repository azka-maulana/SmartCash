import { useState } from "react";
import { type DemoContribution } from "../App";
import { type ApiMember } from "../services/apiService";
import { formatRupiah, formatDate } from "../utils/format";

interface MembersProps {
  contributions: DemoContribution[];
  members: ApiMember[];
  onRecordPayment: (userId: string, period: string, additionalAmount: number) => Promise<void>;
  loading: boolean;
  period: string;
  onAddMember: (body: { name: string; email: string }) => Promise<void>;
}

type StatusFilter = "all" | "paid" | "partial" | "unpaid";

function StatusBadge({ status }: { status: "paid" | "partial" | "unpaid" }) {
  if (status === "paid")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Paid
    </span>;
  if (status === "partial")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Partial
    </span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Unpaid
  </span>;
}

interface EnrichedMember extends ApiMember {
  contribution: DemoContribution | null;
  status: "paid" | "partial" | "unpaid";
}

function AddMemberModal({ onClose, onSave }: { onClose: () => void; onSave: (body: { name: string; email: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a name and a valid email address.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), email: email.trim() });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Add member</h3><button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Close">×</button></div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
        <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 cursor-pointer">Cancel</button><button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 cursor-pointer">{saving ? "Adding..." : "Add member"}</button></div>
      </form>
    </div>
  );
}

function RecordPaymentModal({
  member,
  period,
  onClose,
  onSave,
}: {
  member: EnrichedMember;
  period: string;
  onClose: () => void;
  onSave: (additionalAmount: number) => Promise<void>;
}) {
  const [amountInput, setAmountInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const expectedAmount = member.contribution?.expected_amount ?? 0;
  const alreadyPaid    = member.contribution?.paid_amount ?? 0;
  const remaining      = Math.max(0, expectedAmount - alreadyPaid);

  const numericInput = Number(amountInput.replace(/\D/g, ""));
  const isValid      = numericInput > 0 && numericInput <= remaining;

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(numericInput);
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to record payment.");
      setSaving(false);
    }
  };

  const periodLabel = period
    ? new Date(period + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : period;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        {saved ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-slate-900 font-semibold">Payment recorded</div>
          </div>
        ) : (
          <>
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Record Payment</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">{member.name} · {member.nim ?? ""} · {periodLabel}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total due</span>
                  <span className="font-mono font-semibold text-slate-900">{formatRupiah(expectedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Already paid</span>
                  <span className="font-mono font-semibold text-green-600">{formatRupiah(alreadyPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-200 mt-1">
                  <span className="text-slate-700 font-medium">Remaining</span>
                  <span className="font-mono font-bold text-red-600">{formatRupiah(remaining)}</span>
                </div>
              </div>
              {saveError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {saveError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ""))}
                    placeholder={String(remaining)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setAmountInput(String(remaining))}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 font-medium cursor-pointer"
                >
                  Use full remaining amount
                </button>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid || saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Record"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Members({ contributions, members, onRecordPayment, onAddMember, loading, period }: MembersProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [payingMemberId, setPayingMemberId] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);

  // Enrich each member with their contribution for the current period
  const enrichedMembers: EnrichedMember[] = members.map((member) => {
    const contribution = contributions.find(
      (c) => c.user_id === member.user_id && c.period === period
    ) ?? null;
    const status = contribution ? (contribution.status as "paid" | "partial" | "unpaid") : "unpaid";
    return { ...member, contribution, status };
  });

  const filteredMembers = enrichedMembers.filter((member) => {
    const matchSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      (member.nim ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || member.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    paid:    enrichedMembers.filter((m) => m.status === "paid").length,
    partial: enrichedMembers.filter((m) => m.status === "partial").length,
    unpaid:  enrichedMembers.filter((m) => m.status === "unpaid").length,
  };

  const payingMember = payingMemberId
    ? enrichedMembers.find((m) => m.id === payingMemberId) ?? null
    : null;

  const handleModalSave = async (additionalAmount: number) => {
    if (!payingMember) return;
    await onRecordPayment(payingMember.user_id, period, additionalAmount);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading members…
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {payingMember && (
        <RecordPaymentModal
          member={payingMember}
          period={period}
          onClose={() => setPayingMemberId(null)}
          onSave={handleModalSave}
        />
      )}
      {addingMember && <AddMemberModal onClose={() => setAddingMember(false)} onSave={onAddMember} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 font-semibold text-xl">Members</h2>
          <p className="text-slate-500 text-sm mt-0.5">{members.length} enrolled members</p>
        </div>
        <button
          onClick={() => setAddingMember(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add member
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold font-mono text-green-600 mb-0.5">{counts.paid}</div>
          <div className="text-xs text-slate-500 font-medium">Paid</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold font-mono text-amber-500 mb-0.5">{counts.partial}</div>
          <div className="text-xs text-slate-500 font-medium">Partial</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold font-mono text-red-500 mb-0.5">{counts.unpaid}</div>
          <div className="text-xs text-slate-500 font-medium">Unpaid</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "paid", "partial", "unpaid"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Member table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Member</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">NIM</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Paid</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Last payment</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const paid    = member.contribution?.paid_amount ?? 0;
              const total   = member.contribution?.expected_amount ?? 0;
              const lastPmt = member.contribution?.paidAt ?? null;
              // initials from name
              const initials = member.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-slate-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-slate-500 font-mono text-xs">{member.nim ?? ""}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right hidden md:table-cell">
                    <span className={`font-mono text-sm font-semibold ${
                      member.status === "paid" ? "text-green-600" : member.status === "partial" ? "text-amber-600" : "text-red-500"
                    }`}>
                      {formatRupiah(paid)}
                    </span>
                    <div className="text-xs text-slate-400">of {formatRupiah(total)}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-right">
                    <span className="text-slate-400 text-sm">{lastPmt ? formatDate(lastPmt) : "—"}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {member.status !== "paid" && (
                      <button
                        onClick={() => setPayingMemberId(member.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        Record payment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            {members.length === 0 ? "No members in database" : "No members found"}
          </div>
        )}
      </div>
    </div>
  );
}
