/**
 * Custom Server-Sent Events (SSE) client using native fetch.
 * This allows passing standard headers (like Authorization Bearer) which
 * browser native EventSource does not support.
 */
export function streamSSE(
  url: string,
  token: string,
  onEvent: (event: string, data: string) => void,
  onError: (error: any) => void
) {
  let active = true;
  const abortController = new AbortController();

  const connect = async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream'
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE stream failed with status ${response.status}`);
      }

      onEvent('connected', '');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (active) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = 'message';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim();
            onEvent(currentEvent, dataStr);
            currentEvent = 'message'; // reset
          }
        }
      }
    } catch (err: any) {
      if (active && err.name !== 'AbortError') {
        onError(err);
      }
    }
  };

  connect();

  return {
    close: () => {
      active = false;
      abortController.abort();
    }
  };
}
