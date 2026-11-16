import { ArrowRightIcon } from "../icons.jsx";
import Reveal from "../Reveal.jsx";

export default function FinalCta() {
  return (
    <section className="bg-[radial-gradient(50%_60%_at_50%_100%,rgba(242,200,0,0.06)_0%,transparent_75%)] py-24 text-center">
      <div className="mx-auto w-full max-w-[1220px] px-6">
        <Reveal>
          <div>
            <h2 className="mb-[14px] text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold tracking-[-0.03em] text-[#f4f4f5]">
              Stop scrubbing. Start shipping.
            </h2>
            <p className="mx-auto mb-7 max-w-[500px] text-[15px] text-[#9898a3]">
              Load your footage or paste a YouTube link and pull the exact clip you came for in seconds.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/studio";
              }}
              className="group/btn relative inline-flex items-center justify-center gap-2 h-11 px-[22px] rounded-[6px] text-sm font-semibold tracking-[-0.01em] bg-[#f2c800] text-[#09090b] overflow-hidden transition-[background-color_0.22s_ease,box-shadow_0.22s_ease,transform_0.22s_cubic-bezier(0.16,1,0.3,1)] hover:bg-[#ffd619] hover:shadow-[0_6px_24px_rgba(242,200,0,0.18)] active:scale-[0.985] before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.28)_50%,transparent_75%)] before:-translate-x-[110%] hover:before:translate-x-[110%] before:transition-transform before:duration-[550ms] before:ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <span>Launch VidHntr</span>
              <ArrowRightIcon width={15} height={15} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
