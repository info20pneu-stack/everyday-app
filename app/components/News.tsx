'use client';

import { useState, useEffect, useCallback } from 'react';

/* ─── Feed definitions ─── */
type Source = { id: string; name: string; flag: string; url: string; lang: string };

const SOURCES: Source[] = [
  { id: 'bbc',        name: 'BBC News',   flag: '🇬🇧', lang: 'en', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'cnn',        name: 'CNN',        flag: '🇺🇸', lang: 'en', url: 'https://rss.cnn.com/rss/edition.rss' },
  { id: 'reuters',    name: 'Reuters',    flag: '🌐', lang: 'en', url: 'https://feeds.reuters.com/reuters/topNews' },
  { id: 'ct24',       name: 'ČT24',       flag: '🇨🇿', lang: 'cs', url: 'https://ct24.ceskatelevize.cz/rss/hlavni-zpravy-ct24.php' },
  { id: 'tagesschau', name: 'Tagesschau', flag: '🇩🇪', lang: 'de', url: 'https://www.tagesschau.de/xml/rss2/' },
];


/* ─── Types ─── */
type Article = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail: string | null;
};

type LoadState = 'idle' | 'loading' | 'ok' | 'error';

/* ─── Helpers ─── */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 90)     return 'Právě teď';
    if (diff < 3600)   return `${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)} hod`;
    return `${Math.floor(diff / 86400)} d`;
  } catch { return ''; }
}

function parseRss(xml: string): Article[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML');

  return Array.from(doc.querySelectorAll('item')).slice(0, 5).map(item => {
    const text = (sel: string) => item.querySelector(sel)?.textContent?.trim() ?? '';

    // Link: <link> text OR next sibling text node (BBC pattern) OR <guid>
    const linkEl = item.querySelector('link');
    const link =
      linkEl?.textContent?.trim() ||
      (linkEl?.nextSibling as Text | null)?.textContent?.trim() ||
      text('guid') || '#';

    // Thumbnail from media:thumbnail, media:content, or enclosure
    const thumb =
      item.querySelector('thumbnail')?.getAttribute('url') ??
      item.querySelector('content')?.getAttribute('url') ??
      item.querySelector('enclosure[type^="image"]')?.getAttribute('url') ??
      null;

    return {
      title:       stripHtml(text('title')),
      link,
      description: stripHtml(text('description')).slice(0, 160),
      pubDate:     text('pubDate') || text('dc\\:date') || text('date'),
      thumbnail:   thumb,
    };
  });
}

function defaultSource(): string {
  if (typeof navigator === 'undefined') return 'bbc';
  const lang = navigator.language.split('-')[0].toLowerCase();
  const match = SOURCES.find(s => s.lang === lang);
  return match?.id ?? 'bbc';
}

