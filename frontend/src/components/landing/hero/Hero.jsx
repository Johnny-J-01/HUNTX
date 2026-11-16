import { useState } from "react";
import HeroSearch from "./HeroSearch.jsx";
import HeroPlayer from "./HeroPlayer.jsx";
import HeroTimeline from "./HeroTimeline.jsx";
import HeroResults from "./HeroResults.jsx";
import { ArrowRightIcon } from "../icons.jsx";
import { MOOD_DATA } from "../../../data/landing/moods.js";
import Reveal from "../Reveal.jsx";

export default function Hero({ activeMood, onSelectMood }) {
	const [searchValue, setSearchValue] = useState(
		"What moment are you looking for?",
	);
	const [activeResultId, setActiveResultId] = useState("r1");

	const currentMoodInfo = MOOD_DATA[activeMood] || MOOD_DATA.Funny;
	const [customStage, setCustomStage] = useState(null);

	const stage = customStage || {
		left: currentMoodInfo.left,
		width: currentMoodInfo.width,
		dur: currentMoodInfo.dur,
		range: currentMoodInfo.range,
		stamp: currentMoodInfo.stamp,
		fill: currentMoodInfo.fill,
		sub: currentMoodInfo.sub,
		activeTag: `Filter: ${activeMood}`,
	};

	const handleMoodSelect = (mood) => {
		onSelectMood(mood);
		setActiveResultId(null);
		setCustomStage(null);
	};

	const handleResultSelect = (res) => {
		setActiveResultId(res.id);
		setCustomStage({
			left: `${res.start}%`,
			width: `${res.width}%`,
			dur: res.dur,
			range: res.range,
			stamp: res.stamp,
			fill: res.fill,
			sub: res.sub,
			activeTag: `Match: ${res.text.slice(0, 22)}…`,
		});
	};

	const handleExploreClick = (e) => {
		e.preventDefault();
		const target = document.getElementById("features");
		if (target) {
			target.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<section className="relative border-b border-[#222228] bg-[radial-gradient(60%_42%_at_50%_0%,rgba(242,200,0,0.045)_0%,transparent_70%)] pb-[88px] pt-[76px]">
			<div className="mx-auto w-full max-w-[1220px] px-6">
				<Reveal>
					<div className="mx-auto mb-12 max-w-[820px] text-center">
						<h1 className="mb-[18px] text-[clamp(2.25rem,4.7vw,3.7rem)] font-semibold leading-[1.08] tracking-[-0.038em] text-[#f4f4f5]">
							Hunt Down Any Video Moment
							<br />
							<span className="text-[#f2c800]">
								in Seconds, Not Hours.
							</span>
						</h1>
						<p className="mx-auto mb-[30px] max-w-[610px] text-[clamp(1rem,1.5vw,1.125rem)] leading-[1.6] text-[#9898a3]">
							VidHntr searches long-form footage by emotion or
							meaning, snaps straight to the timestamp with
							sub-second precision, and exports ready-to-post
							clips.
						</p>
						<div className="inline-flex flex-wrap items-center justify-center gap-3">
							<button
								type="button"
								onClick={() => {
									window.location.href = "/studio";
								}}
								className="group/btn relative inline-flex items-center justify-center gap-2 h-11 px-[22px] rounded-[6px] text-sm font-semibold tracking-[-0.01em] bg-[#f2c800] text-[#09090b] overflow-hidden transition-[background-color_0.22s_ease,box-shadow_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)] hover:bg-[#ffd619] hover:shadow-[0_6px_24px_rgba(242,200,0,0.18)] active:scale-[0.985] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.28)_50%,transparent_75%)] before:-translate-x-[110%] hover:before:translate-x-[110%] before:transition-transform before:duration-[550ms] before:ease-[cubic-bezier(0.16,1,0.3,1)]"
							>
								<span>Start Hunting Moments</span>
								<ArrowRightIcon width={15} height={15} />
							</button>
							<a
								href="#features"
								onClick={handleExploreClick}
								className="inline-flex items-center justify-center gap-2 h-11 px-[22px] rounded-[6px] text-sm font-medium tracking-[-0.01em] bg-[#0d0d10] border border-[#222228] text-[#9898a3] hover:bg-[#141418] hover:border-[#34343d] hover:text-[#f4f4f5] active:scale-[0.985] transition-[background-color_0.22s_ease,border-color_0.22s_ease,color_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)]"
							>
								Explore Features
							</a>
						</div>
					</div>
				</Reveal>

				{/* Interactive VidHntr Workstation Preview */}
				<Reveal>
					<div
						className="overflow-hidden rounded-[14px] border border-[#222228] bg-[#09090b] shadow-[0_30px_90px_rgba(0,0,0,0.72),inset_0_0_0_1px_rgba(255,255,255,0.02)]"
						aria-label="Interactive VidHntr preview"
					>
						<HeroSearch
							searchValue={searchValue}
							setSearchValue={setSearchValue}
							activeMood={activeMood}
							onSelectMood={handleMoodSelect}
						/>

						<div className="grid min-h-[430px] grid-cols-[220px_1fr_220px] max-[980px]:grid-cols-1">
							<aside className="flex flex-col gap-3 border-r border-[#222228] bg-[#0d0d10] p-[14px] max-[980px]:border-b max-[980px]:border-r-0">
								<div className="text-[11px] font-semibold tracking-[0.02em] text-[#9898a3]">
									Sources
								</div>
								<div className="rounded-[6px] border border-dashed border-[#2a2a33] bg-white/[0.01] px-[10px] py-4 text-center transition-[border-color] duration-250 ease-out hover:border-[#f2c800]/45 cursor-pointer">
									<div className="mb-[6px] inline-grid h-[26px] w-[26px] place-items-center rounded-[5px] bg-[#f2c800]/10 text-[10px] font-bold text-[#f2c800]">
										UP
									</div>
									<div className="text-xs font-medium text-[#f4f4f5]">
										Upload Video
									</div>
									<div className="mt-[3px] text-[10px] leading-[1.35] text-[#5e5e68]">
										MP4, MOV, WebM, MKV up to 500 MB · 1 day
										retention
									</div>
								</div>
								<div className="flex gap-[5px]">
									<div className="flex h-7 flex-1 items-center rounded-[5px] border border-[#222228] bg-[#070708] px-2 text-[11px] text-[#5e5e68]">
										YouTube URL
									</div>
									<div className="grid h-7 w-7 place-items-center rounded-[5px] border border-[#222228] bg-[#141418] text-sm text-[#f2c800] cursor-pointer">
										+
									</div>
								</div>
								<div className="mt-1 text-[11px] font-semibold tracking-[0.02em] text-[#9898a3]">
									VIDEOS
								</div>
								<div className="flex flex-col gap-1 rounded-[6px] border border-[#f2c800]/45 bg-[#f2c800]/[0.04] p-[9px]">
									<div className="truncate text-[11px] font-medium text-[#f4f4f5]">
										VidHntr Demo.mp4
									</div>
									<div className="flex items-center justify-between text-[10px] text-[#5e5e68]">
										<span className="inline-flex items-center gap-1 text-[#9898a3] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#22c55e] before:content-['']">
											Ready
										</span>
										<span className="font-['JetBrains_Mono',monospace] tabular-nums">
											02:29
										</span>
									</div>
								</div>
								<div className="flex flex-col gap-1 rounded-[6px] border border-[#222228] bg-[#141418] p-[9px] opacity-70">
									<div className="truncate text-[11px] font-medium text-[#f4f4f5]">
										VidHntr_WalkThrough.mov
									</div>
									<div className="flex items-center justify-between text-[10px] text-[#5e5e68]">
										<span className="inline-flex items-center gap-1 text-[#9898a3] before:h-[5px] before:w-[5px] before:rounded-full before:bg-[#22c55e] before:content-['']">
											Ready
										</span>
										<span className="font-['JetBrains_Mono',monospace] tabular-nums">
											10:24
										</span>
									</div>
								</div>
							</aside>

							<div className="flex min-w-0 flex-1 flex-col">
								<HeroPlayer
									clipRange={stage.range}
									subtitle={stage.sub}
									timestamp={stage.stamp}
									fill={stage.fill}
									activeTag={stage.activeTag}
								/>
								<div className="bg-[#070708] px-4 pb-[14px]">
									<HeroTimeline
										left={stage.left}
										width={stage.width}
										duration={stage.dur}
									/>
								</div>
							</div>

							<HeroResults
								activeResultId={activeResultId}
								onSelectResult={handleResultSelect}
							/>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
