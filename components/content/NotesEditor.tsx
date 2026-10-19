'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { updateContentItem } from '@/server/actions/content';
import { Flex, Input, Typography } from 'antd';
import { CONTENT_LIMITS } from '@/lib/content/pipeline';

const AUTOSAVE_DELAY_MS = 800;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/** Plain-text notes that save themselves shortly after you stop typing (and on blur). */
export function NotesEditor({ itemId, initialNotes }: { itemId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const lastSaved = useRef(initialNotes ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const latest = useRef(notes); // mirrors `notes` for the async save path

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    // Serialise saves so a slow request can't be overtaken by a newer one and then clobber it.
    if (inFlight.current) await inFlight.current;

    const value = latest.current;
    if (value === lastSaved.current) {
      setState((s) => (s === 'dirty' ? 'saved' : s));
      return;
    }

    setState('saving');
    setError(null);
    inFlight.current = (async () => {
      const result = await updateContentItem(itemId, { notes: value });
      if (result.ok) {
        lastSaved.current = value;
        setState(latest.current === value ? 'saved' : 'dirty');
      } else {
        setError(result.error);
        setState('error');
      }
    })();
    await inFlight.current;
    inFlight.current = null;
  }, [itemId]);

  function onChange(value: string) {
    latest.current = value;
    setNotes(value);
    setState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (latest.current !== lastSaved.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const statusText = {
    idle: '',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    saved: 'Saved',
    error: error ?? 'Could not save',
  }[state];

  const statusType = state === 'error' ? 'danger' : state === 'saved' ? 'success' : 'secondary';

  return (
    <Flex vertical gap={8}>
      <Flex justify="space-between" align="center">
        <label htmlFor="content-notes">
          <Typography.Text strong>Notes</Typography.Text>
        </label>
        <Typography.Text role="status" aria-live="polite" type={statusType} style={{ fontSize: 12 }}>
          {statusText}
        </Typography.Text>
      </Flex>
      <Input.TextArea
        id="content-notes"
        autoSize={{ minRows: 8 }}
        value={notes}
        maxLength={CONTENT_LIMITS.notes}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => void save()}
        placeholder="Angles, references, talking points, links… Notes save automatically."
        aria-describedby="content-notes-hint"
        style={{ lineHeight: 1.6 }}
      />
      <Typography.Text id="content-notes-hint" type="secondary" style={{ fontSize: 12 }}>
        Auto-saves as you type.
      </Typography.Text>
    </Flex>
  );
}
