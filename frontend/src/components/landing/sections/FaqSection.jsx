import { useState } from "react";
import { FAQ_DATA } from "../../../data/landing/faq.js";
import Reveal from "../Reveal.jsx";

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section className="border-b border-[#222228] py-24" id="faq">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div className="mb-12 max-w-[640px]">
            <span className="mb-3 inline-block font-['JetBrains_Mono',monospace] text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#f2c800] tabular-nums">
              04 / Details
            </span>
            <h2 className="mb-[14px] text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
              Questions, answered plainly.
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="max-w-[780px] border-t border-[#222228]">
            {FAQ_DATA.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className="border-b border-[#222228]">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-5 text-left text-[15.5px] font-medium text-[#f4f4f5] transition-colors duration-200 ease-out hover:text-[#f2c800]"
                    onClick={() => toggle(idx)}
                  >
                    <span>{item.q}</span>
                    <span
                      className={`grid h-5 w-5 place-items-center text-[#9898a3] transition-[transform_0.3s_cubic-bezier(0.16,1,0.3,1),color_0.2s_ease] ${
                        isOpen ? "rotate-45 text-[#f2c800]" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[660px] pb-5 text-sm leading-[1.65] text-[#9898a3]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
