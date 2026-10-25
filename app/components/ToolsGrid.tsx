'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import ToolCard from './ToolCard';
import AdBanner from './AdBanner';
import { useLang } from '../../lib/LanguageContext';
import { TOOLS, TOOLS_AD_AFTER } from '../../lib/toolsCatalog';

type Props = {
  imageIds: string[];
  /** Show the "All tools →" link (dashboard only) */
  showAllLink?: boolean;
  /** h1 on the /tools page, h2 on the dashboard */
  heading?: 'h1' | 'h2';
};

export default function ToolsGrid({ imageIds, showAllLink = false, heading = 'h2' }: Props) {
  const { t, lang } = useLang();
  const images = new Set(imageIds);
  const Heading = heading;

  return (
    <section className="tools-section">
      <div className="tools-head">
        <Heading className="tools-title">{t.dashboard.toolsTitle}</Heading>
        {showAllLink && (
          <Link href="/tools" className="tools-all">
            {t.dashboard.allTools} <span className="dir-arrow" aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <div className="tools-grid">
        {TOOLS.map((tool, i) => (
          <Fragment key={tool.id}>
            <ToolCard
              id={tool.id}
              lang={lang}
              href={tool.href}
              color={tool.color}
              icon={tool.icon}
              label={t.dashboard[tool.labelKey]}
              desc={t.dashboard[tool.descKey]}
              hasImage={images.has(tool.id)}
            />
            {i === TOOLS_AD_AFTER - 1 && (
              <div className="tools-ad">
                <AdBanner variant="inline" slot="2222222222" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
