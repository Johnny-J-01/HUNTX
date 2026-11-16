import { useScrollProgress } from "../../hooks/landing/useScrollProgress.js";

export default function ScrollPlayhead() {
  const progress = useScrollProgress();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] bg-[rgba(255,255,255,0.04)]" aria-hidden="true">
      <div
        className="h-full w-0 bg-[#f2c800] shadow-[0_0_10px_rgba(242,200,0,0.5)] transition-[width] duration-[80ms] ease-linear"
        id="scrollPlayhead"
        style={{ width: `${progress.toFixed(2)}%` }}
      />
    </div>
  );
}
