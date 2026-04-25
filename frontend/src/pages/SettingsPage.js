import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#0e0f12', bg2: '#16181d', bg3: '#1c1e24', card: '#1e2028',
  border: '#2a2c38', accent: '#7c6dfa', accent2: '#00d4a0',
  text: '#eeeef5', text2: '#8a8aa8', text3: '#484860', danger: '#ff5f5f', warn: '#f5a623',
};

export default function SettingsPage() {
  const { user, logout, updateApiKey } = useAuth();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(user?.gemini_api_key || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveKey = async () => {
    setSaving(true); setError('');
    try {
      await updateApiKey(apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, marginBottom: 16 };
  const label = { fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', marginBottom: 10, display: 'block' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: T.text }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 13 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Settings</h1>
        </div>

        <div style={card}>
          <span style={label}>Account</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: T.accent }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: T.text2 }}>{user?.email}</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <span style={label}>Gemini API Key</span>
          <p style={{ fontSize: 13, color: T.text2, marginBottom: 14, lineHeight: 1.6 }}>
            Your API key is stored securely in the database and used for AI expense parsing and insights.
            Get a free key at{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: T.accent }}>
              aistudio.google.com
            </a>.
          </p>
          {error && <div style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Paste your Gemini API key..."
            style={{ width: '100%', background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', color: T.text, fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleSaveKey} disabled={saving}
              style={{ background: T.accent, border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            {saved && <span style={{ fontSize: 13, color: T.accent2 }}>✓ Saved successfully!</span>}
            {apiKey && !saved && (
              <button onClick={() => { setApiKey(''); updateApiKey(''); }}
                style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', color: T.text3, fontFamily: "'Syne', sans-serif", fontSize: 13, cursor: 'pointer' }}>
                Clear Key
              </button>
            )}
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: T.bg3, borderRadius: 8, fontSize: 12, color: T.text3, lineHeight: 1.6 }}>
            <strong style={{ color: T.text2 }}>Status:</strong>{' '}
            {user?.gemini_api_key
              ? <span style={{ color: T.accent2 }}>✓ AI parsing active (gemini-2.0-flash)</span>
              : <span style={{ color: T.warn }}>⚠ No key set — using local keyword parsing</span>}
          </div>
        </div>

        <div style={card}>
          <span style={label}>Session</span>
          <p style={{ fontSize: 13, color: T.text2, marginBottom: 14 }}>Sign out of your account on this device.</p>
          <button onClick={handleLogout}
            style={{ background: T.danger + '18', border: `1px solid ${T.danger}44`, borderRadius: 10, padding: '10px 22px', color: T.danger, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
