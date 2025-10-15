"use client";

import { useState, useEffect, type ReactElement } from "react";

export default function Page(): ReactElement {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:8000/search?q=${query}`);
      const data = await response.json();
      setResults(data.results);
    } catch (e) {
      console.error("error:", e);
    }
  };

  return (
    <div>
      <h1>{message}</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="1 or 2"
      />
      <button onClick={handleSearch} />
      {results}
    </div>
  );
}
