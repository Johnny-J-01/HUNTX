import { SPECS_DATA } from "../../../data/landing/specs.js";
import Reveal from "../Reveal.jsx";

export default function SpecsStrip() {
  return (
    <section className="border-b border-[#222228] py-[72px]">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div className="grid grid-cols-4 overflow-hidden rounded-[10px] border border-[#222228] bg-[#0d0d10] max-[980px]:grid-cols-1">
            {SPECS_DATA.map((spec, idx) => (
              <div
                key={idx}
                className="border-r border-[#222228] p-[26px_24px] last:border-r-0 max-[980px]:border-b max-[980px]:border-r-0 max-[980px]:last:border-b-0"
              >
                <div className="mb-[6px] font-['JetBrains_Mono',monospace] text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#f2c800]">
                  {spec.num}
                </div>
                <div className="text-[13px] text-[#9898a3]">{spec.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
