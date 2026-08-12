import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Flag, AlertTriangle, ShieldAlert, CheckCircle2, Lock, Loader2 } from "lucide-react";
import type { Memory } from "@/lib/types";
import { useAppState } from "@/lib/store";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  {
    id: "targeting_bullying",
    label: "Targeting, Mocking, or Bullying",
    description: "Attacking, ridiculing, or demeaning specific people or groups.",
    icon: ShieldAlert,
  },
  {
    id: "personal_doxxing",
    label: "Personal Information / Doxxing",
    description: "Revealing real names, phone numbers, addresses, or handles.",
    icon: AlertTriangle,
  },
  {
    id: "inappropriate",
    label: "Inappropriate or Offensive Content",
    description: "Profanity, explicit material, hate speech, or harassment.",
    icon: Flag,
  },
  {
    id: "spam_vandalism",
    label: "Geographic Spam or Vandalism",
    description: "Fake coordinates, promotional spam, or gibberish.",
    icon: AlertTriangle,
  },
];

export function ReportStoryModal({
  isOpen,
  onClose,
  memory,
}: {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
}) {
  const { user, reportStory } = useAppState();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]?.id || "targeting_bullying");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || typeof document === "undefined") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      await reportStory({
        memory,
        reason: selectedReason,
        reason_label: reasonObj?.label || "Safety Policy Violation",
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2200);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 select-text">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-[#E2E0D8] text-[#1D1D1F]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                <Flag className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-serif text-base font-bold text-[#16223B]">
                  Report Memory
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  GOLPO-{memory.anonymous_id} · {memory.location_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report modal"
              className="text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Unauthenticated State: Must log in to report ── */}
          {!user ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F5F2] text-[#16223B] border border-[#E2E0D8] mb-3.5 shadow-2xs">
                <Lock className="h-5 w-5 text-[#16223B]" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#16223B]">
                Sign In to Submit a Report
              </h4>
              <p className="mt-2 text-xs text-[#5C5C60] max-w-xs mx-auto leading-relaxed">
                To maintain a safe community and prevent automated spam or fraudulent flags, you must be signed in to report a memory.
              </p>

              <div className="mt-5 max-w-xs mx-auto">
                <GoogleSignInButton redirectTo="/map" label="Sign in with Google" />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-[#71717A] hover:text-black transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : submitted ? (
            /* ── Success State ── */
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-sm text-[#1D1D1F]">
                Report Submitted for Review
              </h4>
              <p className="mt-1.5 text-xs text-[#71717A] max-w-xs mx-auto leading-relaxed">
                Thank you for helping keep Golpo safe. Our moderation team reviews flagged memories against our Community Safety Guidelines.
              </p>
            </div>
          ) : (
            /* ── Authenticated Report Form ── */
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-2">
                  Select Violation Reason
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => {
                    const isSelected = selectedReason === r.id;
                    const Icon = r.icon;
                    return (
                      <label
                        key={r.id}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-all cursor-pointer",
                          isSelected
                            ? "border-black bg-gray-50 ring-1 ring-black"
                            : "border-gray-200 hover:bg-gray-50/60",
                        )}
                      >
                        <input
                          type="radio"
                          name="report_reason"
                          value={r.id}
                          checked={isSelected}
                          onChange={() => setSelectedReason(r.id)}
                          className="sr-only"
                        />
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            isSelected ? "text-rose-600" : "text-gray-400",
                          )}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-[#1D1D1F]">{r.label}</p>
                          <p className="text-[10px] text-[#71717A] mt-0.5">
                            {r.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide context on how this story violates the community safety policy..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-[#1D1D1F] placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#71717A] hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}


