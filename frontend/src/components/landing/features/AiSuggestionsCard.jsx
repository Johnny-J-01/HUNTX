import { AiFeatureIcon } from "../icons.jsx";

export default function AiSuggestionsCard() {
  const candidateClass =
    "flex items-center justify-between rounded-[6px] border border-[#222228] bg-[#070708] p-[9px_11px] text-xs";
  const scoreClass =
    "font-['JetBrains_Mono',monospace] text-[11px] font-semibold tabular-nums text-[#f2c800]";

  return (
    <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[14px] border border-[#222228] bg-[#0d0d10] p-[26px] transition-[border-color] duration-[280ms] ease-out after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(242,200,0,0.45),transparent)] after:opacity-0 after:transition-opacity after:duration-[350ms] after:content-[''] hover:border-[#34343d] hover:after:opacity-100">
      <div>
        <div className="mb-[14px] flex items-center justify-between">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#222228] bg-[#141418] text-[#f2c800]">
            <AiFeatureIcon />
          </span>
          <span className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]">
            AI SUGGESTIONS
          </span>
        </div>
        <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.02em]">AI Clip Suggestions</h3>
        <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">
          Switch tabs anytime to surface standout hooks, plot twists, and punchlines ranked automatically when you don’t know where to start.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className={candidateClass}>
          <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[#9898a3]">
            01:32.0 · Hook Reveal
          </span>
          <span className={scoreClass}>98 / 100</span>
        </div>
        <div className={candidateClass}>
          <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[#9898a3]">
            04:18.5 · Sharp Punchline
          </span>
          <span className={scoreClass}>94 / 100</span>
        </div>
        <div className={candidateClass}>
          <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[#9898a3]">
            07:02.1 · Key Takeaway
          </span>
          <span className={scoreClass}>89 / 100</span>
        </div>
      </div>
    </div>
  );
}
