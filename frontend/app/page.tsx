"use client";

import React, { useState } from "react";

type TranscriptHit = {
  video_id: string;
  language_code?: string;
  start_time: number;
  end_time: number;
  text: string;
  score?: number;
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
        {results.map((hit, idx) => (
          <li key={`${hit.video_id}-${hit.start_time}-${idx}`} style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #eee" }}>
            <div style={{ fontSize: "0.9rem", color: "#333" }}>
              <strong>{hit.text}</strong>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#555" }}>
              [{hit.video_id}] [{hit.start_time.toFixed(2)} - {hit.end_time.toFixed(2)}]
              {hit.language_code ? ` • ${hit.language_code}` : ""}
              {typeof hit.score === "number" ? ` • score ${hit.score.toFixed(2)}` : ""}
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#777" }}>
        Backend: GET http://localhost:8000/search?q=…&size=…
      </div>
    </div>
  );
}
