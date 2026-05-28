'use client';

import { memo } from 'react';
import Link from 'next/link';

const TILES = [
  { icon: '🕐', label: 'World Time',         href: '/world-time'        },
  { icon: '💵', label: 'Currency',            href: '/currency'          },
  { icon: '📏', label: 'Unit Converter',      href: '/unit-converter'    },
  { icon: '📅', label: 'Date Counter',        href: '/date-counter'      },
  { icon: '🌤️', label: 'Weather',            href: '/weather'           },
  { icon: '👤', label: 'Age Calculator',      href: '/age-calculator'    },
  { icon: '🏆', label: 'Sports',             href: '/sports'            },
  { icon: '📈', label: 'Rankings',           href: '/rankings'          },
  { icon: '₿',  label: 'Crypto',             href: '/crypto'            },
  { icon: '⚡', label: 'Daily Boost',        href: '/daily-boost'       },
  { icon: '🎮', label: 'Daily Games',        href: '/daily-games'       },
  { icon: '📊', label: 'Markets',            href: '/markets'           },
  { icon: '🌐', label: 'IP Address',         href: '/ip-address'        },
  { icon: '🚀', label: 'Speed Test',         href: '/speed-test'        },
  { icon: '🔑', label: 'Password Generator', href: '/password-generator'},
  { icon: '🌅', label: 'Sunrise & Sunset',   href: '/sunrise-sunset'    },
  { icon: '⚖️', label: 'BMI Calculator',    href: '/bmi'               },
  { icon: '💡', label: 'Suggest & Vote',     href: '/suggest'           },
];

function MobileDashboard() {
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
            fontSize: '11px',
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
