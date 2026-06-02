'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import type { Suggestion, SuggestionStatus } from '../api/suggestions/route';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // dev key

const STATUS_META: Record<SuggestionStatus, { color: string; bg: string; label: string }> = {
  'Navrženo':  { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)',  label: '💡 Suggested'   },
  'Zvažujeme': { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)',  label: '🤔 Considering' },
  'Plánováno': { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',  label: '📋 Planned'     },
  'V vývoji':  { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  label: '⚙️ In progress' },
  'Hotovo':    { color: '#4ade80', bg: 'rgba(34,197,94,0.15)',   label: '✅ Done'        },
  'Zamítnuto': { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   label: '❌ Rejected'    },
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
      setSubmitMsg('Please confirm you are not a robot.');
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
      setSubmitMsg('Thank you! Your suggestion has been submitted for review.');
      setFormOpen(false);
    } catch (err: unknown) {
      setSubmitStatus('error');
      setSubmitMsg(err instanceof Error ? err.message : 'Unknown error');
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

  const card: React.CSSProperties = {
    background: 'rgba(15,20,40,0.92)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 'var(--card-radius)',
    padding: '1.25rem',
    boxShadow: 'var(--card-shadow)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

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
          <Sidebar />
          <main className="main-content" style={{
            flex: 1,
            background: 'var(--bg1)',
            padding: '1.25rem',
            minWidth: 0,
          }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>

              {/* Header */}
              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontFamily: 'Poppins', color: '#fff', marginBottom: '4px' }}>
                      💡 Suggest & Vote
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>
                      Suggest a new feature or vote for existing ones.
                    </p>
                  </div>
                  <button
                    onClick={() => setFormOpen(v => !v)}
                    style={{
                      background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {formOpen ? '✕ Close' : '+ New suggestion'}
                  </button>
                </div>
              </div>

              {/* Submit form */}
              {formOpen && (
                <div style={{ ...card, marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
                  <h2 style={{ fontSize: '15px', color: '#fff', marginBottom: '1rem', fontFamily: 'Poppins' }}>
                    New suggestion
                  </h2>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '5px' }}>
                        Feature title *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Dark mode for the mobile app"
                        maxLength={120}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '5px' }}>
                        Description *
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe in more detail what the feature should do and why it would be useful..."
                        maxLength={600}
                        required
                        rows={4}
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'right', marginTop: '4px' }}>
                        {description.length}/600
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text3)', display: 'block', marginBottom: '5px' }}>
                        Email (optional — for a reply)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        style={inputStyle}
                      />
                    </div>

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
                      <div style={{ fontSize: '13px', color: '#f87171', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                        {submitMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !title.trim() || !description.trim()}
                      style={{
                        background: submitting ? 'rgba(93,76,255,0.4)' : 'linear-gradient(135deg, var(--purple), #7A3FFF)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '12px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit suggestion'}
                    </button>
                  </form>
                </div>
              )}

              {/* Success toast */}
              {submitStatus === 'success' && (
                <div style={{
                  ...card,
                  marginBottom: '1.25rem',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  color: '#4ade80',
                  fontSize: '14px',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  ✅ {submitMsg}
                </div>
              )}

              {/* Suggestions list */}
              <div style={{ ...card }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '15px', color: '#fff', fontFamily: 'Poppins' }}>
                    Community suggestions
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
                  </span>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem', fontSize: '13px' }}>
                    Loading suggestions...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2.5rem', fontSize: '13px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>💡</div>
                    No suggestions yet. Be the first!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {suggestions.map(s => {
                      const meta = STATUS_META[s.status];
                      const alreadyVoted = hasVotedRecently(s.id) || voted.has(s.id);
                      return (
                        <div
                          key={s.id}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '14px',
                            padding: '1rem',
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'flex-start',
                          }}
                        >
                          {/* Vote button */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '44px' }}>
                            <button
                              onClick={() => handleVote(s.id)}
                              disabled={alreadyVoted || voting === s.id}
                              title={alreadyVoted ? 'Hlasoval jsi (24h limit)' : 'Hlasovat'}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: alreadyVoted
                                  ? 'rgba(93,76,255,0.2)'
                                  : 'rgba(255,255,255,0.05)',
                                border: alreadyVoted
                                  ? '1px solid rgba(93,76,255,0.4)'
                                  : '1px solid rgba(255,255,255,0.1)',
                                color: alreadyVoted ? 'var(--purple3)' : 'var(--text2)',
                                fontSize: '18px',
                                cursor: alreadyVoted ? 'default' : 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0',
                                transition: 'background 0.15s, border-color 0.15s',
                              }}
                            >
                              ▲
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                              {s.votes}
                            </span>
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', lineHeight: 1.4 }}>
                                {s.title}
                              </div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                color: meta.color,
                                background: meta.bg,
                                borderRadius: '20px',
                                padding: '3px 10px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}>
                                {meta.label}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '6px', lineHeight: 1.5 }}>
                              {s.description}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
                              {new Date(s.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
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
