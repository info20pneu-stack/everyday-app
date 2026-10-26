'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import type { Suggestion, SuggestionStatus } from '../api/suggestions/route';
import { useLang } from '../../lib/LanguageContext';
import { fmtNumber } from '../../lib/formatNumber';
import { toolStrings, type ToolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolField, ToolHero } from '../components/tools/ToolFrame';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // dev key

/* Status values are stored in Czech in the database; `label` is the toolsI18n key shown to the reader. */
const STATUS_META: Record<SuggestionStatus, { color: string; bg: string; label: keyof ToolStrings }> = {
  'Navrženo':  { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)',  label: 'sgSuggested'   },
  'Zvažujeme': { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  label: 'sgConsidering' },
  'Plánováno': { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',  label: 'sgPlanned'     },
  'V vývoji':  { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  label: 'sgInProgress'  },
  'Hotovo':    { color: '#4ade80', bg: 'rgba(34,197,94,0.15)',   label: 'sgDone'        },
  'Zamítnuto': { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   label: 'sgRejected'    },
};

const LS_VOTED_KEY = 'everyday-voted';
const LS_VOTED_TS_KEY = 'everyday-voted-ts';
const VOTE_WINDOW = 24 * 60 * 60 * 1000;

function getVotedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_VOTED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markVoted(id: string) {
  try {
    const voted = getVotedSet();
    voted.add(id);
    const ts = JSON.parse(localStorage.getItem(LS_VOTED_TS_KEY) || '{}') as Record<string, number>;
    ts[id] = Date.now();
    localStorage.setItem(LS_VOTED_KEY, JSON.stringify([...voted]));
    localStorage.setItem(LS_VOTED_TS_KEY, JSON.stringify(ts));
  } catch { /* noop */ }
}

function hasVotedRecently(id: string): boolean {
  try {
    const ts = JSON.parse(localStorage.getItem(LS_VOTED_TS_KEY) || '{}') as Record<string, number>;
    return !!ts[id] && Date.now() - ts[id] < VOTE_WINDOW;
  } catch {
    return false;
  }
}

export default function SuggestClient() {
  const { lang } = useLang();
  const st = toolStrings(lang);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMsg, setSubmitMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const widgetId = useRef<string | null>(null);

  // Vote state
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await fetch('/api/suggestions');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as Suggestion[];
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuggestions();
    setVoted(getVotedSet());
  }, [loadSuggestions]);

  // Reset Turnstile when form opens
  useEffect(() => {
    if (formOpen) {
      setTurnstileToken('');
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    }
  }, [formOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setSubmitMsg(st.sgRobot);
      setSubmitStatus('error');
      return;
    }
    setSubmitting(true);
    setSubmitStatus('idle');
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, email: email || undefined, turnstileToken }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || 'Submission error');
      }
      const newSuggestion = await res.json() as Suggestion;
      setSuggestions(prev => [newSuggestion, ...prev]);
      setTitle(''); setDescription(''); setEmail('');
      setTurnstileToken('');
      setSubmitStatus('success');
      setSubmitMsg(st.sgThanks);
      setFormOpen(false);
    } catch (err: unknown) {
      setSubmitStatus('error');
      setSubmitMsg(err instanceof Error && err.message ? `${st.sgError} (${err.message})` : st.sgError);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(id: string) {
    if (hasVotedRecently(id) || voting === id) return;
    setVoting(id);
    try {
      const res = await fetch(`/api/suggestions/${id}/vote`, { method: 'POST' });
      if (res.status === 429) {
        markVoted(id);
        setVoted(getVotedSet());
        return;
      }
      if (!res.ok) throw new Error();
      const { votes } = await res.json() as { votes: number };
      setSuggestions(prev =>
        prev.map(s => s.id === id ? { ...s, votes } : s).sort((a, b) => b.votes - a.votes)
      );
      markVoted(id);
      setVoted(getVotedSet());
    } catch { /* silent */ } finally {
      setVoting(null);
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (formOpen) {
            widgetId.current = window.turnstile?.render('#turnstile-container', {
              sitekey: SITE_KEY,
              callback: (token: string) => setTurnstileToken(token),
              theme: 'dark',
            }) ?? null;
          }
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <main className="main-content" style={{
            flex: 1,
            background: 'var(--bg1)',
            padding: '1.25rem',
            minWidth: 0,
          }}>
            <ToolFrame toolId="navrhy">
              <ToolHero
                label={st.sgCommunity}
                value={loading ? '—' : fmtNumber(suggestions.length, lang)}
                sub={loading ? undefined : <>▲ {fmtNumber(suggestions.reduce((n, x) => n + x.votes, 0), lang)} {st.sgVotes}</>}
              />

              <ToolButton onClick={() => setFormOpen(v => !v)}>{formOpen ? st.sgClose : st.sgNew}</ToolButton>

              {formOpen && (
                <form className="tf-panel" onSubmit={handleSubmit}>
                  <ToolField label={st.sgFeature} htmlFor="sg-title">
                    <input id="sg-title" type="text" className="tf-input" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder={st.sgFeaturePh} maxLength={120} required />
                  </ToolField>
                  <ToolField label={st.sgDesc} htmlFor="sg-desc"
                    hint={<span style={{ color: 'var(--tf-dim)' }} dir="ltr">{fmtNumber(description.length, lang)}/{fmtNumber(600, lang)}</span>}>
                    <textarea id="sg-desc" className="tf-input" value={description} onChange={e => setDescription(e.target.value)}
                      placeholder={st.sgDescPh} maxLength={600} required rows={4} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                  </ToolField>
                  <ToolField label={st.sgEmail} htmlFor="sg-email">
                    <input id="sg-email" type="email" className="tf-input" value={email} onChange={e => setEmail(e.target.value)} placeholder={st.sgEmailPh} />
                  </ToolField>

                  {/* Turnstile */}
                  <div
                    id="turnstile-container"
                    ref={el => {
                      if (el && formOpen && !turnstileToken) {
                        setTimeout(() => {
                          if (window.turnstile && !widgetId.current) {
                            widgetId.current = window.turnstile.render('#turnstile-container', {
                              sitekey: SITE_KEY,
                              callback: (token: string) => setTurnstileToken(token),
                              theme: 'dark',
                            }) ?? null;
                          }
                        }, 100);
                      }
                    }}
                  />

                  {submitStatus === 'error' && (
                    <div style={{ fontSize: '13px', color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
                      {submitMsg}
                    </div>
                  )}

                  <ToolButton type="submit" disabled={submitting || !title.trim() || !description.trim()}>
                    {submitting ? st.sgSubmitting : st.sgSubmit}
                  </ToolButton>
                </form>
              )}

              {submitStatus === 'success' && (
                <div className="tf-panel" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80', fontSize: 14 }}>✅ {submitMsg}</div>
              )}

              <div className="tf-panel">
                <div className="tf-label">💬 {st.sgCommunity}</div>
                {loading ? (
                  <div className="tf-note" style={{ padding: '2rem' }}>{st.sgLoading}</div>
                ) : suggestions.length === 0 ? (
                  <div className="tf-note" style={{ padding: '2.5rem' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💡</div>
                    {st.sgEmpty}
                  </div>
                ) : (
                  suggestions.map(sg => {
                    const meta = STATUS_META[sg.status];
                    const alreadyVoted = hasVotedRecently(sg.id) || voted.has(sg.id);
                    return (
                      <div key={sg.id} className="sg-item">
                        <div className="sg-vote">
                          <button type="button" onClick={() => handleVote(sg.id)} disabled={alreadyVoted || voting === sg.id}
                            title={alreadyVoted ? st.sgVoted : st.sgVote} aria-label={alreadyVoted ? st.sgVoted : st.sgVote}
                            className={`tf-chip${alreadyVoted ? ' is-on' : ''}`}>▲</button>
                          <b>{fmtNumber(sg.votes, lang)}</b>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="sg-head">
                            <div className="sg-title">{sg.title}</div>
                            <span className="sg-status" style={{ color: meta.color, background: meta.bg }}>{st[meta.label]}</span>
                          </div>
                          <div className="sg-desc">{sg.description}</div>
                          <div className="sg-date">{new Date(sg.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <style>{`
                .sg-item { display: flex; gap: 14px; align-items: flex-start; padding: 12px; border-radius: 14px; background: rgba(10,14,42,.55); border: 1px solid rgba(255,255,255,.06); }
                .sg-vote { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
                .sg-vote .tf-chip { width: 44px; height: 44px; padding: 0; font-size: 16px; }
                .sg-vote b { font-size: 13px; }
                .sg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
                .sg-title { font-size: 14px; font-weight: 700; line-height: 1.4; }
                .sg-status { font-size: 12px; font-weight: 600; border-radius: 20px; padding: 3px 10px; white-space: nowrap; }
                .sg-desc { font-size: 13px; color: var(--tf-dim); margin-top: 6px; line-height: 1.5; }
                .sg-date { font-size: 12px; color: var(--tf-dim); margin-top: 8px; }
              `}</style>
            </ToolFrame>
          </main>
        </div>
        <BottomNav />
      </div>
    </>
  );
}

// Extend window for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        theme?: string;
      }) => string | null;
      reset: (id: string) => void;
    };
  }
}
