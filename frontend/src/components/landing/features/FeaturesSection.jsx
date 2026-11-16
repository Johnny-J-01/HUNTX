import MoodSpectrumCard from "./MoodSpectrumCard.jsx";
import AiSuggestionsCard from "./AiSuggestionsCard.jsx";
import CaptionsCard from "./CaptionsCard.jsx";
import ClipLabCard from "./ClipLabCard.jsx";
import ExportPresetsCard from "./ExportPresetsCard.jsx";
import Reveal from "../Reveal.jsx";

export default function FeaturesSection({ activeMood }) {
  return (
    <section className="border-b border-[#222228] py-24" id="features">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div className="mb-12 max-w-[640px]">
            <span className="mb-3 inline-block font-['JetBrains_Mono',monospace] text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#f2c800] tabular-nums">
              03 / Features
            </span>
            <h2 className="mb-[14px] text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
              Everything required to hunt, refine, and ship clips.
            </h2>
            <p className="text-[15.5px] leading-[1.65] text-[#9898a3]">
              Built as a cohesive editor’s toolkit—from vibe-based moment discovery to tenth-of-a-second trimming and multi-platform MP4 exports.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-5">
          {/* Row 1: Discovery & Captions */}
          <Reveal>
            <div className="grid grid-cols-3 gap-5 max-[980px]:grid-cols-1">
              <MoodSpectrumCard activeMood={activeMood} />
              <AiSuggestionsCard />
              <CaptionsCard />
            </div>
          </Reveal>

          {/* Row 2: Integrated Precision Control & Export Presets */}
          <Reveal>
            <div className="grid grid-cols-2 gap-5 max-[980px]:grid-cols-1">
              <ClipLabCard />
              <ExportPresetsCard />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
