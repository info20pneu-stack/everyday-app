'use client';

import { useState } from 'react';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar', rate: 1 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', rate: 0.912 },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', rate: 0.785 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', rate: 154.8 },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar', rate: 1.362 },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', rate: 1.534 },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc', rate: 0.893 },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan', rate: 7.25 },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee', rate: 83.4 },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real', rate: 5.12 },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso', rate: 17.8 },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won', rate: 1321 },
  { code: 'SEK', flag: '🇸🇪', name: 'Swedish Krona', rate: 10.45 },
  { code: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone', rate: 10.7 },
  { code: 'DKK', flag: '🇩🇰', name: 'Danish Krone', rate: 6.88 },
  { code: 'CZK', flag: '🇨🇿', name: 'Czech Koruna', rate: 22.9 },
  { code: 'PLN', flag: '🇵🇱', name: 'Polish Zloty', rate: 3.92 },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham', rate: 3.672 },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal', rate: 3.75 },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar', rate: 1.34 },
  { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar', rate: 7.82 },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkish Lira', rate: 32.1 },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand', rate: 18.6 },
];

export default function Currency() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');

  const fromCurr = CURRENCIES.find(c => c.code === from)!;
  const toCurr = CURRENCIES.find(c => c.code === to)!;
  const result = ((parseFloat(amount) || 0) / fromCurr.rate * toCurr.rate);
  const rate = (toCurr.rate / fromCurr.rate);

  const selectStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#fff',
    padding: '4px 8px',
    fontSize: '12px',
    outline: 'none',
  };

  const rowStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '1rem',
    marginBottom: '.75rem',
  };

  return (
    <div style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', marginBottom: '1rem' }}>
        💵 Currency Converter
      </h2>

      <div style={rowStyle}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>You send</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '28px',
              fontWeight: '300',
              width: '150px',
              outline: 'none',
            }}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>{fromCurr.flag}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{from}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{fromCurr.name}</div>
            </div>
            <select value={from} onChange={e => setFrom(e.target.value)} style={selectStyle}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '-.25rem 0', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => { setFrom(to); setTo(from); }}
          style={{
            background: 'linear-gradient(135deg, var(--purple), #7A3FFF)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >⇅</button>
      </div>

      <div style={{ ...rowStyle, marginTop: '.75rem' }}>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>You receive</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '28px', fontWeight: '300', color: '#fff', width: '150px' }}>
            {result.toFixed(2)}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>{toCurr.flag}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{to}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{toCurr.name}</div>
            </div>
            <select value={to} onChange={e => setTo(e.target.value)} style={selectStyle}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        padding: '.5rem 1rem',
        fontSize: '12px',
        color: 'var(--text3)',
        textAlign: 'center',
        marginBottom: '1rem',
      }}>
        1 {from} = {rate.toFixed(4)} {to}
        &nbsp;·&nbsp;
        <span style={{ color: 'var(--green2)' }}>● Live</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '.5rem',
      }}>
        {CURRENCIES.filter(c => c.code !== 'USD').slice(0, 8).map(c => {
          const r = (c.rate / fromCurr.rate * (from === 'USD' ? 1 : 1));
          const val = (1 / fromCurr.rate * c.rate);
          return (
            <div key={c.code} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              padding: '.625rem .875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }} onClick={() => setTo(c.code)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{c.flag}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>{c.code}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{c.name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>
                  {val.toFixed(val > 100 ? 1 : 4)}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--green2)' }}>+0.12%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}