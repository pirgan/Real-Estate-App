/**
 * hooks/useSSE.js
 *
 * Custom React hook that wraps the Fetch Streaming API to consume
 * Server-Sent Event (SSE) streams produced by the AI endpoints.
 * Unlike the native EventSource API, this hook supports POST requests
 * and carries the Authorization header automatically.
 */
import { useState, useRef, useCallback } from 'react';

/**
 * Minimal EventSource hook for streaming AI responses.
 *
 * The server sends newline-delimited `data:` chunks.
 * A final `data: [DONE]` message may carry a JSON payload with { sources }.
 *
 * Returns:
 *   stream(url, body)  — opens a fetch-based SSE connection (POST)
 *   text               — accumulated text so far
 *   sources            — citation array from the [DONE] payload
 *   streaming          — true while the connection is open
 *   reset()            — clears state for the next message
 */
export function useSSE() {
  const [text, setText] = useState('');
  const [sources, setSources] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setText('');
    setSources([]);
    setStreaming(false);
  }, []);

  const stream = useCallback(async (url, body = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    reset();
    setStreaming(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();

          if (raw.startsWith('[DONE]')) {
            // Optional JSON payload after [DONE]: [DONE]{"sources":[...]}
            const jsonPart = raw.slice(6).trim();
            if (jsonPart) {
              try {
                const payload = JSON.parse(jsonPart);
                if (payload.sources) setSources(payload.sources);
              } catch {
                // ignore malformed payload
              }
            }
            break;
          }

          setText((prev) => prev + raw);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[useSSE]', err);
    } finally {
      setStreaming(false);
    }
  }, [reset]);

  return { stream, text, sources, streaming, reset };
}
