"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface FooterHubProps {
  onOpenModal: (type: "terms" | "workflow") => void;
}

export default function FooterHub({ onOpenModal }: FooterHubProps) {
  return (
    <footer className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-10 text-center w-full">
      {/* Left: Modal Triggers */}
      <div className="flex flex-row items-center justify-center gap-5 text-[11px] sm:text-xs font-bold tracking-wide w-full md:w-auto order-1">
        <button
          type="button"
          onClick={() => onOpenModal("terms")}
          className="text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          Terms & Conditions <span className="text-[10px] text-[#f2b42c]">→</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenModal("workflow")}
          className="text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          How It Works <span className="text-[10px] text-[#f2b42c]">→</span>
        </button>
      </div>

      {/* Center: Copyright */}
      <div className="text-[10px] sm:text-[11px] font-medium text-white/40 tracking-wide order-3 md:order-2 w-full md:w-auto mt-1 md:mt-0">
        &copy; 2026 D-Global Growthfield. All Rights Reserved.
      </div>

      {/* Right: Ecosystem Outbound Links */}
      <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-x-5 gap-y-1 font-bold text-[11px] sm:text-xs w-full md:w-auto order-2 md:order-3">
        <a
          href="https://dglobalgrowthfield.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f2b42c] hover:underline inline-flex items-center gap-0.5 transition-colors"
        >
          Visit Website <ArrowUpRight className="w-3 h-3" />
        </a>
        <a
          href="https://learning.dglobalgrowthfield.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-300 hover:underline inline-flex items-center gap-0.5 transition-colors"
        >
          Visit LMS <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </footer>
  );
}