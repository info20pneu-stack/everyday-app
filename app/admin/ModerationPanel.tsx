'use client';

import { useCallback, useEffect, useState } from 'react';

/* Leaderboard moderation (/admin → Moderace): recent saves of all boards, deleting an entry,
   banning a nick or a device, the log of refused (suspicious) attempts, and any board's full list. */

interface Recent { game: string; id: string; name: string; norm: string; device: string; ip: string; timeMs: number; score?: number; at: number }
interface Reject { at: number; game: string; reason: string; detail?: string; name?: string; device?: string | null; ip: string; timeMs?: number; score?: number; realMs?: number }
interface BoardEntry { id: string; name: string; timeMs: number; score?: number; date: number; country?: string; dev?: string }
interface Data { prefix: string; recent: Recent[]; rejects: Reject[]; bans: { nicks: string[]; devices: string[] } }

const card: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px',
  marginBottom: '12px',
};
const title: React.CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '10px', fontFamily: 'Poppins' };
const small: React.CSSProperties = { fontSize: '12px', color: 'var(--text3)' };
const btn = (danger = false): React.CSSProperties => ({
  background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
  border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
  color: danger ? '#F87171' : 'var(--text2)', borderRadius: '7px', fontSize: '11px', padding: '4px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
});
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff',
  fontSize: '13px', padding: '7px 10px', minWidth: 0, flex: 1,
};

const fmtAt = (t: number) => new Date(t).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtVal = (e: { score?: number; timeMs: number }) => (e.score != null ? `${e.score} b · ${(e.timeMs / 1000).toFixed(1)} s` : `${(e.timeMs / 1000).toFixed(2)} s`);

const REASONS: Record<string, string> = {
  no_device: 'bez cookie zařízení', rate_limited: 'rate limit', nick_rude: 'sprostý nick', banned: 'ban', nick_limit: 'moc nových nicků',
  token_missing: 'bez tokenu', token_bad_signature: 'podvržený token', token_expired: 'prošlý token', token_malformed: 'vadný token',
  token_game: 'token jiné hry', token_device: 'token jiného zařízení', token_reused: 'opakovaný token',
  too_fast: 'příliš rychle odesláno', time_exceeds_real: 'čas delší než hra', time_too_low: 'nereálně rychlý čas',
  score_too_high: 'nesmyslně vysoké skóre', score_rate: 'moc bodů za sekundu', bad_score: 'vadné skóre', bad_time: 'vadný čas',
  bad_moves: 'vadné tahy', bad_proof: 'chybí/vadné tahy', proof_mismatch: 'tahy neodpovídají', wrong_day: 'jiný den',
};

