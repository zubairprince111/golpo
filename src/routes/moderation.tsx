import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldAlert,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Flag,
  MapPin,
  Clock,
  UserX,
} from "lucide-react";
import { useAppState } from "@/lib/store";
import { formatMemoryDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation & Safety Review — Golpo" },
      {
        name: "description",
        content: "Review flagged memories and enforce Golpo Community Safety Standards.",
      },
    ],
  }),
  component: ModerationPage,
});

type FilterType = "all" | "pending" | "deleted" | "resolved";

function ModerationPage() {
  const { user, profile, hydrated, reports, deleteMemoryByMod, dismissReport } = useAppState();
  const [filter, setFilter] = useState<FilterType>("all");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // ── Admin-only guard ────────────────────────────────────
  if (!hydrated) return null;
  if (!user || !profile?.is_admin) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-[#F6F5F2] px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-500 mb-3" />
          <h1 className="font-serif text-xl font-bold text-[#16223B]">Access Denied</h1>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            {!user ? "Sign in with an admin account to access moderation." : "Your account does not have moderation privileges."}
          </p>
          <Link to="/map" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Map
          </Link>
        </div>
      </main>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const deletedCount = reports.filter((r) => r.status === "deleted").length;

  function handleDelete(memoryId: string, reportId: string) {
    if (window.confirm("Are you sure you want to permanently delete this memory from the map?")) {
      deleteMemoryByMod(memoryId, reportId);
      setActionNotice("Memory successfully deleted from map and flagged as purged.");
      setTimeout(() => setActionNotice(null), 3000);
    }
  }

  function handleDismiss(reportId: string) {
    dismissReport(reportId);
    setActionNotice("Report dismissed as safe.");
    setTimeout(() => setActionNotice(null), 3000);
  }

  return (
    <main className="min-h-svh bg-[#F6F5F2] pb-28 select-text">
      <div className="mx-auto w-full max-w-[42rem] px-4 pt-6 sm:px-8">
        {/* Back link */}
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#1D1D1F] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Profile</span>
        </Link>

        {/* Masthead */}
        <header className="mt-4 border-b border-black/10 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-sm">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#16223B]">
                  Moderation & Safety Center
                </h1>
                <p className="text-xs text-[#71717A]">
                  Enforce anti-harassment, anti-doxxing, and safety policies.
                </p>
              </div>
            </div>

            {pendingCount > 0 && (
              <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 text-xs font-semibold">
                {pendingCount} Pending
              </span>
            )}
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white border border-gray-200 p-2.5">
              <p className="text-base font-bold text-[#1D1D1F]">{reports.length}</p>
              <p className="text-[11px] text-gray-500">Total Reports</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-2.5">
              <p className="text-base font-bold text-rose-600">{pendingCount}</p>
              <p className="text-[11px] text-gray-500">Pending Actions</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-2.5">
              <p className="text-base font-bold text-gray-700">{deletedCount}</p>
              <p className="text-[11px] text-gray-500">Purged Violations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {(["all", "pending", "deleted", "resolved"] as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-all cursor-pointer",
                  filter === f
                    ? "bg-black text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {/* Notice feedback */}
        {actionNotice && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
            ✓ {actionNotice}
          </div>
        )}

        {/* Reports List */}
        <div className="mt-6 space-y-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-gray-500">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-sm font-medium text-gray-800">No Reports in this View</p>
              <p className="mt-1 text-xs text-gray-500">
                All memories comply with community safety policies.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => {
              const isPending = report.status === "pending";
              const isDeleted = report.status === "deleted";

              return (
                <div
                  key={report.id}
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5 transition-all bg-white shadow-xs",
                    isPending ? "border-rose-200 ring-1 ring-rose-100" : "border-gray-200 opacity-80",
                  )}
                >
                  {/* Report Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                          <Flag className="h-3 w-3" />
                          <span>{report.reason_label}</span>
                        </span>

                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                            isPending && "bg-amber-100 text-amber-800",
                            isDeleted && "bg-rose-100 text-rose-800",
                            report.status === "resolved" && "bg-emerald-100 text-emerald-800",
                          )}
                        >
                          {report.status}
                        </span>
                      </div>

                      <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-2">
                        <span>Reported by user</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatMemoryDate(report.created_at)}</span>
                      </p>
                    </div>

                    <p className="text-[11px] font-bold text-gray-700">
                      Reporter: GOLPO-{report.reporter_anon_id ?? "anonymous"}
                    </p>
                  </div>

                  {/* Flagged Story Content */}
                  <div className="mt-3 rounded-xl bg-[#FAF9F6] border border-gray-200/80 p-3.5">
                    {(report.memory_snapshot as Record<string, string> | null)?.title && (
                      <p className="font-semibold text-xs text-[#1D1D1F] mb-1">
                        {(report.memory_snapshot as Record<string, string>).title}
                      </p>
                    )}
                    <p className="font-serif italic text-xs leading-relaxed text-[#2C2C2E]">
                      "{(report.memory_snapshot as Record<string, string> | null)?.content ?? "(memory deleted)"}"
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-[#71717A] flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{(report.memory_snapshot as Record<string, string> | null)?.location_name ?? "Unknown location"}</span>
                    </p>
                  </div>

                  {/* User commentary */}
                  {report.details && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <strong className="text-gray-800">Reporter Comment: </strong>
                      <span>{report.details}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDismiss(report.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-black cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Dismiss (Mark Safe)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(report.memory_id, report.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete from Map</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
