import { useState } from "react";
import { CaptionsFeatureIcon } from "../icons.jsx";

export default function CaptionsCard() {
  const [captionsOn, setCaptionsOn] = useState(true);

  return (
    <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[14px] border border-[#222228] bg-[#0d0d10] p-[26px] transition-[border-color] duration-[280ms] ease-out after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(242,200,0,0.45),transparent)] after:opacity-0 after:transition-opacity after:duration-[350ms] after:content-[''] hover:border-[#34343d] hover:after:opacity-100">
      <div>
        <div className="mb-[14px] flex items-center justify-between">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#222228] bg-[#141418] text-[#f2c800]">
            <CaptionsFeatureIcon />
          </span>
          <span className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]">
            SYNCED CAPTIONS
          </span>
        </div>
        <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.02em]">Instant Burned-In Captions</h3>
        <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">
          Toggle synchronized, feed-ready captions directly inside the editor or export modal so silent scrollers catch every word.
        </p>
      </div>

      <div className="rounded-[10px] border border-[#222228] bg-[#070708] px-[14px] py-4 text-center">
        <div
          className={`text-[13.5px] font-semibold text-[#f4f4f5] transition-opacity duration-200 ease-out ${
            captionsOn ? "opacity-100" : "opacity-[0.22]"
          }`}
          id="captionPreviewText"
        >
          “Find the <span className="text-[#f2c800]">exact moment</span> in seconds.”
        </div>
        <div className="mt-3 flex items-center justify-between text-[11.5px] text-[#9898a3]">
          <span className="font-['JetBrains_Mono',monospace] tabular-nums">Captions</span>
          <button
            type="button"
            className={`h-[27px] rounded border px-[10px] font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums transition-all duration-[160ms] ease-out active:scale-95 ${
              captionsOn
                ? "border-[#f2c800]/45 bg-[#141418] text-[#f2c800]"
                : "border-[#222228] bg-[#141418] text-[#5e5e68] hover:border-[#f2c800]/45 hover:text-[#f4f4f5]"
            }`}
            id="captionToggleBtn"
            onClick={() => setCaptionsOn(!captionsOn)}
          >
            {captionsOn ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
