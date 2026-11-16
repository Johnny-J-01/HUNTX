import { MOOD_KEYS } from "../../../data/landing/moods.js";
import { SearchIcon } from "../icons.jsx";

export default function HeroSearch({
  searchValue,
  setSearchValue,
  activeMood,
  onSelectMood,
}) {
  return (
    <div className="flex flex-col items-center gap-[10px] border-b border-[#222228] bg-[#0d0d10] px-[18px] py-[14px]">
      <div className="flex w-full max-w-[460px] items-center gap-[6px] rounded-[6px] border border-[#222228] bg-[#070708] p-[4px_4px_4px_12px] transition-[border-color] duration-200 ease-out focus-within:border-[#f2c800]/45">
        <input
          type="text"
          className="flex-1 border-none bg-transparent font-['Inter',sans-serif] text-[12.5px] text-[#f4f4f5] outline-none"
          id="heroSearchInput"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Moment search query"
        />
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded-[5px] border border-[#f2c800]/45 bg-[#f2c800]/10 text-[#f2c800] transition-[background-color] duration-200 ease-out hover:bg-[rgba(242,200,0,0.2)]"
          id="heroSearchTrigger"
          title="Search moment"
        >
          <SearchIcon />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-[6px]" id="moodChips">
        {MOOD_KEYS.map((mood) => {
          const isActive = activeMood === mood;
          return (
            <button
              key={mood}
              type="button"
              className={`h-[25px] rounded-[5px] border px-[10px] text-[11.5px] transition-all duration-200 ease-out ${
                isActive
                  ? "border-[#f2c800]/45 bg-[#f2c800]/10 text-[#f2c800] hover:border-[#f2c800]/45 hover:text-[#f2c800]"
                  : "border-[#222228] bg-[#141418] text-[#9898a3] hover:border-[#34343d] hover:text-[#f4f4f5]"
              }`}
              onClick={() => onSelectMood(mood)}
            >
              {mood}
            </button>
          );
        })}
      </div>
    </div>
  );
}
