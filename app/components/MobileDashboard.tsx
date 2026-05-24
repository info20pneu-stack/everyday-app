'use client';

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

export default function MobileDashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      padding: '4px 0',
    }}>
      {TILES.map(tile => (
        <Link
          key={tile.href}
          href={tile.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(15,20,40,0.92)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px',
            padding: '18px 8px',
            textDecoration: 'none',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(93,76,255,0.15)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(93,76,255,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(15,20,40,0.92)';
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.07)';
          }}
        >
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{tile.icon}</span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text2)',
            textAlign: 'center',
            lineHeight: 1.3,
            fontFamily: 'Poppins, sans-serif',
          }}>
            {tile.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
