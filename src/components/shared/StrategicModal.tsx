'use client';

import React from 'react';
import { X } from 'lucide-react';

interface StrategicModalProps {
  type: 'terms' | 'workflow' | null;
  onClose: () => void;
}

export default function StrategicModal({ type, onClose }: StrategicModalProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#07020d]/80 backdrop-blur-md cursor-pointer" />

      {/* Modal Dialog */}
      <div className="relative w-full md:w-[60%] max-w-3xl bg-white text-slate-900 border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col h-[85vh] max-h-[720px] z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#512d7c]">
            {type === 'terms'
              ? 'DGG NexusHub Community — Terms of Service & Code of Conduct'
              : 'DGG NexusHub Community — Interactive Operational Guide'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-500 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fluid Scroll Body */}
        <div className="py-4 overflow-y-auto text-xs text-slate-600 leading-relaxed space-y-5 pr-2">
          {type === 'terms' ? (
            <>
              <div className="border-l-2 border-[#512d7c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  1. Mandatory Certificate ID Verification & Eligibility
                </h4>
                <p>
                   <strong className="text-slate-800">Identity & Credential Verification:</strong> To safeguard ecosystem security and prevent unauthorized registrations, all intern and apprentice sign-ups require a valid, verified DGG Certificate ID as the primary means of identity and skill verification.
                </p>
                <p>
                   <strong className="text-slate-800">Zero Certificate Cost & Enrollment Pathway:</strong> There are no payment encumbrances or fees required for verification. Individuals who do not currently possess a valid DGG Certificate ID must enroll in our Learning Management System (LMS) courses or join our upcoming cohort internship programs to acquire certified status before onboarding onto the talent placement network.
                </p>
                <p>
                   <strong className="text-slate-800">Account Security:</strong> Users are strictly prohibited from sharing login credentials, misrepresenting their identity, or using fraudulent certificate identifiers.
                </p>
              </div>

              <div className="border-l-2 border-[#f2b42c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  2. Tri-Party Incubation & Operational Standards
                </h4>
                <p>
                   <strong className="text-slate-800">Zero-Cost Labor Incubation:</strong> Participating startups receive vetted intern labor during the initial 3-month incubation cycle under structured developmental guidelines.
                </p>
                <p>
                   <strong className="text-slate-800">Facilitation & Administrative Surcharge:</strong> All post-incubation retention contracts, milestone disbursements, and formal arrangements must be brokered through the platform&apos;s secure negotiation desks under administrative oversight, subject to the standard 10% platform sustainability surcharge.
                </p>
                <p>
                   <strong className="text-slate-800">Conduct & Compliance:</strong> Both startups and interns must maintain professional conduct, respect intellectual property rights, and adhere to agreed milestone timelines.
                </p>
              </div>

              <div className="border-l-2 border-[#512d7c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  3. Subdomain Portfolio & Professional Identity Protocols
                </h4>
                <p>
                   <strong className="text-slate-800">Dedicated Portfolio Nodes:</strong> Verified interns are granted a professional subdomain portfolio handle at <code className="bg-purple-50 text-[#512d7c] px-1 py-0.5 rounded font-mono">nexushub.dglobalgrowthfield.com/portfolio/username</code> to showcase verified achievements and project milestones.
                </p>
                <p>
                   <strong className="text-slate-800">Accuracy of Records:</strong> Members are bound to maintain accurate professional records, project submissions, and employment history. Impersonation of enterprise partners or falsification of project deliverables is strictly prohibited.
                </p>
              </div>

              <div className="border-l-2 border-[#f2b42c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  4. Multi-Domain Affiliate & Commission Audits
                </h4>
                <p>
                   <strong className="text-slate-800">Transparent Earning System:</strong> Referral and affiliate earnings accrued through tracked promotional links across authorized corporate properties are audited and disbursed directly to registered Nigerian bank accounts (e.g., GTB, Access Bank).
                </p>
                <p>
                   <strong className="text-slate-800">Zero Tolerance for Fraud:</strong> Fraudulent clicks, automated traffic generation, self-referrals, or system manipulation will result in the forfeiture of accrued commissions and access review.
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  5. Intellectual Property & Platform Rights
                </h4>
                <p>
                   <strong className="text-slate-800">Proprietary Frameworks:</strong> All proprietary software architectures, community frameworks, branding elements, and course materials remain the exclusive intellectual property of D Global Growthfield (DGG).
                </p>
                <p>
                   <strong className="text-slate-800">Limitation of Liability:</strong> The platform acts as a secure intermediary and vetting bridge; while rigorous verification protocols are enforced, DGG is not directly liable for private external contractual disputes between independent startups and matched interns beyond the platform&apos;s mediation framework.
                </p>
              </div>

              <div className="border-l-2 border-purple-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  6. On-Platform Communication & Interaction Protocols
                </h4>
                <p>
                   <strong className="text-slate-800">Centralized Engagement:</strong> To maintain transparency, auditability, and security, all professional communications, milestone negotiations, and collaborative project discussions between startups and interns must be conducted directly within the platform&apos;s official communication channels and negotiation rooms.
                </p>
                <p>
                   <strong className="text-slate-800">Boundary Management:</strong> Participants are encouraged to keep core professional exchanges inside the platform ecosystem to ensure proper record-keeping and administrative support when needed.
                </p>
              </div>

              <div className="border-l-2 border-amber-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  7. Digital Asset Protection & Lawful Usage
                </h4>
                <p>
                   <strong className="text-slate-800">Confidentiality & Data Integrity:</strong> Users must protect all proprietary digital assets, source code, enterprise data, and training materials shared during the incubation process.
                </p>
                <p>
                    <strong className="text-slate-800">Unlawful Conduct Prohibition:</strong> All participants agree to use the platform exclusively for lawful educational, technological, and entrepreneurial development purposes. Any unauthorized data extraction, malicious code deployment, or engagement in prohibited digital activities is strictly restricted.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="border-l-2 border-[#f2b42c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 1: Access, Account Creation & Authentication
                </h4>
                <p>
                  <strong className="text-slate-800">Unified Onboarding:</strong> New participants select their designated portal track upon sign-up—either registering as an Enterprise/Startup partner or an Apprentice/Intern candidate.
                </p>
                <p>
                    <strong className="text-slate-800">Credentials & Verification:</strong> Interns authenticate using their verified DGG Certificate ID, while Startups register using their official corporate identifiers (RC numbers) to establish immediate platform trust.
                </p>
                <p>
                   <strong className="text-slate-800">Secure Sessions:</strong> Once authenticated via secure session management, users instantly claim their personalized workspace dashboard and professional profile handle.
                </p>
              </div>

              <div className="border-l-2 border-[#512d7c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 2: Startup Enterprise Verification & Desk Setup
                </h4>
                <p>
                   <strong className="text-slate-800">Vetting Protocol:</strong> Registered enterprises complete a streamlined verification review to validate their operational background and mentorship environment.
                </p>
                <p>
                   <strong className="text-slate-800">Escrow Vault Funding:</strong> Founders gain access to the dedicated Escrow & Stipends Hub, where they can model monthly placement budgets and securely fund project vaults via integrated gateway checkout.
                </p>
                <p>
                   <strong className="text-slate-800">Role Publishing:</strong> Verified startups can post specific internship roles, technical requirements, and milestone objectives directly to the talent sourcing pipeline.
                </p>
              </div>

              <div className="border-l-2 border-[#f2b42c] pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 3: Apprentice Talent Profiling & Skill Vault
                </h4>
                <p>
                   <strong className="text-slate-800">Portfolio Building:</strong> Apprentices curate their professional portfolios, displaying verified technical skill sets, completed modules, and project credentials.
                </p>
                <p>
                   <strong className="text-slate-800">Direct Application & Matching:</strong> Candidates browse open enterprise positions and submit applications into active hiring pipelines.
                </p>
                <p>
                   <strong className="text-slate-800">Tri-Party Negotiation:</strong> Selected candidates enter structured review desks where terms, milestone scopes, and trial stipends are finalized with administrative mediation.
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 4: 3-Month Zero-Cost Incubation & Workspace Collaboration
                </h4>
                <p>
                   <strong className="text-slate-800">Active Placement:</strong> Matched teams operate within dedicated workspace channels, utilizing sprint review desks to track weekly deliverables and milestones.
                </p>
                <p>
                   <strong className="text-slate-800">Transparent Disbursements:</strong> Startups can effortlessly dispatch trial stipends or release approved milestone funds from their available balance or via instant gateway settlement.
                </p>
                <p>
                   <strong className="text-slate-800">Dispute & Mediation Support:</strong> Built-in mediation desks ensure transparent conflict resolution and secure workflow protection for both parties throughout the incubation term.
                </p>
              </div>

              <div className="border-l-2 border-purple-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 5: Ecosystem Learning & Skill Pacing
                </h4>
                <p>
                   <strong className="text-slate-800">Continuous Upskilling:</strong> Participants connect seamlessly with advanced coursework and technical training tracks on <code className="font-mono text-[#512d7c]">learning.dglobalgrowthfield.com</code> to accelerate professional growth.
                </p>
                <p>
                   <strong className="text-slate-800">Progress Tracking:</strong> Regular evaluations and milestone completions are logged to reflect real-world competency and readiness.
                </p>
              </div>

              <div className="border-l-2 border-amber-500 pl-3 py-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Phase 6: Community Growth & Affiliate Enablement
                </h4>
                <p>
                   <strong className="text-slate-800">Ecosystem Extension:</strong> Beyond core placements, community members can engage with broader platform broadcasts, digital literacy programs, and collaborative network initiatives.
                </p>
                <p>
                   <strong className="text-slate-800">Value Creation:</strong> Active contributors leverage community tools to expand their professional reach, build enterprise networks, and scale sustainable tech ventures.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#512d7c] text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-[#3e215f] transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}