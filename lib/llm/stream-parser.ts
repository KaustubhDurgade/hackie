import { CanvasUpdateSchema, type CanvasUpdate } from '@/lib/canvas/schema';

export type ParsedChunk =
  | { type: 'text'; content: string }
  | { type: 'canvas_update'; update: CanvasUpdate; phaseTag: string }
  | { type: 'parse_error'; raw: string; error: string };

const OPEN_TAG_RE  = /<canvas_update\s+type="([^"]+)">/;
const OPEN_TAG_STR = '<canvas_update';
const CLOSE_TAG    = '</canvas_update>';

/** Returns the length of the longest suffix of `text` that is a prefix of `pattern`. */
function longestSuffixPrefix(text: string, pattern: string): number {
  const maxLen = Math.min(text.length, pattern.length - 1);
  for (let len = maxLen; len > 0; len--) {
    if (text.endsWith(pattern.slice(0, len))) return len;
  }
  return 0;
}

export class StreamParser {
  private buffer   = '';
  private inTag    = false;
  private tagType  = '';
  private tagBuffer = '';

  process(chunk: string): ParsedChunk[] {
    const results: ParsedChunk[] = [];
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      if (!this.inTag) {
        const openIdx = this.buffer.indexOf(OPEN_TAG_STR);
        if (openIdx === -1) {
          // Hold any trailing partial match so we don't emit a `<` that
          // begins `<canvas_update` before the rest of the tag has arrived.
          const holdLen = longestSuffixPrefix(this.buffer, OPEN_TAG_STR);
          if (holdLen > 0) {
            if (this.buffer.length > holdLen) {
              results.push({ type: 'text', content: this.buffer.slice(0, -holdLen) });
            }
            this.buffer = this.buffer.slice(-holdLen);
          } else {
            results.push({ type: 'text', content: this.buffer });
            this.buffer = '';
          }
          break;
        }
        // Flush text before the opening tag
        if (openIdx > 0) {
          results.push({ type: 'text', content: this.buffer.slice(0, openIdx) });
          this.buffer = this.buffer.slice(openIdx);
        }
        // Wait for the full opening tag (up to '>') to arrive
        const closeAngle = this.buffer.indexOf('>');
        if (closeAngle === -1) break;

        const tagMatch = OPEN_TAG_RE.exec(this.buffer.slice(0, closeAngle + 1));
        if (!tagMatch) {
          // Malformed opening tag — emit as text and move on
          results.push({ type: 'text', content: this.buffer.slice(0, closeAngle + 1) });
          this.buffer = this.buffer.slice(closeAngle + 1);
          continue;
        }

        this.inTag     = true;
        this.tagType   = tagMatch[1];
        this.tagBuffer = '';
        this.buffer    = this.buffer.slice(closeAngle + 1);
      } else {
        // Inside a canvas_update block — search the combined accumulated content
        // so that a close tag split across chunks is still found correctly.
        const combined  = this.tagBuffer + this.buffer;
        const closeIdx  = combined.indexOf(CLOSE_TAG);

        if (closeIdx === -1) {
          this.tagBuffer = combined;
          this.buffer    = '';
          break;
        }

        const jsonContent = combined.slice(0, closeIdx);
        this.buffer       = combined.slice(closeIdx + CLOSE_TAG.length);
        this.tagBuffer    = '';
        this.inTag        = false;

        // Validate and emit
        try {
          const parsed    = JSON.parse(jsonContent.trim());
          const validated = CanvasUpdateSchema.parse(parsed);
          results.push({ type: 'canvas_update', update: validated, phaseTag: this.tagType });
        } catch (err) {
          results.push({
            type:  'parse_error',
            raw:   jsonContent,
            error: err instanceof Error ? err.message : String(err),
          });
        }

        this.tagType = '';
      }
    }

    return results;
  }

  /** Call at end of stream to flush any remaining buffered text. */
  flush(): ParsedChunk[] {
    const results: ParsedChunk[] = [];
    if (this.inTag) {
      const combined = this.tagBuffer + this.buffer;
      if (combined) {
        results.push({ type: 'parse_error', raw: combined, error: 'Stream ended inside canvas_update tag' });
      }
    } else if (this.buffer) {
      // If buffer is just a held partial open-tag prefix, emit it as text
      results.push({ type: 'text', content: this.buffer });
    }
    this.buffer    = '';
    this.tagBuffer = '';
    this.inTag     = false;
    return results;
  }

  reset() {
    this.buffer    = '';
    this.tagBuffer = '';
    this.inTag     = false;
    this.tagType   = '';
  }
}
