'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveScriptVersion } from '@/server/actions/scripts';
import { SCRIPT_LIMITS, type ScriptFeedback } from '@/lib/scripts/schema';
import { Alert, Button, Card, Col, Flex, Input, Row, Tag, Typography } from 'antd';
import { RowList } from '@/components/ui/RowList';
import { SaveOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import { ScriptFeedbackPanel } from './ScriptFeedbackPanel';

export type ScriptVersionSummary = {
  id: string;
  version: number;
  isActive: boolean;
  updatedAt: Date;
  wordCount: number;
  /** True for an untouched empty draft; saving fills it in rather than adding a version. */
  isEmpty: boolean;
};

type Props = {
  script: { id: string; contentItemId: string; version: number; body: string; isActive: boolean };
  versions: ScriptVersionSummary[];
  initialFeedback: ScriptFeedback | null;
};

/** Plain-textarea script editor. Every save creates a new version; older versions stay readable. */
export function ScriptEditor({ script, versions, initialFeedback }: Props) {
  const router = useRouter();
  const [body, setBody] = useState(script.body);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const bodyRef = useRef(body); // mirrors `body` for the async save path

  const dirty = body !== script.body;
  const latest = versions[0];
  const isLatest = !latest || latest.id === script.id;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  // Mirrors saveScriptVersion: an empty v1 draft is filled in place, otherwise a new version is added.
  const nextVersion = latest && latest.version === 1 && latest.isEmpty ? 1 : (latest?.version ?? 0) + 1;

  function save() {
    if (!dirty || isPending) return;
    setMessage(null);
    startTransition(async () => {
      const result = await saveScriptVersion(script.contentItemId, bodyRef.current);
      if (!result.ok) {
        setMessage({ kind: 'error', text: result.error });
        return;
      }
      const { scriptId, version, unchanged } = result.data;
      if (scriptId !== script.id) {
        // The text now lives in the new version. Reset this (older) version's editor so that
        // coming back to it via history shows its own body rather than stale "unsaved" text.
        bodyRef.current = script.body;
        setBody(script.body);
        setMessage(null);
        router.push(`/scripts/${scriptId}`);
        return;
      }
      setMessage({ kind: 'ok', text: unchanged ? `No changes — already saved as v${version}.` : `Saved as v${version}.` });
    });
  }

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (bodyRef.current !== script.body) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [script.body]);

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={15}>
        <Card
          aria-labelledby="script-editor-heading"
          title={
            <span id="script-editor-heading">
              Version {script.version}
              {script.isActive && (
                <Typography.Text type="secondary" style={{ fontWeight: 400, marginInlineStart: 8 }}>
                  (current)
                </Typography.Text>
              )}
            </span>
          }
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {words} {words === 1 ? 'word' : 'words'} · {body.length.toLocaleString()} chars
            </Typography.Text>
          }
          styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
        >
          {!isLatest && (
            <Alert
              type="warning"
              showIcon
              title={
                <>
                  You are viewing an older version. Saving will create v{nextVersion} from this text.{' '}
                  <Link href={`/scripts/${latest.id}`} style={{ fontWeight: 500, textDecoration: 'underline' }}>
                    Open v{latest.version}
                  </Link>
                </>
              }
            />
          )}

          <label htmlFor="script-body" className="sr-only">
            Script
          </label>
          <Input.TextArea
            id="script-body"
            value={body}
            maxLength={SCRIPT_LIMITS.body}
            onChange={(e) => {
              bodyRef.current = e.target.value;
              setBody(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                save();
              }
            }}
            autoSize={{ minRows: 20 }}
            placeholder={'Write your script here…\n\nHOOK:\n\nBODY:\n\nCTA:'}
            spellCheck
            style={{ fontFamily: 'var(--font-geist-mono, ui-monospace), SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13, lineHeight: 1.65 }}
          />

          <Flex align="center" gap={12} wrap>
            <Button type="primary" icon={<SaveOutlined />} onClick={save} disabled={!dirty || isPending} loading={isPending}>
              {isPending ? 'Saving…' : `Save as v${nextVersion}`}
            </Button>
            <Typography.Text
              role="status"
              aria-live="polite"
              type={message?.kind === 'error' ? 'danger' : message ? 'success' : 'secondary'}
              style={{ fontSize: 12 }}
            >
              {message ? message.text : dirty ? 'Unsaved changes (⌘/Ctrl+S to save)' : ''}
            </Typography.Text>
          </Flex>
        </Card>
      </Col>

      <Col xs={24} xl={9}>
        <Flex vertical gap={24}>
          <ScriptFeedbackPanel scriptId={script.id} body={body} savedBody={script.body} initialFeedback={initialFeedback} />

          <Card
            size="small"
            aria-labelledby="version-history-heading"
            title={<span id="version-history-heading">Version history</span>}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Every save is kept, so you can go back to any previous draft.
            </Typography.Text>
            <RowList
              size="small"
              items={versions}
              rowKey={(v) => v.id}
              renderItem={(v) => {
                const viewing = v.id === script.id;
                return (
                  <div
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: viewing ? 'var(--ant-color-fill-quaternary)' : undefined,
                    }}
                  >
                    <Flex justify="space-between" align="center" style={{ width: '100%' }} gap={8}>
                      <span>
                        {viewing ? (
                          <Typography.Text strong aria-current="true">
                            v{v.version}
                          </Typography.Text>
                        ) : (
                          <Link href={`/scripts/${v.id}`} style={{ fontWeight: 500, textDecoration: 'underline' }}>
                            v{v.version}
                          </Link>
                        )}
                        {v.isActive && (
                          <Tag color="success" style={{ marginInlineStart: 8, marginInlineEnd: 0 }}>
                            latest
                          </Tag>
                        )}
                      </span>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {v.wordCount} words · {formatDate(v.updatedAt)}
                      </Typography.Text>
                    </Flex>
                  </div>
                );
              }}
            />
          </Card>
        </Flex>
      </Col>
    </Row>
  );
}
