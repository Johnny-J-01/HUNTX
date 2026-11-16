import { useClipLab } from "../../../hooks/landing/useClipLab.js";
import { PrecisionFeatureIcon } from "../icons.jsx";

export default function ClipLabCard() {
  const {
    startSec,
    endSec,
    padBefore,
    padAfter,
    dur,
    nudgeStart,
    nudgeEnd,
    decPadBefore,
    incPadBefore,
    decPadAfter,
    incPadAfter,
    reset,
    fmtClock,
  } = useClipLab();

  const timeBoxClass =
    "rounded-[6px] border border-[#222228] bg-[#070708] p-[11px]";
  const timeReadoutClass =
    "font-['JetBrains_Mono',monospace] grid h-[27px] flex-1 place-items-center rounded border border-[#222228] bg-[#0d0d10] text-[11.5px] font-semibold tabular-nums text-[#f2c800]";
  const padButtonClass =
    "grid h-6 w-6 place-items-center rounded border border-[#222228] bg-[#141418] text-[13px] text-[#f4f4f5] transition-[border-color] duration-[180ms] ease-out hover:border-[#f2c800]/45";
  const nudgeButtonClass =
    "h-[27px] rounded border border-[#222228] bg-[#141418] px-[6px] font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums text-[#9898a3] transition-all duration-[160ms] ease-out hover:border-[#f2c800]/45 hover:text-[#f4f4f5] active:scale-95";

  return (
    <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[14px] border border-[#222228] bg-[#0d0d10] p-[26px] transition-[border-color] duration-[280ms] ease-out after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(242,200,0,0.45),transparent)] after:opacity-0 after:transition-opacity after:duration-[350ms] after:content-[''] hover:border-[#34343d] hover:after:opacity-100">
      <div>
        <div className="mb-[14px] flex items-center justify-between">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#222228] bg-[#141418] text-[#f2c800]">
            <PrecisionFeatureIcon />
          </span>
          <span
            className="rounded-[5px] border border-[#f2c800]/45 bg-[#f2c800]/10 px-[9px] py-[3px] font-['JetBrains_Mono',monospace] text-[11.5px] font-semibold tabular-nums text-[#f2c800]"
            id="labDurationBadge"
          >
            Clip Duration: {dur.toFixed(1)}s ({fmtClock(dur).slice(0, -2)})
          </span>
        </div>
        <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.02em]">Sub-Second Timeline &amp; Context Padding</h3>
        <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">
          Dial boundaries with ±0.1s and ±1s nudges, expand Before/After context buffers, or snap back with Reset Clip.
        </p>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-[10px] max-[640px]:grid-cols-1">
          {/* Start Time */}
          <div className={timeBoxClass}>
            <div className="mb-[9px] flex justify-between text-[10px] text-[#5e5e68]">
              <span>START TIME</span>
              <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[#f2c800]" id="labStartSec">
                {startSec.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeStart(-1)}
              >
                -1s
              </button>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeStart(-0.1)}
              >
                -0.1s
              </button>
              <div className={timeReadoutClass} id="labStartClock">
                {fmtClock(startSec)}
              </div>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeStart(0.1)}
              >
                +0.1s
              </button>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeStart(1)}
              >
                +1s
              </button>
            </div>
          </div>

          {/* End Time */}
          <div className={timeBoxClass}>
            <div className="mb-[9px] flex justify-between text-[10px] text-[#5e5e68]">
              <span>END TIME</span>
              <span className="font-['JetBrains_Mono',monospace] tabular-nums text-[#f2c800]" id="labEndSec">
                {endSec.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeEnd(-1)}
              >
                -1s
              </button>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeEnd(-0.1)}
              >
                -0.1s
              </button>
              <div className={timeReadoutClass} id="labEndClock">
                {fmtClock(endSec)}
              </div>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeEnd(0.1)}
              >
                +0.1s
              </button>
              <button
                type="button"
                className={nudgeButtonClass}
                onClick={() => nudgeEnd(1)}
              >
                +1s
              </button>
            </div>
          </div>
        </div>

        {/* Padding Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-[10px] border-t border-[#222228] pt-3">
          <div className="flex items-center gap-[7px] text-xs text-[#9898a3]">
            <span>Before:</span>
            <button type="button" className={padButtonClass} onClick={decPadBefore}>
              −
            </button>
            <span
              className="min-w-[22px] text-center font-['JetBrains_Mono',monospace] tabular-nums text-[#f2c800]"
              id="padBeforeVal"
            >
              {padBefore}s
            </span>
            <button type="button" className={padButtonClass} onClick={incPadBefore}>
              +
            </button>

            <span className="ml-2">After:</span>
            <button type="button" className={padButtonClass} onClick={decPadAfter}>
              −
            </button>
            <span
              className="min-w-[22px] text-center font-['JetBrains_Mono',monospace] tabular-nums text-[#f2c800]"
              id="padAfterVal"
            >
              {padAfter}s
            </span>
            <button type="button" className={padButtonClass} onClick={incPadAfter}>
              +
            </button>
          </div>
          <button
            type="button"
            className="h-[27px] rounded border border-[#222228] bg-[#141418] px-[10px] font-['JetBrains_Mono',monospace] text-[10.5px] tabular-nums text-[#9898a3] transition-all duration-[160ms] ease-out hover:border-[#f2c800]/45 hover:text-[#f4f4f5] active:scale-95"
            id="labResetBtn"
            onClick={reset}
          >
            Reset Clip
          </button>
        </div>
      </div>
    </div>
  );
}
