export default function HeroTimeline({
  left,
  width,
  duration,
}) {
  return (
    <div className="rounded-[6px] border border-[#222228] bg-[#0d0d10] px-3 py-[10px]">
      <div className="mb-[10px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-[#9898a3]">
          <span>Timeline Ruler</span>
          <span
            className="rounded border border-[#f2c800]/45 bg-[#f2c800]/10 px-[7px] py-[2px] font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums text-[#f2c800]"
            id="heroWindowPill"
          >
            Window: 0:54 – 2:29
          </span>
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums text-[#5e5e68]">
          Pan · Zoom · Focus Clip
        </div>
      </div>
      <div className="mb-[5px] grid grid-cols-[repeat(7,1fr)] font-['JetBrains_Mono',monospace] text-[9.5px] tabular-nums text-[#5e5e68]">
        <span>1:00</span>
        <span>1:10</span>
        <span>1:20</span>
        <span>1:30</span>
        <span>1:40</span>
        <span>1:50</span>
        <span>2:00</span>
      </div>
      <div className="relative h-8 overflow-hidden rounded border border-[#222228] bg-[#0a0a0c] bg-[repeating-linear-gradient(90deg,transparent,transparent_19px,rgba(255,255,255,0.04)_19px,rgba(255,255,255,0.04)_20px)]">
        <div
          className="absolute inset-y-0 grid place-items-center border-x-4 border-[#f2c800] bg-[#f2c800]/[0.16] transition-[left,width] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          id="heroSelectionBar"
          style={{ left, width }}
        >
          <span
            className="rounded-[3px] border border-[#f2c800]/45 bg-[#09090b] px-[6px] py-[2px] font-['JetBrains_Mono',monospace] text-[10px] font-semibold tabular-nums text-[#f2c800]"
            id="heroClipDur"
          >
            {duration}
          </span>
        </div>
      </div>
    </div>
  );
}
