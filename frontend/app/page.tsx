"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Footer from "./components/Footer";

type PreviousSegment = {
  start_time: number;
  end_time: number;
  text: string;
  language_code?: string;
};

type TranscriptHit = {
  video_id: string;
  language_code?: string;
  start_time: number;
  end_time: number;
  text: string;
  score?: number;
  previous?: PreviousSegment | null;
};

// YouTube IFrame API types
interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  data: number;
}

interface YouTubeAPI {
  Player: new (
    elementId: string,
    config: {
      events?: {
        onStateChange?: (event: YouTubePlayerEvent) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [size] = useState<number>(1);
  const [language, setLanguage] = useState<string>("all");
  const [results, setResults] = useState<TranscriptHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const playersRef = useRef<Record<string, YouTubePlayer>>({});

  const replayPhrase = (videoId: string, idx: number, startTime: number) => {
    const key = `${videoId}-${idx}`;
    const player = playersRef.current[key];
    if (
      player &&
      typeof player.seekTo === "function" &&
      typeof player.playVideo === "function"
    ) {
      player.seekTo(startTime, true);
      player.playVideo();
    }
  };

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      let url = `${apiUrl}/search?q=${encodeURIComponent(query)}&size=${size}`;

      // Add language parameter if a specific language is selected
      if (language && language !== "all") {
        url += `&language=${encodeURIComponent(language)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Search failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) return; // already loaded
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // Initialize players when results change
  useEffect(() => {
    // Create players when YT API is ready
    const ensurePlayers = () => {
      results.forEach((hit, idx) => {
        const key = `${hit.video_id}-${idx}`;
        const playerId = `yt-player-${key}`;
        if (playersRef.current[key]) return; // already created
        const el = document.getElementById(playerId);
        if (!el || !window.YT || !window.YT.Player) return;
        const YT = window.YT;
        playersRef.current[key] = new YT.Player(playerId, {
          events: {
            onStateChange: (e: YouTubePlayerEvent) => {
              const state = e.data;
              const player = playersRef.current[key];
              if (!player || typeof player.getCurrentTime !== "function")
                return;

              // Check if we need to pause at phrase end
              if (state === YT.PlayerState.PLAYING) {
                const checkTime = () => {
                  const currentTime = player.getCurrentTime();
                  if (
                    typeof currentTime === "number" &&
                    typeof hit.end_time === "number"
                  ) {
                    if (currentTime >= hit.end_time) {
                      player.pauseVideo();
                      return;
                    }
                  }
                  // Continue checking while playing using requestAnimationFrame for precise timing
                  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                    requestAnimationFrame(checkTime);
                  }
                };
                requestAnimationFrame(checkTime);
              }
            },
          },
        });
      });
    };

    if (results.length > 0) {
      if (window.YT && window.YT.Player) {
        ensurePlayers();
      } else {
        // Wait for API to load
        window.onYouTubeIframeAPIReady = ensurePlayers;
      }
    }

    // Cleanup players when results change
    return () => {
      Object.keys(playersRef.current).forEach((key) => {
        const player = playersRef.current[key];
        if (player && typeof player.destroy === "function") {
          player.destroy();
        }
      });
      playersRef.current = {};
    };
  }, [results]);

  return (
    <div
      className="min-h-screen pt-4"
      style={{
        background:
          "linear-gradient(to bottom, rgba(164, 255, 209) 0%, white 120px)",
      }}
    >
      {/* Navigation Header */}
      <nav className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-medium text-gray-800">
                Say Like a Native
              </h1>
            </div>
            <div className="flex space-x-8">
              <Link
                href="/"
                className="text-blue-700 font-semibold px-3 py-2 rounded-md text-sm transition-colors duration-200"
              >
                Search
              </Link>
              <Link
                href="/learn"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Learn
              </Link>
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2
            className="text-7xl font-medium text-gray-800 mb-6 py-8"
            style={{
              fontFamily:
                "Euclid Circular A,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif",
            }}
          >
            Search For Phrases
          </h2>
          <p className="text-lg text-gray-600">
            Find natural pronunciation examples from real conversations
          </p>
        </div>
        <form
          onSubmit={runSearch}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="search-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search phrase
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Type a phrase (e.g., hello)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHasSearched(false);
                }}
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="sm:w-32">
              <label
                htmlFor="language-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Language
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
              >
                <option value="all">All</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div className="sm:w-auto flex items-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Searching...
                  </div>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Search Error
                </h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* No results found section */}
        {/* Invisible container that wraps all content states and sizes based on search results */}
        <div className="mb-16 relative">
          {/* Invisible spacer that creates the container size based on search results */}
          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((hit, idx) => {
                const earliestStart =
                  typeof hit.previous?.start_time === "number"
                    ? hit.previous.start_time
                    : hit.start_time;
                const startSec =
                  typeof earliestStart === "number"
                    ? Math.max(0, Math.floor(earliestStart))
                    : 0;
                const endSec =
                  typeof hit.end_time === "number"
                    ? Math.max(startSec + 1, Math.ceil(hit.end_time))
                    : startSec + 1;
                const ccLang = hit.language_code
                  ? `&cc_lang_pref=${encodeURIComponent(hit.language_code)}`
                  : "";
                const origin =
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000";
                const key = `${hit.video_id}-${idx}`;
                const playerId = `yt-player-${key}`;
                const embedUrl = `https://www.youtube-nocookie.com/embed/${
                  hit.video_id
                }?start=${startSec}&end=${endSec}&cc_load_policy=1${ccLang}&enablejsapi=1&origin=${encodeURIComponent(
                  origin
                )}&modestbranding=1&rel=0&controls=2&disablekb=1&playsinline=1&widget_referrer=${encodeURIComponent(
                  origin
                )}`;

                // Create combined phrase (previous + current)
                const combinedPhrase = hit.previous
                  ? `${hit.previous.text} ${hit.text}`
                  : hit.text;

                return (
                  <div
                    key={`${hit.video_id}-${hit.start_time}-${idx}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-12"
                  >
                    {/* Embedded Video */}
                    <div className="relative rounded-lg overflow-hidden shadow-md mb-4">
                      <div className="relative pb-[56.25%] h-0">
                        <iframe
                          id={playerId}
                          src={embedUrl}
                          title={`YouTube video ${hit.video_id}`}
                          className="absolute top-0 left-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>

                    {/* Language and Replay Button Row */}
                    <div className="mb-4 flex justify-between items-center">
                      {/* Language on the left */}
                      {hit.language_code && (
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md inline-block text-sm font-medium">
                          Language: {hit.language_code}
                        </div>
                      )}

                      {/* Replay Button on the right */}
                      <button
                        onClick={() =>
                          replayPhrase(hit.video_id, idx, startSec)
                        }
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        title="Replay this phrase from the beginning"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Replay
                      </button>
                    </div>

                    {/* Combined Phrase */}
                    <div className="text-lg font-semibold text-gray-800">
                      &quot;{combinedPhrase}&quot;
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Invisible spacer that matches actual search result size */
            <div className="invisible space-y-6">
              <div className="bg-white rounded-xl shadow-md p-12">
                {/* Mock video container with same aspect ratio */}
                <div className="relative rounded-lg overflow-hidden shadow-md mb-4">
                  <div className="relative pb-[56.25%] h-0"></div>
                </div>
                {/* Mock language and replay button row */}
                <div className="mb-4 flex justify-between items-center">
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md inline-block text-sm font-medium">
                    Mock Language
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md">
                    Mock Button
                  </div>
                </div>
                {/* Mock phrase text */}
                <div className="text-lg font-semibold text-gray-800">
                  &quot;Mock phrase text&quot;
                </div>
              </div>
            </div>
          )}

          {/* No results found section - absolutely positioned */}
          {!loading &&
            results.length === 0 &&
            query &&
            !error &&
            hasSearched && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-md p-12 text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-yellow-400 mb-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 00-8-8 8 8 0 00-8 8c0 2.027.761 3.877 2.009 5.291z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    No results found
                  </h3>
                  <p className="text-yellow-700">
                    Try searching for a different phrase or check your spelling.
                  </p>
                </div>
              </div>
            )}

          {/* Placeholder section - absolutely positioned */}
          {!loading && !hasSearched && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Search Results Will Appear Here
                  </h3>
                  <p className="text-gray-600">
                    Enter a phrase above and click &quot;Search&quot; to find
                    pronunciation examples from real conversations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