/* ─── Article card ─── */
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const ago = timeAgo(article.pubDate);
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        padding: '0.75rem',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.2s, border-color 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(93,76,255,0.07)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(93,76,255,0.2)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.04)';
        }}
      >
        {/* Index */}
        <div style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
          background: 'rgba(93,76,255,0.15)',
          border: '1px solid rgba(93,76,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, color: 'var(--purple3)',
          marginTop: '2px',
        }}>
          {index + 1}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'var(--text1)', fontSize: '0.875rem', fontWeight: 500,
            lineHeight: 1.4, marginBottom: '0.3rem',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.title}
          </div>
          {article.description && (
            <div style={{
              color: 'var(--text3)', fontSize: '0.75rem', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              marginBottom: '0.3rem',
            }}>
              {article.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {ago && (
              <span style={{
                fontSize: '0.68rem', color: 'var(--text3)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 5, padding: '1px 5px',
              }}>
                {ago}
              </span>
            )}
            <span style={{ fontSize: '0.68rem', color: 'var(--purple3)', marginLeft: 'auto', opacity: 0.7 }}>
              ↗
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {article.thumbnail && (
          <img
            src={article.thumbnail} alt=""
            style={{
              flexShrink: 0, width: 56, height: 56,
              borderRadius: 8, objectFit: 'cover',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
    </a>
  );
}

/* ─── Skeleton ─── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {[80, 65, 90, 55, 75].map((w, i) => (
        <div key={i} style={{
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          padding: '0.75rem',
          borderRadius: 12, background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0, animation: 'shimmer 1.4s ease-in-out infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 13, borderRadius: 4, background: 'rgba(255,255,255,0.06)', width: w + '%', marginBottom: '0.4rem', animation: 'shimmer 1.4s ease-in-out infinite' }} />
            <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '55%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─── */
export default function News() {
  const [activeId, setActiveId] = useState<string>('bbc');
  const [cache, setCache] = useState<Record<string, { articles: Article[]; ts: number }>>({});
  const [state, setState] = useState<LoadState>('idle');
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadFeed = useCallback(async (sourceId: string, force = false) => {
    const source = SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    const cached = cache[sourceId];
    const STALE_MS = 15 * 60 * 1000; // 15 min
    if (!force && cached && Date.now() - cached.ts < STALE_MS) {
      setArticles(cached.articles);
      setState('ok');
      return;
    }

    setState('loading');
    try {
      const res = await fetch(`/api/news?source=${sourceId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = parseRss(data.contents as string);
      if (!parsed.length) throw new Error('No articles');
      setCache(c => ({ ...c, [sourceId]: { articles: parsed, ts: Date.now() } }));
      setArticles(parsed);
      setLastRefresh(new Date());
      setState('ok');
    } catch {
      setState('error');
    }
  }, [cache]);

  // Init: detect language, set source, load
  useEffect(() => {
    const id = defaultSource();
    setActiveId(id);
    loadFeed(id);
  }, []); // eslint-disable-line

  function switchSource(id: string) {
    setActiveId(id);
    loadFeed(id);
  }

  const source = SOURCES.find(s => s.id === activeId)!;

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      boxShadow: 'var(--card-shadow)',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '1.1rem',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📰</span>
          <span style={{ color: 'var(--text1)', fontWeight: 600, fontSize: '1rem' }}>Zprávy dne</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {lastRefresh && (
            <span style={{ color: 'var(--text3)', fontSize: '0.68rem' }}>
              {lastRefresh.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => loadFeed(activeId, true)}
            disabled={state === 'loading'}
            title="Obnovit"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, cursor: state === 'loading' ? 'not-allowed' : 'pointer',
              color: 'var(--text3)', fontSize: '0.8rem',
              padding: '3px 7px',
              opacity: state === 'loading' ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* Source tabs */}
      <div style={{
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
      }}>
        {SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => switchSource(s.id)}
            style={{
              background: activeId === s.id
                ? 'linear-gradient(135deg, rgba(93,76,255,0.25), rgba(93,76,255,0.12))'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeId === s.id ? 'rgba(93,76,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 8, cursor: 'pointer',
              color: activeId === s.id ? 'var(--purple3)' : 'var(--text3)',
              fontSize: '0.75rem', fontWeight: activeId === s.id ? 600 : 400,
              padding: '0.3rem 0.6rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              transition: 'all 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{s.flag}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Active source bar */}
      {state === 'ok' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 0.7rem',
          background: 'rgba(93,76,255,0.06)',
          border: '1px solid rgba(93,76,255,0.12)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: '0.9rem' }}>{source.flag}</span>
          <span style={{ color: 'var(--text2)', fontSize: '0.78rem', fontWeight: 500 }}>
            {source.name}
          </span>
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 5, padding: '1px 6px',
            color: '#4ADE80', fontSize: '0.65rem',
          }}>
            {articles.length} článků
          </span>
        </div>
      )}

      {/* Content */}
      {state === 'loading' && <Skeleton />}

      {state === 'error' && (
        <div style={{
          textAlign: 'center', padding: '1.5rem 0',
          color: 'var(--text3)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text2)', marginBottom: '0.3rem' }}>
            Nepodařilo se načíst zprávy
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            Zkontrolujte připojení nebo zkuste jiný zdroj
          </div>
          <button
            onClick={() => loadFeed(activeId, true)}
            style={{
              marginTop: '0.75rem',
              background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.25)',
              borderRadius: 8, cursor: 'pointer', color: 'var(--purple3)',
              fontSize: '0.8rem', padding: '0.4rem 0.9rem',
            }}
          >
            ↺ Zkusit znovu
          </button>
        </div>
      )}

      {state === 'ok' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {articles.map((a, i) => <ArticleCard key={i} article={a} index={i} />)}
        </div>
      )}

      {/* Footer */}
      {state === 'ok' && (
        <div style={{
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>
            Zdroj: {source.name} · Obnovuje se každých 15 min
          </span>
          <a
            href={source.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.68rem', color: 'var(--purple3)', textDecoration: 'none', opacity: 0.7 }}
          >
            RSS ↗
          </a>
        </div>
      )}
    </div>
  );
}
