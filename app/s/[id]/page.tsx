import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import ShareView from './ShareView';
import translations from '../../../lib/i18n';
import { getShare, publicShare } from '../../../lib/share/store';
import { todayTop3 } from '../../../lib/share/top';
import { formatShareValue, shareGame } from '../../../lib/share/games';
import { fill, shareTexts } from '../../../lib/share/i18n';

/* /s/<id> — a shared game result: the preview (og:image from /api/og), the result, "accept the
   challenge" and today's top 3. The texts of the link preview use the sharer's language. */

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

/** og:locale in Facebook's ll_CC form. */
const OG_LOCALE: Record<string, string> = {
  en: 'en_US', cs: 'cs_CZ', de: 'de_DE', it: 'it_IT', fr: 'fr_FR', es: 'es_ES', pl: 'pl_PL',
  pt: 'pt_PT', ru: 'ru_RU', zh: 'zh_CN', ja: 'ja_JP', ko: 'ko_KR', ar: 'ar_AR', hi: 'hi_IN',
};

async function load(id: string) {
  try { return await getShare(id); } catch (err) { console.error('[s/id]', id, err); return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rec = await load(id);
  if (!rec) return { title: 'EVERY DAY', robots: { index: false } };

  const s = shareTexts(rec.lang);
  const g = shareGame(rec.board);
  const game = g ? g.name(translations[rec.lang] ?? translations.en) : 'EVERY DAY';
  const value = formatShareValue(rec.board, rec, rec.lang);
  const title = `${fill(rec.vs ? s.rematchTitle : s.invites, { name: rec.name })} ${g?.icon ?? '🎮'} ${game}: ${value}`;
  const description = fill(s.ogDesc, { name: rec.name, game, value });
  const image = { url: `/api/og?id=${rec.id}`, width: 1200, height: 630, alt: `${game} – ${rec.name}: ${value}` };

  return {
    title: `${title} | EVERY DAY`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: `/s/${rec.id}` },
    openGraph: {
      title, description, url: `/s/${rec.id}`, siteName: 'EVERY DAY', type: 'website',
      locale: OG_LOCALE[rec.lang] ?? 'en_US', images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const rec = await load(id);
  const top = rec ? await todayTop3(rec.board) : null;
  return (
    <PageShell>
      <ShareView share={rec ? publicShare(rec) : null} top={top} />
    </PageShell>
  );
}
