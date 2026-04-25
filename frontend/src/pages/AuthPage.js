import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import themeModule from '../tailwindTheme';

const { appTheme: T } = themeModule;

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setError(''); setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', background: T.bg3, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '12px 14px', color: T.text,
    fontFamily: T.fonts.display, fontSize: 14, outline: 'none',
    boxSizing: 'border-box', marginBottom: 12,
  };

  return (
    <div className="bg-app-bg min-h-screen px-5 py-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px', color: T.text }}>
            spend<span style={{ color: T.accent }}>AI</span>
          </div>
          <p style={{ color: T.text2, fontSize: 14, marginTop: 6 }}>Your AI-powered finance assistant</p>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28 }}>
          <div style={{ display: 'flex', background: T.bg3, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: T.fonts.display, fontWeight: 600, fontSize: 13, background: mode === m ? T.accent : 'transparent', color: mode === m ? '#fff' : T.text2, transition: 'all 0.2s' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#ff5f5f15', border: `1px solid ${T.danger}44`, borderRadius: 8, padding: '10px 14px', color: T.danger, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <input style={inp} placeholder="Full name" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            )}
            <input style={inp} type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            <input style={{ ...inp, marginBottom: 20 }} type="password" placeholder="Password (min 6 chars)" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: T.accent, border: 'none', borderRadius: 10, padding: '13px 0', color: '#fff', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: 16 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 12, color: T.text3 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed')}
              theme="filled_black" shape="rectangular" size="large" text={mode === 'login' ? 'signin_with' : 'signup_with'} />
          </div>
        </div>
      </div>
    </div>
  );
}
