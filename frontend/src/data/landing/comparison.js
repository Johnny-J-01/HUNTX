export const COMPARISON_DATA = {
  oldWay: {
    category: "MANUAL WORKFLOW",
    title: "The Old Way",
    items: [
      {
        title: "Blind timeline scrubbing",
        desc: "Dragging playheads back and forth across long recordings hoping to spot the exact reaction or topic shift.",
      },
      {
        title: "Exact-word transcript trap",
        desc: "Basic keyword search misses the moment completely when you remember the vibe or joke, not the verbatim phrasing.",
      },
      {
        title: "App-hopping just to reformat",
        desc: "Downloading files, trimming in one editor, cropping 9:16 in another, then re-rendering captions before you can post.",
      },
    ],
    footerLabel: "AVG. TIME PER CLIP",
    footerVal: "25 – 45 MINUTES",
    footerValColor: "var(--danger-text)",
  },
  newWay: {
    category: "MOMENT HUNTING",
    title: "With VidHntr",
    items: [
      {
        title: "Search by meaning or mood",
        desc: "Describe the moment naturally, filter by six emotional tones, or let AI Suggestions surface top hooks immediately.",
      },
      {
        title: "Sub-second trim & context padding",
        desc: "Land straight on the match, nudge boundaries by ±0.1s, and pad Before/After buffers without losing context.",
      },
      {
        title: "Instant social-ready export",
        desc: "Switch to TikTok, Reels, or Shorts presets, enable captions, pick your bitrate quality, and download the finished MP4.",
      },
    ],
    footerLabel: "AVG. TIME PER CLIP",
    footerVal: "UNDER 1 MINUTE",
    footerValColor: "var(--gold)",
  },
};
