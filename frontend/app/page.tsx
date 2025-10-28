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

type AutocompleteSuggestion = {
  text: string;
  video_id: string;
  start_time?: number;
  end_time?: number;
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
  const [results, setResults] = useState<TranscriptHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number | undefined): string => {
    if (typeof seconds !== 'number') return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const playersRef = useRef<Record<string, YouTubePlayer>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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



  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = `${apiUrl}/autocomplete?q=${encodeURIComponent(searchQuery)}&size=5`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300); // 300ms debounce
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          handleSuggestionClick(selectedSuggestion);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = async (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]); // Clear suggestions to prevent dropdown from reappearing
    setSelectedSuggestionIndex(-1);
    setLoading(true);
    setError("");
    setResults([]); // Clear previous results immediately to show loading state
    
    try {
      // Use the fast video-specific search endpoint with single_result=true for autocomplete
      const response = await fetch(
        `http://localhost:8000/video-search?video_id=${encodeURIComponent(suggestion.video_id)}&q=${encodeURIComponent(suggestion.text)}&single_result=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Results are already filtered to the specific video
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
    } finally {
      setLoading(false);
    }
    
    // Focus back to input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
            Find Phrase Examples
          </h2>
          <p className="text-lg text-gray-600">
            Type to see suggestions, then select one to find natural pronunciation examples
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <label
                htmlFor="search-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type to see suggestions
              </label>
              <input
                ref={searchInputRef}
                id="search-input"
                type="text"
                placeholder="Type a phrase to see suggestions (e.g., hello)"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0 && query.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {isLoadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
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
                      Loading suggestions...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.video_id}-${index}`}
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                          index === selectedSuggestionIndex
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <div className="font-medium">{suggestion.text}</div>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>From video: {suggestion.video_id}</div>
                          {suggestion.start_time !== undefined && suggestion.end_time !== undefined && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span>{formatTime(suggestion.start_time)} - {formatTime(suggestion.end_time)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No suggestions found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

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
              {(() => {
                // Only display the first result
                const hit = results[0];
                const idx = 0;
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
              })()}
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



          {/* Loading placeholder - absolutely positioned */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="max-w-md mx-auto">
                  {/* Loading animation */}
                  <div className="mx-auto h-16 w-16 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Loading Video...
                  </h3>
                  <p className="text-gray-600">
                    Finding the perfect pronunciation example for your phrase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder section - absolutely positioned */}
          {!loading && results.length === 0 && (
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
                    Type a phrase above to see suggestions and select one to find
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
