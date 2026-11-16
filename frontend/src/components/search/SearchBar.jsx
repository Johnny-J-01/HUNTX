import { useState } from "react";

export default function SearchBar({ onSearch, disabled }) {
	const [value, setValue] = useState("");

	function submit(e) {
		e.preventDefault();

		if (!value.trim() || disabled) return;

		onSearch(value.trim());
	}

	return (
		<form onSubmit={submit} className="relative w-full">
			<input
				value={value}
				onChange={(e) => setValue(e.target.value)}
				disabled={disabled}
				placeholder="What moment are you looking for?"
				className="cf-input w-full h-10 pl-3 sm:pl-4 pr-11 text-xs sm:text-s placeholder:text-#5E96B8 bg-[#121216] disabled:opacity-50 focus:border-[#F3F3F3]"
			/>

			<button
				type="submit"
				disabled={disabled}
				aria-label="Search"
				className="absolute right-1 top-1 w-8 h-8 rounded-md border border-cf-yellow text-cf-yellow flex items-center justify-center transition disabled:opacity-40"
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					fill="none"
					className="w-4 h-4"
				>
					<circle
						cx="10.8"
						cy="10.8"
						r="6.3"
						// stroke="#94A3A3"
						stroke="currentColor"
						strokeWidth="1.8"
					/>
					<path
						d="m15.5 15.5 4 4"
						// stroke="#94A3A3"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
					/>
				</svg>
			</button>
		</form>
	);
}
