import { useState } from "react";
import { WORKSTATION_RESULTS } from "../../../data/landing/results.js";

export default function HeroResults({
  activeResultId,
  onSelectResult,
}) {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <aside className="flex flex-col gap-3 border-l border-[#222228] bg-[#0d0d10] p-[14px] max-[980px]:border-b max-[980px]:border-t max-[980px]:border-l-0">
      <div className="flex gap-[14px] border-b border-[#222228] pb-2">
        <button
          type="button"
          className={`border-b-[1.5px] pb-1 text-[11.5px] transition-[color,border-color] duration-200 ease-out ${
            activeTab === "search"
              ? "border-[#f2c800] font-medium text-[#f2c800]"
              : "border-transparent text-[#5e5e68]"
          }`}
          onClick={() => setActiveTab("search")}
        >
          Search Results
        </button>
        <button
          type="button"
          className={`border-b-[1.5px] pb-1 text-[11.5px] transition-[color,border-color] duration-200 ease-out ${
            activeTab === "ai"
              ? "border-[#f2c800] font-medium text-[#f2c800]"
              : "border-transparent text-[#5e5e68]"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI Suggestions
        </button>
      </div>

      <div id="wsResultsList" className="flex flex-col gap-2">
        {WORKSTATION_RESULTS.map((res) => {
          const isActive = activeResultId === res.id;
          return (
            <button
              key={res.id}
              type="button"
              className={`w-full rounded-[6px] border p-[9px_10px] text-left transition-[border-color,background-color] duration-200 ease-out ${
                isActive
                  ? "border-[#f2c800]/45 bg-[#f2c800]/[0.05]"
                  : "border-[#222228] bg-[#141418] hover:border-[#f2c800]/45 hover:bg-[#f2c800]/[0.05]"
              }`}
              onClick={() => onSelectResult(res)}
            >
              <span className="mb-[3px] block font-['JetBrains_Mono',monospace] text-[10px] tabular-nums text-[#f2c800]">
                {res.timeDisplay}
              </span>
              <div className="text-[11px] leading-[1.4] text-[#9898a3]">{res.text}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