export default function ModerationPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [banNick, setBanNick] = useState('');
  const [boardId, setBoardId] = useState('');
  const [board, setBoard] = useState<{ id: string; entries: BoardEntry[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/moderation');
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setError('');
    } catch { setError('Nepodařilo se načíst moderaci.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: Record<string, string>, key: string) {
    setBusy(key);
    try {
      const res = await fetch('/api/admin/moderation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return res.ok;
    } finally { setBusy(null); }
  }
  async function remove(boardKey: string, id: string) {
    if (!confirm('Smazat tento záznam ze žebříčku?')) return;
    if (await post({ action: 'delete', board: boardKey, id }, `del:${id}`)) {
      setDeleted(s => new Set(s).add(id));
      setBoard(b => (b && b.id === boardKey ? { ...b, entries: b.entries.filter(e => e.id !== id) } : b));
    }
  }
  async function ban(kind: 'nick' | 'device', value: string, on = true) {
    if (!value) return;
    if (on && !confirm(kind === 'nick' ? `Zabanovat nick „${value}“?` : `Zabanovat zařízení ${value.slice(0, 10)}…?`)) return;
    if (await post({ action: on ? 'ban' : 'unban', kind, value }, `${kind}:${value}`)) await load();
  }
  async function loadBoard() {
    const id = boardId.trim();
    if (!id) return;
    const res = await fetch(`/api/admin/moderation?board=${encodeURIComponent(id)}`);
    if (res.ok) { const d = await res.json(); setBoard({ id, entries: d.entries ?? [] }); } else setBoard({ id, entries: [] });
  }

  if (error) return <div style={card}><div style={{ color: '#F87171', fontSize: '13px' }}>{error}</div></div>;
  if (!data) return <div style={card}><div style={small}>Načítám…</div></div>;

  const bannedNicks = new Set(data.bans.nicks), bannedDevs = new Set(data.bans.devices);

  return (
    <div>
      <div style={card}>
        <div style={title}>🚫 Bany</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input style={input} placeholder="Nick k zabanování" value={banNick} onChange={e => setBanNick(e.target.value)} />
          <button style={btn(true)} onClick={() => { ban('nick', banNick.trim()); setBanNick(''); }}>Zabanovat nick</button>
        </div>
        <div style={{ ...small, marginBottom: '4px' }}>Nicky ({data.bans.nicks.length}):</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {data.bans.nicks.map(n => <button key={n} style={btn()} title="Zrušit ban" onClick={() => ban('nick', n, false)}>{n} ✕</button>)}
          {data.bans.nicks.length === 0 && <span style={small}>—</span>}
        </div>
        <div style={{ ...small, marginBottom: '4px' }}>Zařízení ({data.bans.devices.length}):</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {data.bans.devices.map(d => <button key={d} style={btn()} title="Zrušit ban" onClick={() => ban('device', d, false)}>{d.slice(0, 10)}… ✕</button>)}
          {data.bans.devices.length === 0 && <span style={small}>—</span>}
        </div>
        <div style={{ ...small, marginTop: '10px' }}>Ban skryje skóre ze žebříčků a nová se neuloží. Klíče Redis: <code>{data.prefix}:*</code></div>
      </div>

      <div style={card}>
        <div style={title}>🕒 Poslední záznamy ({data.recent.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
          {data.recent.map(r => {
            const gone = deleted.has(r.id);
            return (
              <div key={`${r.game}-${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', opacity: gone ? 0.4 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}{bannedNicks.has(r.norm) && ' 🚫'}{bannedDevs.has(r.device) && ' 📵'} <span style={small}>· {fmtVal(r)}</span>
                  </div>
                  <div style={{ ...small, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.game} · {fmtAt(r.at)} · zař. {r.device.slice(0, 8)}</div>
                </div>
                {!gone && <button style={btn(true)} disabled={busy === `del:${r.id}`} onClick={() => remove(r.game, r.id)}>Smazat</button>}
                {!bannedNicks.has(r.norm) && <button style={btn()} onClick={() => ban('nick', r.name)}>Ban nick</button>}
                {!bannedDevs.has(r.device) && <button style={btn()} onClick={() => ban('device', r.device)}>Ban zař.</button>}
              </div>
            );
          })}
          {data.recent.length === 0 && <div style={small}>Zatím nic.</div>}
        </div>
      </div>

      <div style={card}>
        <div style={title}>⚠️ Odmítnuté pokusy ({data.rejects.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
          {data.rejects.map((r, i) => (
            <div key={i} style={{ padding: '6px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
              <div style={{ fontSize: '13px', color: '#FCA5A5', fontWeight: 600 }}>
                {REASONS[r.reason] ?? r.reason} <span style={small}>· {r.game} · {fmtAt(r.at)}</span>
              </div>
              <div style={{ ...small, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span>{r.name ?? '—'}</span>
                {r.score != null && <span>skóre {r.score}</span>}
                {r.timeMs != null && <span>čas {(r.timeMs / 1000).toFixed(2)} s</span>}
                {r.realMs != null && <span>reálně {(r.realMs / 1000).toFixed(1)} s</span>}
                {r.detail && <span>({r.detail})</span>}
                {r.device && !bannedDevs.has(r.device) && <button style={btn()} onClick={() => ban('device', r.device!)}>Ban zař.</button>}
              </div>
            </div>
          ))}
          {data.rejects.length === 0 && <div style={small}>Zatím nic.</div>}
        </div>
      </div>

      <div style={card}>
        <div style={title}>📋 Celý žebříček (i starší záznamy)</div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          <input style={input} placeholder="ID žebříčku, např. skytower nebo connectfour_cz_20261026" value={boardId}
            onChange={e => setBoardId(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadBoard(); }} />
          <button style={btn()} onClick={loadBoard}>Načíst</button>
        </div>
        {board && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
            {board.entries.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ ...small, width: '26px' }}>{i + 1}.</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.name} <span style={small}>· {fmtVal(e)} · {fmtAt(e.date)}</span>
                </span>
                <button style={btn(true)} onClick={() => remove(board.id, e.id)}>Smazat</button>
                <button style={btn()} onClick={() => ban('nick', e.name)}>Ban nick</button>
                {e.dev && <button style={btn()} onClick={() => ban('device', e.dev!)}>Ban zař.</button>}
              </div>
            ))}
            {board.entries.length === 0 && <div style={small}>Prázdný nebo neznámý žebříček.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
