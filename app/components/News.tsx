'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../../lib/LanguageContext';
import FlagText from './FlagText';
import { fmtNumber } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolHero } from './tools/ToolFrame';

/* ─── Feed definitions ─── */
type Source = { id: string; name: string; flag: string; url: string; lang: string };

const SOURCES: Source[] = [
  { id: 'bbc',        name: 'BBC News',     flag: '🇬🇧', lang: 'en', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'guardian',   name: 'The Guardian', flag: '🌐',  lang: 'en', url: 'https://www.theguardian.com/world/rss' },
  { id: 'nytimes',    name: 'NY Times',     flag: '🇺🇸', lang: 'en', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  { id: 'idnes',      name: 'iDnes',        flag: '🇨🇿', lang: 'cs', url: 'https://servis.idnes.cz/rss.aspx?c=zpravodaj' },
  { id: 'tagesschau', name: 'Tagesschau',   flag: '🇩🇪', lang: 'de', url: 'https://www.tagesschau.de/xml/rss2/' },
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

/** "před 5 min", "5 min ago", "now" — relative time in the UI language. */
function timeAgo(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return '';
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });
  const diff = (Date.now() - time) / 1000;
  if (diff < 90)    return rtf.format(0, 'second');
  if (diff < 3600)  return rtf.format(-Math.floor(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
  return rtf.format(-Math.floor(diff / 86400), 'day');
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

/** A source in the UI language when there is one, else BBC. */
function defaultSource(uiLang: string): string {
  return SOURCES.find(s => s.lang === uiLang)?.id ?? 'bbc';
}

/* ─── Article card ─── */
function ArticleCard({ article, index }: { article: Article; index: number }) {
  const { lang } = useLang();
  const ago = timeAgo(article.pubDate, lang);
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div className="nw-card">
        {/* Index */}
        <div style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: 6,
          background: 'rgba(93,76,255,0.15)',
          border: '1px solid rgba(93,76,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--purple3)',
          marginTop: '2px',
        }}>
          {fmtNumber(index + 1, lang)}
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
                fontSize: '0.75rem', color: 'var(--text3)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 5, padding: '1px 5px',
              }}>
                {ago}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--purple3)', marginInlineStart: 'auto', opacity: 0.7 }}>
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
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const [activeId, setActiveId] = useState<string>('bbc');
  const [cache, setCache] = useState<Record<string, { articles: Article[]; ts: number }>>({});
  const [state, setState] = useState<LoadState>('idle');
  const [articles, setArticles] = useState<Article[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [picked, setPicked] = useState(false);

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

  // Load the source in the UI language (again when the language loads, until the reader picks one)
  useEffect(() => {
    if (picked) return;
    const id = defaultSource(lang);
    setActiveId(id);
    loadFeed(id);
  }, [lang]); // eslint-disable-line

  function switchSource(id: string) {
    setPicked(true);
    setActiveId(id);
    loadFeed(id);
  }

  const source = SOURCES.find(s => s.id === activeId)!;

  const top = articles[0];

  return (
    <ToolFrame toolId="zpravy" wide>
      <div className="tf-chips">
        {SOURCES.map(s => (
          <button key={s.id} type="button" className={`tf-chip${activeId === s.id ? ' is-on' : ''}`} aria-pressed={activeId === s.id} onClick={() => switchSource(s.id)}>
            <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}><FlagText text={s.flag} size={16} /></span> {s.name}
          </button>
        ))}
      </div>

      {state === 'loading' && <Skeleton />}

      {state === 'error' && (
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 30 }}>📡</div>
          <div>{t.news.failedToLoad}</div>
          <div className="tf-note">{t.news.checkConnection}</div>
          <ToolButton onClick={() => loadFeed(activeId, true)}>{t.news.tryAgain}</ToolButton>
        </div>
      )}

      {state === 'ok' && top && (
        <>
          <a href={top.link} target="_blank" rel="noopener noreferrer" className="nw-hero-link">
            <ToolHero
              label={<span className="nw-hero-label"><FlagText text={source.flag} size={16} /> {source.name} · {fmtNumber(articles.length, lang)} {t.news.articleUnit}</span>}
              value={<span className="nw-headline">{top.title}</span>}
              sub={<>{timeAgo(top.pubDate, lang)}{top.pubDate && ' · '}↗</>}
            />
          </a>

          <div className="tf-panel">
            {articles.slice(1).map((a, i) => <ArticleCard key={i} article={a} index={i + 1} />)}
          </div>

          <ToolButton onClick={() => loadFeed(activeId, true)}>↺ {st.refresh}</ToolButton>

          <div className="tf-note">
            {t.news.source} {source.name} · {t.news.refreshNote}
            {lastRefresh && <> · 🕐 {lastRefresh.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</>}
            {' · '}<a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#C4B5FD' }}>RSS ↗</a>
          </div>
        </>
      )}

      <style>{`
        .nw-hero-link { text-decoration: none; color: inherit; display: block; }
        .nw-hero-label { display: inline-flex; align-items: center; gap: 6px; }
        .nw-headline { display: block; font: 800 clamp(20px, 5.5vw, 26px)/1.25 'Poppins', system-ui, sans-serif; text-shadow: none; text-wrap: balance; }
        .nw-card {
          display: flex; gap: .75rem; align-items: flex-start; padding: .75rem; border-radius: 14px; cursor: pointer;
          background: linear-gradient(160deg, rgba(28,34,88,.6), rgba(18,22,64,.6)); border: 1px solid rgba(255,255,255,.06);
          transition: border-color .2s;
        }
        .nw-card:hover { border-color: color-mix(in srgb, var(--tc) 50%, transparent); }
        @keyframes shimmer { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
      `}</style>
    </ToolFrame>
  );
}
