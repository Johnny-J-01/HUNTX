import { useAuth } from "../../auth/AuthContext.jsx";
import { ArrowRightIcon } from "./icons.jsx";

export default function LandingNavbar() {
	const { user, signOut, loading } = useAuth();

	const handleSignOut = async () => {
		try {
			if (signOut) {
				await signOut();
			}
		} catch (err) {
			console.error("Sign out error:", err);
		}
	};

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

	const navLinkClass =
		"relative py-1 text-[13.5px] text-[#9898a3] transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-[#f2c800] after:transition-transform after:duration-[280ms] after:ease-[cubic-bezier(0.16,1,0.3,1)] after:content-[''] hover:text-[#f4f4f5] hover:after:origin-left hover:after:scale-x-100";

	const ghostBtnClass =
		"inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-[6px] text-[13.5px] font-medium tracking-[-0.01em] bg-[#0d0d10] border border-[#222228] text-[#9898a3] hover:bg-[#141418] hover:border-[#34343d] hover:text-[#f4f4f5] active:scale-[0.985] transition-[background-color_0.22s_ease,border-color_0.22s_ease,color_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)]";

	const goldBtnClass =
		"group/btn relative inline-flex items-center justify-center gap-2 h-[38px] px-4 rounded-[6px] text-[13.5px] font-semibold tracking-[-0.01em] bg-[#f2c800] text-[#09090b] overflow-hidden transition-[background-color_0.22s_ease,box-shadow_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)] hover:bg-[#ffd619] hover:shadow-[0_6px_24px_rgba(242,200,0,0.18)] active:scale-[0.985] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.28)_50%,transparent_75%)] before:-translate-x-[110%] hover:before:translate-x-[110%] before:transition-transform before:duration-[550ms] before:ease-[cubic-bezier(0.16,1,0.3,1)]";

	return (
		<header className="sticky top-0 z-50 border-b border-[#222228] bg-[#070708]/85 backdrop-blur-[12px]">
			<div className="mx-auto w-full max-w-[1220px] px-6 flex h-16 items-center justify-between gap-6">
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

				<nav className="flex items-center gap-7 max-[640px]:hidden">
					<a
						href="#comparison"
						onClick={(e) => handleScrollTo(e, "comparison")}
						className={navLinkClass}
					>
						Why VidHntr
					</a>
					<a
						href="#workflow"
						onClick={(e) => handleScrollTo(e, "workflow")}
						className={navLinkClass}
					>
						Workflow
					</a>
					<a
						href="#features"
						onClick={(e) => handleScrollTo(e, "features")}
						className={navLinkClass}
					>
						Features
					</a>
					<a
						href="#faq"
						onClick={(e) => handleScrollTo(e, "faq")}
						className={navLinkClass}
					>
						FAQ
					</a>
				</nav>

				<div className="flex items-center gap-[10px]">
					{loading ? (
						<div
							className="h-[38px] w-[195px]"
							aria-hidden="true"
						/>
					) : user ? (
						<>
							<button
								type="button"
								onClick={handleSignOut}
								className={ghostBtnClass}
							>
								Logout
							</button>
							<button
								type="button"
								onClick={() => {
									window.location.href = "/studio";
								}}
								className={goldBtnClass}
							>
								<span>Open Studio</span>
								<ArrowRightIcon />
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									window.location.href = "/signin";
								}}
								className={ghostBtnClass}
							>
								Sign In
							</button>
							<button
								type="button"
								onClick={() => {
									window.location.href = "/studio";
								}}
								className={goldBtnClass}
							>
								<span>Open Studio</span>
								<ArrowRightIcon />
							</button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
