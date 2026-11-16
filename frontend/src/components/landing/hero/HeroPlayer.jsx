export default function HeroPlayer({
  clipRange,
  subtitle,
  timestamp,
  fill,
  activeTag,
}) {
  return (
    <div className="flex flex-col gap-3 bg-[#070708] px-4 py-[14px]">
      <div className="flex items-center justify-between text-xs font-medium text-[#f4f4f5]">
        <span>← VidHntr Demo.mp4</span>
        <span
          className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]"
          id="heroActiveTag"
        >
          {activeTag}
        </span>
      </div>

      <div className="relative flex aspect-[16/8.5] flex-col justify-between overflow-hidden rounded-[6px] border border-[#222228] bg-[#040405] p-[18px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px]" />
        <span
          className="relative z-[2] self-start rounded border border-[#222228] bg-[#0d0d10]/85 px-2 py-1 font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums text-[#f2c800]"
          id="heroClipWindow"
        >
          CLIP {clipRange}
        </span>
        <div
          className="relative z-[2] mx-auto mb-[6px] mt-auto max-w-[500px] text-center text-[clamp(13px,1.4vw,15.5px)] font-semibold leading-[1.4] text-[#f2c800] [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]"
          id="heroSubtitle"
        >
          {subtitle}
        </div>
        <div className="relative z-[2] flex items-center gap-[10px] border-t border-white/[0.07] pt-2 font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#9898a3]">
          <span>▶</span>
          <div className="relative h-[3px] flex-1 overflow-hidden rounded-[2px] bg-[#232329]">
            <div
              className="absolute inset-y-0 left-0 rounded-[2px] bg-[#f2c800] transition-[width] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              id="heroScrubberFill"
              style={{ width: fill }}
            />
          </div>
          <span id="heroTimestamp">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
