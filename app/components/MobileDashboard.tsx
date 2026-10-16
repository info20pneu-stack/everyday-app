'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import type { Translations } from '../../lib/i18n';

function getTiles(t: Translations) {
  return [
    { icon: '🕐', label: t.dashboard.label_worldTime,     href: '/world-time'        },
    { icon: '💵', label: t.dashboard.label_currency,      href: '/currency'          },
    { icon: '📏', label: t.dashboard.label_unitConverter, href: '/unit-converter'    },
    { icon: '📅', label: t.dashboard.label_dateCounter,   href: '/date-counter'      },
    { icon: '🌤️', label: t.dashboard.label_weather,       href: '/weather'           },
    { icon: '👤', label: t.dashboard.label_ageCalculator, href: '/age-calculator'    },
    { icon: '🏆', label: t.dashboard.label_sports,        href: '/sports'            },
    { icon: '📈', label: t.dashboard.label_rankings,      href: '/rankings'          },
    { icon: '₿',  label: t.dashboard.label_crypto,        href: '/crypto'            },
    { icon: '⚡', label: t.dashboard.label_dailyBoost,    href: '/daily-boost'       },
    { icon: '🎮', label: t.dashboard.label_dailyGames,    href: '/daily-games'       },
    { icon: '📊', label: t.dashboard.label_markets,       href: '/markets'           },
    { icon: '🌐', label: t.dashboard.label_ipAddress,     href: '/ip-address'        },
    { icon: '🚀', label: t.dashboard.label_speedTest,     href: '/speed-test'        },
    { icon: '🔑', label: t.dashboard.label_passwordGen,   href: '/password-generator'},
    { icon: '🌅', label: t.dashboard.label_sunriseSunset, href: '/sunrise-sunset'    },
    { icon: '⚖️', label: t.dashboard.label_bmi,           href: '/bmi'               },
    { icon: '💡', label: t.dashboard.label_suggestVote,   href: '/suggest'           },
  ];
}

function MobileDashboard() {
  const { t } = useLang();
  const TILES = getTiles(t);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      padding: '4px 0',
      animation: 'pageFadeIn 0.4s ease both',
    }}>
      {TILES.map((tile, i) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(15,20,40,0.92)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--card-radius)',
            padding: '20px 8px',
            textDecoration: 'none',
            boxShadow: 'var(--card-shadow)',
            animation: `widgetIn 0.4s ease ${0.03 + i * 0.025}s both`,
          }}
        >
          <span style={{ fontSize: '30px', lineHeight: 1 }}>{tile.icon}</span>
          <span style={{
            fontSize: '12px',
            color: 'var(--text2)',
            textAlign: 'center',
            lineHeight: 1.35,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {tile.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default memo(MobileDashboard);
