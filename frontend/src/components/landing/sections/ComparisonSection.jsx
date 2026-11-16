import { COMPARISON_DATA } from "../../../data/landing/comparison.js";
import Reveal from "../Reveal.jsx";

export default function ComparisonSection() {
  const { oldWay, newWay } = COMPARISON_DATA;

  const compareCardClass =
    "flex flex-col justify-between rounded-[14px] border p-8 transition-[border-color_0.3s_ease,transform_0.35s_cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px]";
  const compareIconClass =
    "mt-[2px] grid h-6 w-6 shrink-0 place-items-center rounded-[6px] border text-xs";

  return (
    <section className="border-b border-[#222228] py-24" id="comparison">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div className="mb-12 max-w-[640px]">
            <span className="mb-3 inline-block font-['JetBrains_Mono',monospace] text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#f2c800] tabular-nums">
              01 / The Shift
            </span>
            <h2 className="mb-[14px] text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
              The old edit loop vs. the VidHntr way.
            </h2>
            <p className="text-[15.5px] leading-[1.65] text-[#9898a3]">
              Turning a 90-minute podcast, stream, or interview into one sharp clip shouldn’t eat half your afternoon across three separate apps.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-2 gap-5 max-[980px]:grid-cols-1">
            {/* Traditional Way */}
            <div className={`${compareCardClass} border-[#222228] bg-[#0a0a0c]`}>
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-[#222228] pb-5">
                  <div>
                    <div className="mb-1 font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]">
                      {oldWay.category}
                    </div>
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">
                      {oldWay.title}
                    </h3>
                  </div>
                </div>

                <div className="mb-7 flex flex-col gap-5">
                  {oldWay.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-[14px]">
                      <span className={`${compareIconClass} border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] text-[#f87171]`}>✕</span>
                      <div>
                        <h4 className="mb-1 text-[15px] font-semibold tracking-[-0.01em]">{item.title}</h4>
                        <p className="text-[13.5px] leading-[1.55] text-[#9898a3]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#222228] pt-[18px] font-['JetBrains_Mono',monospace] text-xs tabular-nums">
                <span className="text-[#5e5e68]">{oldWay.footerLabel}</span>
                <span className="text-[#f87171]">{oldWay.footerVal}</span>
              </div>
            </div>

            {/* VidHntr Way */}
            <div className={`${compareCardClass} border-[rgba(242,200,0,0.28)] bg-[linear-gradient(180deg,rgba(242,200,0,0.035)_0%,#0d0d10_55%)] hover:border-[#f2c800]/45`}>
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-[#222228] pb-5">
                  <div>
                    <div className="mb-1 font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#f2c800]">
                      {newWay.category}
                    </div>
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">
                      {newWay.title}
                    </h3>
                  </div>
                </div>

                <div className="mb-7 flex flex-col gap-5">
                  {newWay.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-[14px]">
                      <span className={`${compareIconClass} border-[#f2c800]/45 bg-[#f2c800]/10 text-[#f2c800]`}>✓</span>
                      <div>
                        <h4 className="mb-1 text-[15px] font-semibold tracking-[-0.01em]">{item.title}</h4>
                        <p className="text-[13.5px] leading-[1.55] text-[#9898a3]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#222228] pt-[18px] font-['JetBrains_Mono',monospace] text-xs tabular-nums">
                <span className="text-[#9898a3]">{newWay.footerLabel}</span>
                <span className="font-semibold text-[#f2c800]">
                  {newWay.footerVal}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
