import { useState } from "react";
import { type Page } from "../App";
import { type ApiTransaction } from "../services/apiService";

interface AddTransactionProps {
  initialType?: "income" | "expense";
  navigate: (page: Page) => void;
  onSave: (body: {
    type: "income" | "expense";
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => Promise<ApiTransaction>;
}

const CATEGORIES = ["Contribution", "Event", "Printing", "Activity", "Supplies", "Other"];

export default function AddTransaction({
  initialType = "expense",
  navigate,
  onSave,
}: AddTransactionProps) {
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("Event");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<"form" | "review" | "saving" | "saved" | "error">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const numericAmount = Number(amount.replace(/\./g, "").replace(/\D/g, ""));

  const validate = () => {
    const validationErrors: Record<string, string> = {};
    if (!amount || isNaN(numericAmount) || numericAmount <= 0)
      validationErrors.amount = "Please enter a valid amount greater than zero.";
    if (!date) validationErrors.date = "Please select a date.";
    if (!description.trim()) validationErrors.description = "Please enter a description.";
    return validationErrors;
  };

  const handleReview = () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) setStep("review");
  };

  const handleSave = async () => {
    setStep("saving");
    setSaveError(null);
    try {
      await onSave({
        type,
        description: description.trim(),
        category,
        amount: numericAmount,
        date,
      });
      setStep("saved");
      setTimeout(() => navigate("transactions"), 1500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save transaction.");
      setStep("error");
    }
  };

  const formatAmountDisplay = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    return numeric ? Number(numeric).toLocaleString("id-ID") : "";
  };

  if (step === "saving") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin mx-auto mb-4 text-blue-500" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <div className="text-slate-500 text-sm">Saving transaction…</div>
        </div>
      </div>
    );
  }

  if (step === "saved") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="text-slate-900 font-semibold text-lg mb-1">Transaction saved</div>
          <div className="text-slate-500 text-sm">Redirecting to transactions…</div>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <div className="text-red-700 font-semibold mb-2">Failed to save transaction</div>
          <div className="text-red-600 text-sm mb-4">{saveError}</div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep("review")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Go back
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("form")} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="text-slate-900 font-semibold text-lg">Review transaction</h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-slate-500 text-sm">Type</span>
            <span className={`font-semibold text-sm ${type === "income" ? "text-green-600" : "text-red-600"}`}>
              {type === "income" ? "Income" : "Expense"}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-slate-500 text-sm">Amount</span>
            <span className="font-bold font-mono text-slate-900">Rp {formatAmountDisplay(amount)}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-slate-500 text-sm">Date</span>
            <span className="text-slate-900 text-sm">{date}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-slate-500 text-sm">Category</span>
            <span className="text-slate-900 text-sm">{category}</span>
          </div>
          <div className="px-5 py-4">
            <span className="text-slate-500 text-sm block mb-1">Description</span>
            <span className="text-slate-900 text-sm">{description}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("form")}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg text-sm border border-slate-300 transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            Confirm &amp; Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("transactions")} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h2 className="text-slate-900 font-semibold text-lg">Add transaction</h2>
      </div>

      {/* Type toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 flex">
        <button
          onClick={() => setType("income")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            type === "income"
              ? "bg-green-50 text-green-700 shadow-sm border border-green-200"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Income
        </button>
        <button
          onClick={() => setType("expense")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            type === "expense"
              ? "bg-red-50 text-red-700 shadow-sm border border-red-200"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          Expense
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={formatAmountDisplay(amount)}
              onChange={(e) => setAmount(e.target.value.replace(/\./g, "").replace(/\D/g, ""))}
              placeholder="0"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-slate-900 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${errors.amount ? "border-red-400" : "border-slate-300"}`}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount}</p>}
        </div>

        {/* Date + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer ${errors.date ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What is this transaction for?"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-slate-900 text-sm placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all ${errors.description ? "border-red-400" : "border-slate-300"}`}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Receipt upload — demo placeholder only */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Receipt <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-slate-300 transition-colors cursor-not-allowed opacity-60">
            <svg className="mx-auto text-slate-300 mb-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-xs text-slate-400">Receipt upload available in the full version</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          onClick={() => navigate("transactions")}
          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg text-sm border border-slate-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleReview}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
        >
          Review
        </button>
      </div>
    </div>
  );
}
