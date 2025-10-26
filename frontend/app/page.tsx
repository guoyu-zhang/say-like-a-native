"use client";

import React, { useState, useEffect, useRef } from "react";

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

// YouTube IFrame API global (avoid TS errors)
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<number>(25);
  const [results, setResults] = useState<TranscriptHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playersRef = useRef<Record<string, any>>({});

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
    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const url = `${apiUrl}/search?q=${encodeURIComponent(
        query
      )}&size=${size}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Search failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err: any) {
      setError(err?.message ?? String(err));
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
        if (!el || !(window as any).YT || !(window as any).YT.Player) return;
        const YT = (window as any).YT;
        playersRef.current[key] = new YT.Player(playerId, {
          events: {
            onStateChange: (e: any) => {
              const state = e?.data;
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
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Search Transcripts</h1>
      <form
        onSubmit={runSearch}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          type="text"
          placeholder="Type a phrase (e.g., hello)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <input
          type="number"
          min={1}
          max={1000}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          title="Results per page"
          style={{ width: 100, padding: "0.5rem" }}
        />
        <button
          type="submit"
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1.1rem",
            lineHeight: "1.5",
            borderRadius: "8px",
          }}
          disabled={loading || !query.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#b00020", marginBottom: "1rem" }}>
          Error: {error}
        </div>
      )}

      {!loading && results.length === 0 && query && !error && (
        <div style={{ color: "#666" }}>No results found.</div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
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
          const watchUrl = `https://www.youtube.com/watch?v=${hit.video_id}&t=${startSec}s`;

          return (
            <li
              key={`${hit.video_id}-${hit.start_time}-${idx}`}
              style={{
                marginBottom: "1.25rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#333" }}>
                <strong>{hit.text}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                [{hit.video_id}] [
                {typeof hit.start_time === "number"
                  ? hit.start_time.toFixed(2)
                  : ""}{" "}
                -{" "}
                {typeof hit.end_time === "number"
                  ? hit.end_time.toFixed(2)
                  : ""}
                ]{hit.language_code ? ` • ${hit.language_code}` : ""}
                {typeof hit.score === "number"
                  ? ` • score ${hit.score.toFixed(2)}`
                  : ""}
              </div>

              {hit.previous && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#444" }}>
                    <em>Previous</em>: {hit.previous.text}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    [
                    {typeof hit.previous.start_time === "number"
                      ? hit.previous.start_time.toFixed(2)
                      : ""}{" "}
                    -{" "}
                    {typeof hit.previous.end_time === "number"
                      ? hit.previous.end_time.toFixed(2)
                      : ""}
                    ]
                    {hit.previous.language_code
                      ? ` • ${hit.previous.language_code}`
                      : ""}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "0.75rem" }}>
                <div
                  style={{
                    marginBottom: "0.25rem",
                    fontSize: "0.85rem",
                    color: "#333",
                  }}
                >
                  Earliest start: {startSec}s • Phrase ends: {endSec}s{" "}
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Open in YouTube
                  </a>{" "}
                  <button
                    onClick={() => replayPhrase(hit.video_id, idx, startSec)}
                    style={{
                      marginLeft: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.8rem",
                      backgroundColor: "#1976d2",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    title="Replay this phrase from the beginning"
                  >
                    Replay
                  </button>
                </div>
                <div
                  style={{
                    position: "relative",
                    paddingBottom: "56.25%",
                    height: 0,
                    overflow: "hidden",
                    borderRadius: 8,
                  }}
                >
                  <iframe
                    id={playerId}
                    src={embedUrl}
                    title={`YouTube video ${hit.video_id}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: 0,
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#777" }}>
        Backend: GET{" "}
        {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
        /search?q=…&size=…
      </div>
    </div>
  );
}
