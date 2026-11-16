import { MoodFeatureIcon } from "../icons.jsx";
import { MOOD_DATA } from "../../../data/landing/moods.js";

export default function MoodSpectrumCard({ activeMood }) {
  const current = MOOD_DATA[activeMood] || MOOD_DATA.Funny;
  const bars = current.bars || [28, 68, 92, 54, 34, 82, 100, 62, 40, 74, 30];

  return (
    <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[14px] border border-[#222228] bg-[#0d0d10] p-[26px] transition-[border-color] duration-[280ms] ease-out after:absolute after:left-6 after:right-6 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(242,200,0,0.45),transparent)] after:opacity-0 after:transition-opacity after:duration-[350ms] after:content-[''] hover:border-[#34343d] hover:after:opacity-100">
      <div>
        <div className="mb-[14px] flex items-center justify-between">
          <span className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-[#222228] bg-[#141418] text-[#f2c800]">
            <MoodFeatureIcon />
          </span>
          <span className="font-['JetBrains_Mono',monospace] text-[11px] tabular-nums text-[#5e5e68]">
            6 EMOTION TAGS
          </span>
        </div>
        <h3 className="mb-2 text-[17.5px] font-semibold tracking-[-0.02em]">Mood-Based Search</h3>
        <p className="text-[13.5px] leading-[1.6] text-[#9898a3]">
          Filter moments by emotional tone—Funny, Dramatic, Emotional, Exciting, Sad, or Angry—without guessing exact wording.
        </p>
      </div>

      <div className="rounded-[10px] border border-[#222228] bg-[#070708] p-[14px]">
        <div className="flex justify-between font-['JetBrains_Mono',monospace] text-[11px] tabular-nums">
          <span className="text-[#9898a3]">Active Mood</span>
          <span className="text-[#f2c800]" id="featureMoodLabel">
            {activeMood} · {current.score}%
          </span>
        </div>
        <div className="mt-3 flex h-9 items-end gap-[5px]" id="spectrumBars">
          {bars.map((heightPct, idx) => {
            const isLit = heightPct >= 50;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-[2px] transition-[height_0.35s_cubic-bezier(0.16,1,0.3,1),background-color_0.25s_ease] ${
                  isLit ? "bg-[#f2c800] shadow-[0_0_10px_rgba(242,200,0,0.25)]" : "bg-[#23232a]"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
