import { useState } from "react";
import { EXPORT_PRESETS, QUALITY_TIERS } from "../../../data/landing/presets.js";
import { PresetsFeatureIcon } from "../icons.jsx";

export default function ExportPresetsCard() {
  const [activePreset, setActivePreset] = useState(EXPORT_PRESETS[2]); // TikTok default
  const [activeQuality, setActiveQuality] = useState("High");

  const presetClass = (isActive) =>
    `h-[31px] rounded-[5px] border text-[11.5px] transition-all duration-200 ease-out ${
      isActive
        ? "border-[#f2c800] bg-[#f2c800]/10 font-medium text-[#f2c800] hover:border-[#f2c800] hover:text-[#f2c800]"
        : "border-[#222228] bg-[#070708] text-[#9898a3] hover:border-[#34343d] hover:text-[#f4f4f5]"
    }`;

  return (
    <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[14px] border border-[#222228] bg-[#0d0d10] p-[26px] transition-[border-color] duration-[280ms] ease-out after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(242,200,0,0.45),transparent)] after:opacity-0 after:transition-opacity after:duration-[350ms] after:content-[''] hover:border-[#34343d] hover:after:opacity-100">
      <div>
        <div className="mb-[14px] flex items-center justify-between">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#222228] bg-[#141418] text-[#f2c800]">
            <PresetsFeatureIcon />
          </span>
          <span
            className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]"
            id="exportMetaBadge"
          >
            {activePreset.ratio} · {activePreset.w}×{activePreset.h}
          </span>
        </div>
        <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.02em]">Platform Presets &amp; Flexible Export</h3>
        <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">
          Export straight to Shorts, Reels, TikTok, Square, or Landscape with fill-frame cropping and four quality tiers.
        </p>
      </div>

      <div>
        <div className="mb-3 grid grid-cols-3 gap-[7px] max-[640px]:grid-cols-2" id="presetGrid">
          {EXPORT_PRESETS.map((preset) => {
            const isActive = activePreset.name === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                className={presetClass(isActive)}
                onClick={() => setActivePreset(preset)}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        <div className="mb-[14px] grid grid-cols-4 gap-[7px]" id="qualityGrid">
          {QUALITY_TIERS.map((tier) => {
            const isActive = activeQuality === tier;
            return (
              <button
                key={tier}
                type="button"
                className={presetClass(isActive)}
                onClick={() => setActiveQuality(tier)}
              >
                {tier}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-[14px] rounded-[6px] border border-[#222228] bg-[#070708] p-3">
          <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[5px] border border-[#222228] bg-[#0d0d10]">
            <div
              className="rounded-[2px] border-[1.5px] border-[#f2c800] bg-[#f2c800]/10 transition-[width,height] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              id="liveAspectFrame"
              style={{ width: `${activePreset.fw}px`, height: `${activePreset.fh}px` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-[#f4f4f5]" id="livePresetTitle">
              {activePreset.name} · {activePreset.ratio} · {activeQuality} Quality
            </div>
            <div
              className="truncate font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]"
              id="emFileOutput"
            >
              ElevenLabs_voice_over__{activePreset.w}x{activePreset.h}.mp4
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/studio";
            }}
            className="group/btn relative inline-flex items-center justify-center gap-2 h-8 px-3 rounded-[6px] text-xs font-semibold tracking-[-0.01em] bg-[#f2c800] text-[#09090b] overflow-hidden transition-[background-color_0.22s_ease,box-shadow_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)] hover:bg-[#ffd619] hover:shadow-[0_6px_24px_rgba(242,200,0,0.18)] active:scale-[0.985] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.28)_50%,transparent_75%)] before:-translate-x-[110%] hover:before:translate-x-[110%] before:transition-transform before:duration-[550ms] before:ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
