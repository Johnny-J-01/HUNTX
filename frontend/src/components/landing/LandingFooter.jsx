export default function LandingFooter() {
	const handleScrollTo = (e, targetId) => {
		e.preventDefault();
		const target = document.getElementById(targetId);
		if (target) {
			target.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleBrandClick = (e) => {
		e.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const footerLinkClass =
		"text-[#5e5e68] transition-colors duration-200 ease-out hover:text-[#f4f4f5]";

	return (
		<footer className="border-t border-[#222228] py-7 text-[13px] text-[#5e5e68]">
			<div className="mx-auto w-full max-w-[1220px] px-6 flex flex-wrap items-center justify-between gap-4">
				<a
					href="#"
					onClick={handleBrandClick}
					className="group inline-flex items-center gap-[10px] font-['JetBrains_Mono',monospace] text-base font-semibold tracking-[-0.02em]"
					aria-label="VidHntr Home"
				>
					<span className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border border-[#2a2a32] bg-[#111114] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color_0.25s_ease,box-shadow_0.25s_ease] group-hover:border-[#f2c800]/45 group-hover:shadow-[0_0_16px_rgba(242,200,0,0.14)]">
						<img
							src="/VHntr_Logo.png"
							alt="VidHntr Logo"
							width="30"
							height="30"
							className="object-contain"
						/>
					</span>
					<span className="font-custom font-black text-[16px] tracking-widest bg-gradient-to-r from-white via-white to-[#facc15] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">
						Vid
						<span className="text-[#facc15] bg-none text-transparent bg-clip-text">
							H
						</span>
						ntr
					</span>
					{/* <span className="text-[#f4f4f5]">VidHntr</span> */}
				</a>

				<div className="flex items-center gap-[22px]">
					<a
						href="#comparison"
						onClick={(e) => handleScrollTo(e, "comparison")}
						className={footerLinkClass}
					>
						Why VidHntr
					</a>
					<a
						href="#workflow"
						onClick={(e) => handleScrollTo(e, "workflow")}
						className={footerLinkClass}
					>
						Workflow
					</a>
					<a
						href="#features"
						onClick={(e) => handleScrollTo(e, "features")}
						className={footerLinkClass}
					>
						Features
					</a>
					<a
						href="/studio"
						onClick={(e) => {
							e.preventDefault();
							window.location.href = "/studio";
						}}
						className={footerLinkClass}
					>
						Open App
					</a>
				</div>

				<span className="font-['JetBrains_Mono',monospace] text-xs tabular-nums text-[#5e5e68]">
					vid-hntr.vercel.app
				</span>
			</div>
		</footer>
	);
}
