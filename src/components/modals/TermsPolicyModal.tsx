import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldAlert,
  Lock,
  UserX,
  MapPin,
  FileText,
  AlertTriangle,
  Scale,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PolicyTab = "terms" | "safety" | "privacy";

export function TermsPolicyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("safety");

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 select-text">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex w-full max-w-2xl flex-col max-h-[min(90dvh,calc(100vh-2rem))] rounded-2xl bg-white shadow-2xl border border-gray-200 text-[#1D1D1F] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-[#FAF9F6]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white shadow-sm">
                  <Scale className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#16223B] tracking-tight">
                    Terms of Service & Community Safety Policy
                  </h2>
                  <p className="text-[11px] text-[#71717A]">
                    Official Governance Framework · Golpo Archive
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="text-gray-400 hover:text-black p-1.5 rounded-full hover:bg-gray-200/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex items-center gap-1.5 border-t border-gray-200/70 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("safety")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTab === "safety"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>Community Safety</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("terms")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTab === "terms"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span>Terms of Service</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeTab === "privacy"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Privacy & Anonymity</span>
              </button>
            </div>
          </div>

          {/* Scrollable Policy Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 text-xs leading-relaxed text-[#3A3A3C] space-y-5">
            {activeTab === "safety" && (
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-950">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <h3 className="font-semibold text-xs text-rose-900 uppercase tracking-wide">
                      Strict Anti-Harassment & Anti-Mocking Mandate
                    </h3>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-rose-900">
                    Golpo is designed strictly for constructive, reflective, and poetic human narratives. Harassment, targeting individuals, mocking, or posting defamatory statements is strictly prohibited and subject to immediate, permanent account termination and content removal.
                  </p>
                </div>

                {/* Section 1 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B] flex items-center gap-2">
                    <UserX className="h-4 w-4 text-rose-600" />
                    1. Prohibition of Targeted Abuse, Mocking & Defamation
                  </h4>
                  <p className="text-gray-600">
                    Users shall not author, anchor, or distribute content that:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-1">
                    <li>Directly or indirectly mocks, bullies, ridicules, or demeans specific persons or institutions.</li>
                    <li>Air grievances, personal vendettas, malicious gossip, or defamatory allegations disguised as memories.</li>
                    <li>Uses derogatory, abusive, profane, or threatening language targeted at any person, community, gender, religion, or ethnicity.</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B] flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-rose-600" />
                    2. Anti-Doxxing & Personally Identifiable Information (PII)
                  </h4>
                  <p className="text-gray-600">
                    The disclosure of private personal data without explicit written consent is unlawful and strictly forbidden:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-1">
                    <li>Do not disclose real full names, residential addresses, workplaces, or school/university roll numbers.</li>
                    <li>Do not publish phone numbers, private messaging transcripts, email addresses, or social media handles.</li>
                    <li>Do not describe private residences or private individuals in a manner that compromises their physical safety or dignity.</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B] flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-gray-700" />
                    3. Content Reporting & Enforcement Protocol
                  </h4>
                  <p className="text-gray-600">
                    All memories undergo automated heuristic screening and community moderation. Users can report non-compliant memories directly via the story card menu. Flagged entries are reviewed by administrators and permanently removed within 24 hours.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "terms" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    1. Scope of Service & Eligibility
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Golpo is an anonymous geographic storytelling platform dedicated exclusively to the geographical territory of Bangladesh. By accessing or publishing content on Golpo, you agree to adhere unconditionally to these Terms of Service and applicable laws in the jurisdiction of Bangladesh.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    2. Geographic Integrity & Location Authenticity
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Users agree to anchor memories only to genuine locations within the borders of Bangladesh. Submitting false coordinates, automated scraping, bot-generated spam, or coordinate vandalism outside territorial boundaries will result in automated IP filtering and deletion.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    3. Content License & Rights of Removal
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    You retain ownership of your written words. By submitting content publicly, you grant Golpo a non-exclusive, worldwide, royalty-free license to display, index, and archive the submission on the geographic map. Golpo reserves the unilateral right to delete any submission at its sole discretion without liability.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    4. Limitation of Liability
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Golpo operates as an archival host. The views and expressions in submitted memories belong exclusively to their respective anonymous authors and do not represent the opinions of Golpo Ltd.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B] flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    1. Anonymity by Design
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Golpo does not require real names, photographs, or vanity metrics. All published stories are signed solely with cryptographic anonymous identifier badges (e.g., <code>GOLPO-XXXXX</code>).
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    2. Email Address Protection
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Your email address is utilized solely for account authentication, password recovery, and private journal synchronization. Your email is never exposed publicly, never sold to third parties, and never indexed in public map records.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white space-y-2">
                  <h4 className="font-bold text-sm text-[#16223B]">
                    3. Private Journaling Option
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Memories marked as <em>Private</em> remain accessible exclusively to your authenticated session and are hidden from the public map and other viewers.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-100 bg-[#FAF9F6] flex items-center justify-between">
            <span className="text-[11px] text-[#8E8E93]">
              Governed by Golpo Safety & Ethics Standards
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-black px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-all cursor-pointer"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

