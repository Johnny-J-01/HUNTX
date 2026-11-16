import { WORKFLOW_STEPS } from "../../../data/landing/workflow.js";
import { DownloadIcon, PlayIcon } from "../icons.jsx";
import Reveal from "../Reveal.jsx";

export default function WorkflowSection() {
  const workflowCardClass =
    "group flex flex-col rounded-[14px] border border-[#222228] bg-[#101013] p-[22px] transition-[border-color_0.3s_ease,transform_0.4s_cubic-bezier(0.16,1,0.3,1),box-shadow_0.4s_ease] hover:-translate-y-1 hover:border-[#34343d] hover:shadow-[0_20px_48px_rgba(0,0,0,0.45)]";
  const workflowStageClass =
    "relative mb-6 grid h-[184px] place-items-center overflow-hidden rounded-[10px] border border-[#1b1b21] bg-[#09090b] transition-[border-color] duration-300 ease-out group-hover:border-[#2b2b34]";

  return (
    <section className="border-b border-[#222228] py-24" id="workflow">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div className="mb-12 max-w-[640px]">
            <span className="mb-3 inline-block font-['JetBrains_Mono',monospace] text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#f2c800] tabular-nums">
              02 / Workflow
            </span>
            <h2 className="mb-[14px] text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
              From raw footage to posted clip, in three clean steps.
            </h2>
            <p className="text-[15.5px] leading-[1.65] text-[#9898a3]">
              Ingest local video files or YouTube links, locate moments by tone or natural language, and ship formatted clips directly.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-3 gap-5 max-[980px]:grid-cols-1">
            {/* Card 01: Ingest */}
            <div className={workflowCardClass}>
              <div className="mb-[14px] font-['JetBrains_Mono',monospace] text-xs text-[#5e5e68] tabular-nums">
                {WORKFLOW_STEPS[0].num}
              </div>
              <div className={workflowStageClass}>
                <div className="relative flex h-[92px] w-[142px] -rotate-[3.5deg] flex-col items-center justify-center gap-[3px] rounded-[10px] border border-[#26262e] bg-[#16161b] transition-[transform_0.45s_cubic-bezier(0.16,1,0.3,1),border-color_0.3s_ease] group-hover:translate-y-[-3px] group-hover:rotate-0 group-hover:border-[#f2c800]/45">
                  <span className="font-['JetBrains_Mono',monospace] text-[15px] font-bold tracking-[0.04em] text-[#f2c800] tabular-nums">
                    MP4
                  </span>
                  <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#5e5e68] tabular-nums">
                    42:16
                  </span>
                  <span className="absolute -bottom-[11px] -right-[11px] grid h-[30px] w-[30px] place-items-center rounded-full border border-[#f2c800]/45 bg-[#0d0d10] text-[#f2c800] shadow-[0_0_18px_rgba(242,200,0,0.2)] transition-[transform_0.35s_cubic-bezier(0.16,1,0.3,1),box-shadow_0.35s_ease] group-hover:translate-y-[2px] group-hover:scale-[1.06] group-hover:shadow-[0_0_24px_rgba(242,200,0,0.42)]">
                    <DownloadIcon />
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.02em]">{WORKFLOW_STEPS[0].title}</h3>
              <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">{WORKFLOW_STEPS[0].desc}</p>
            </div>

            {/* Card 02: Search */}
            <div className={workflowCardClass}>
              <div className="mb-[14px] font-['JetBrains_Mono',monospace] text-xs text-[#5e5e68] tabular-nums">
                {WORKFLOW_STEPS[1].num}
              </div>
              <div className={workflowStageClass}>
                <div className="relative grid h-11 w-[215px] place-items-center rounded-[10px] border border-[#25252d] bg-[#141418] text-xs italic text-[#9898a3] transition-[border-color,color] duration-300 ease-out group-hover:border-[#363642] group-hover:text-[#f4f4f5]">
                  <span>“Find the strongest hook”</span>
                  <span className="absolute bottom-0 left-[14px] right-[14px] h-[2px] rounded-[2px] bg-[#f2c800] shadow-[0_0_14px_rgba(242,200,0,0.65)] transition-[left_0.4s_cubic-bezier(0.16,1,0.3,1),right_0.4s_cubic-bezier(0.16,1,0.3,1),box-shadow_0.3s_ease] group-hover:left-[6px] group-hover:right-[6px] group-hover:shadow-[0_0_20px_rgba(242,200,0,0.9)]" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.02em]">{WORKFLOW_STEPS[1].title}</h3>
              <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">{WORKFLOW_STEPS[1].desc}</p>
            </div>

            {/* Card 03: Export */}
            <div className={workflowCardClass}>
              <div className="mb-[14px] font-['JetBrains_Mono',monospace] text-xs text-[#5e5e68] tabular-nums">
                {WORKFLOW_STEPS[2].num}
              </div>
              <div className={workflowStageClass}>
                <div className="flex items-center gap-[18px]">
                  <div className="flex h-28 w-[66px] flex-col items-center justify-between rounded-[10px] border border-[#26262e] bg-[#141418] px-2 pb-[10px] pt-[14px] transition-[border-color_0.35s_ease,transform_0.4s_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:border-[#f2c800]/45">
                    <div />
                    <div className="grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-[#f2c800]/45 bg-[#f2c800]/10 text-[#f2c800] transition-[transform_0.35s_cubic-bezier(0.16,1,0.3,1),background-color_0.3s_ease] group-hover:scale-110 group-hover:bg-[rgba(242,200,0,0.22)]">
                      <PlayIcon />
                    </div>
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] font-semibold tabular-nums text-[#f2c800]">
                      9:16
                    </span>
                  </div>
                  <div className="flex flex-col gap-[7px] font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.06em] text-[#5e5e68] tabular-nums">
                    <span className="transition-[color_0.25s_ease,transform_0.3s_cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[3px] group-hover:text-[#f4f4f5]">
                      SHORTS
                    </span>
                    <span className="transition-[color_0.25s_ease,transform_0.3s_cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[3px] group-hover:text-[#f2c800] group-hover:delay-[60ms]">
                      REELS
                    </span>
                    <span className="transition-[color_0.25s_ease,transform_0.3s_cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[3px] group-hover:text-[#f4f4f5] group-hover:delay-[120ms]">
                      TIKTOK
                    </span>
                  </div>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.02em]">{WORKFLOW_STEPS[2].title}</h3>
              <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">{WORKFLOW_STEPS[2].desc}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
