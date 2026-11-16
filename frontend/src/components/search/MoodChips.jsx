const MOODS = ["Funny", "Dramatic", "Emotional", "Exciting", "Sad", "Angry"];

export default function MoodChips({ onSelect, active, disabled }) {
	return (
		<div className="w-full overflow-x-auto overflow-y-hidden scrollbar-none touch-pan-x">
			<div className="flex items-center justify-center gap-2 w-max min-w-full px-3">
				{MOODS.map((mood) => (
					<button
						key={mood}
						disabled={disabled}
						onClick={() => onSelect(mood)}
						className={`shrink-0 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm leading-4 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
							active === mood
								? "border-yellow-500/70 bg-yellow-500/10 text-yellow-400"
								: "border-[#24242b] bg-[#121216] text-slate-400 hover:border-slate-500 hover:text-slate-200"
						}`}
					>
						{mood}
					</button>
				))}
			</div>
		</div>
	);
}
