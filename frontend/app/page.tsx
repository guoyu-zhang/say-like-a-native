"use client";

import React, { useState } from "react";

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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [size, setSize] = useState<number>(25);
  const [results, setResults] = useState<TranscriptHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const url = `http://localhost:8000/search?q=${encodeURIComponent(query)}&size=${size}`;
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

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Search Transcripts</h1>
      <form onSubmit={runSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
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
        <button type="submit" style={{ padding: "0.75rem 1.5rem", fontSize: "1.1rem", lineHeight: "1.5", borderRadius: "8px" }} disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div style={{ color: "#b00020", marginBottom: "1rem" }}>Error: {error}</div>
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
          const startSec = typeof earliestStart === "number" ? Math.max(0, Math.floor(earliestStart)) : 0;
          const embedUrl = `https://www.youtube.com/embed/${hit.video_id}?start=${startSec}`;
          const watchUrl = `https://www.youtube.com/watch?v=${hit.video_id}&t=${startSec}s`;
          return (
            <li key={`${hit.video_id}-${hit.start_time}-${idx}`} style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #eee" }}>
              <div style={{ fontSize: "0.9rem", color: "#333" }}>
                <strong>{hit.text}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                [{hit.video_id}] [{typeof hit.start_time === "number" ? hit.start_time.toFixed(2) : ""} - {typeof hit.end_time === "number" ? hit.end_time.toFixed(2) : ""}]
                {hit.language_code ? ` • ${hit.language_code}` : ""}
                {typeof hit.score === "number" ? ` • score ${hit.score.toFixed(2)}` : ""}
              </div>

              {hit.previous && (
                <div style={{ marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#444" }}>
                    <em>Previous</em>: {hit.previous.text}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    [{typeof hit.previous.start_time === "number" ? hit.previous.start_time.toFixed(2) : ""} - {typeof hit.previous.end_time === "number" ? hit.previous.end_time.toFixed(2) : ""}]
                    {hit.previous.language_code ? ` • ${hit.previous.language_code}` : ""}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ marginBottom: "0.25rem", fontSize: "0.85rem", color: "#333" }}>
                  Earliest start: {startSec}s
                  {" "}
                  <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "0.5rem" }}>
                    Open in YouTube
                  </a>
                </div>
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 8 }}>
                  <iframe
                    src={embedUrl}
                    title={`YouTube video ${hit.video_id}`}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
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
        Backend: GET http://localhost:8000/search?q=…&size=…
      </div>
    </div>
  );
}
