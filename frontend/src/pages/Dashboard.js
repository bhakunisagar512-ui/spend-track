import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { expensesAPI, budgetsAPI } from '../api';
import { parseExpense, askGemini, CAT_COLORS, CAT_ICONS, fmt } from '../utils/gemini';
import themeModule from '../tailwindTheme';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const { appTheme: T } = themeModule;

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: T.text3, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || T.text2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, byCategory: [], daily: [] });
  const [budgets, setBudgets] = useState({});
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');
  const [askQ, setAskQ] = useState('');
  const [aiResp, setAiResp] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  const months = [...new Set(expenses.map(e => e.date?.slice(0, 7)))].filter(Boolean).sort().reverse();

  const fetchAll = useCallback(async () => {
    try {
      const [expRes, statsRes, budRes] = await Promise.all([
        expensesAPI.getAll(monthFilter ? { month: monthFilter } : {}),
        expensesAPI.getStats(monthFilter ? { month: monthFilter } : {}),
        budgetsAPI.getAll(),
      ]);
      setExpenses(expRes.data.expenses);
      setStats(statsRes.data);
      const budMap = {};
      budRes.data.budgets.forEach(b => { budMap[b.category] = parseFloat(b.amount); });
      setBudgets(budMap);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  }, [monthFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addExpense = async () => {
    if (!input.trim() || parsing) return;
    setParsing(true);
    try {
      const parsed = await parseExpense(input, user?.gemini_api_key);
      if (!parsed) { alert('Please enter like: "250 chai" or "500 uber"'); return; }
      await expensesAPI.create(parsed);
      setInput('');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setParsing(false);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await expensesAPI.delete(id);
      fetchAll();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const saveBudget = async (cat) => {
    const val = parseFloat(budgetEdit[cat]);
    if (isNaN(val) || val <= 0) return;
    try {
      await budgetsAPI.upsert({ category: cat, amount: val });
      fetchAll();
    } catch (err) {
      alert('Failed to save budget');
    }
  };

  const doAsk = async () => {
    if (!askQ.trim()) return;
    setAiLoading(true); setAiResp('');
    const r = await askGemini(askQ, stats, budgets, user?.gemini_api_key);
    setAiResp(r); setAiLoading(false); setAskQ('');
  };

  const topCat = stats.byCategory?.[0];
  const days = stats.daily?.length || 1;
  const avgPerDay = stats.total / Math.max(days, 1);

  const budgetAlerts = Object.entries(budgets).flatMap(([cat, bud]) => {
    const spent = stats.byCategory?.find(c => c.category === cat);
    const s = spent ? parseFloat(spent.total) : 0;
    const pct = s / bud * 100;
    if (pct >= 100) return [{ msg: `${cat} budget exceeded! ${fmt(s)} of ${fmt(bud)}`, type: 'danger' }];
    if (pct >= 80) return [{ msg: `${cat} at ${Math.round(pct)}% — ${fmt(bud - s)} left`, type: 'warn' }];
    return [];
  });

  const donutData = {
    labels: stats.byCategory?.map(c => c.category) || [],
    datasets: [{
      data: stats.byCategory?.map(c => parseFloat(c.total)) || [],
      backgroundColor: stats.byCategory?.map(c => CAT_COLORS[c.category] || T.accent) || [],
      borderWidth: 2, borderColor: T.card, hoverOffset: 5,
    }],
  };

  const last10 = (() => {
    const days = [...Array(10)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 9 + i); return d.toISOString().slice(0, 10); });
    return {
      labels: days.map(d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
      datasets: [{
        label: 'Spent', borderRadius: 6, borderWidth: 1.5,
        data: days.map(day => { const found = stats.daily?.find(d => d.day === day); return found ? parseFloat(found.total) : 0; }),
        backgroundColor: `${T.accent}55`, borderColor: T.accent,
      }],
    };
  })();

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  const barOpts = { ...chartOpts, scales: { x: { ticks: { color: T.text3, font: { size: 10 }, maxRotation: 45 }, grid: { display: false } }, y: { ticks: { color: T.text3, font: { size: 10 }, callback: v => fmt(v) }, grid: { color: `${T.border}44` } } } };

  const s = {
    wrap: { background: T.bg, minHeight: '100vh', fontFamily: T.fonts.display, color: T.text, paddingBottom: 40 },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}` },
    body: { padding: '0 20px', maxWidth: 1100, margin: '0 auto' },
    card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 },
    panelTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: T.text3, textTransform: 'uppercase', marginBottom: 14 },
  };

  if (loadingData) return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.text2 }}>
      Loading your data...
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          spend<span style={{ color: T.accent }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            style={{ background: T.bg3, border: `1px solid ${T.border}`, color: T.text, padding: '6px 10px', borderRadius: 8, fontFamily: T.fonts.display, fontSize: 12, cursor: 'pointer' }}>
            <option value="">All time</option>
            {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
          </select>
          <button onClick={() => navigate('/settings')}
            style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, color: user?.gemini_api_key ? T.accent2 : T.warn, padding: '6px 12px', cursor: 'pointer', fontFamily: T.fonts.display, fontSize: 12 }}>
            {user?.gemini_api_key ? '⚙ AI On' : '⚙ Set Key'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: T.accent + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.accent }}>{user?.name?.charAt(0)}</div>
            }
            <span style={{ fontSize: 13, color: T.text2 }}>{user?.name}</span>
          </div>
        </div>
      </div>

      <div style={s.body}>
        {budgetAlerts.length > 0 && (
          <div style={{ background: `${budgetAlerts[0].type === 'danger' ? T.danger : T.warn}18`, border: `1px solid ${budgetAlerts[0].type === 'danger' ? T.danger : T.warn}44`, borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: budgetAlerts[0].type === 'danger' ? T.danger : T.warn }}>
            {budgetAlerts.map(a => a.msg).join('  ·  ')}
          </div>
        )}

        <div style={{ marginTop: 16, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: T.text3, textTransform: 'uppercase', marginBottom: 10 }}>Log Expense</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExpense()} disabled={parsing}
              placeholder='e.g. "250 banana shake" or "500 uber"'
              style={{ flex: 1, background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, padding: '13px 15px', color: T.text, fontFamily: T.fonts.mono, fontSize: 14, outline: 'none' }} />
            <button onClick={addExpense} disabled={parsing}
              style={{ background: T.accent, border: 'none', borderRadius: 10, padding: '0 22px', color: '#fff', fontFamily: T.fonts.display, fontWeight: 700, fontSize: 14, cursor: parsing ? 'not-allowed' : 'pointer', opacity: parsing ? 0.5 : 1, height: 48, whiteSpace: 'nowrap' }}>
              {parsing ? 'Parsing...' : '+ Add'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: user?.gemini_api_key ? T.accent2 : T.text3, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: user?.gemini_api_key ? T.accent2 : T.text3, display: 'inline-block' }} />
            {user?.gemini_api_key ? 'Gemini AI parsing active' : 'Using local parsing — add API key in Settings'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginTop: 16 }}>
          <StatCard label="Total Spent" value={fmt(stats.total)} sub={`${stats.count} expenses`} />
          <StatCard label="This Month" value={fmt(expenses.filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + parseFloat(e.amount), 0))} sub={new Date().toLocaleString('default', { month: 'long' })} />
          <StatCard label="Top Category" value={topCat?.category || '—'} sub={topCat ? fmt(parseFloat(topCat.total)) : '—'} subColor={topCat ? CAT_COLORS[topCat.category] : T.text2} />
          <StatCard label="Avg / Day" value={fmt(avgPerDay)} sub="daily average" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginTop: 16 }}>
          <div>
            <div style={s.card}>
              <div style={s.panelTitle}>Category Breakdown</div>
              <div style={{ position: 'relative', height: 210 }}>
                {stats.byCategory?.length > 0
                  ? <Doughnut data={donutData} options={{ ...chartOpts, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw)}` } } } }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: T.text3, fontSize: 13 }}>No data yet</div>
                }
              </div>
              {stats.byCategory?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 14 }}>
                  {stats.byCategory.map(c => (
                    <span key={c.category} style={{ fontSize: 12, color: T.text2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[c.category] || T.accent }} />
                      {c.category} {fmt(parseFloat(c.total))}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={s.card}>
              <div style={s.panelTitle}>10-Day Trend</div>
              <div style={{ position: 'relative', height: 180 }}>
                <Bar data={last10} options={barOpts} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ ...s.card, maxHeight: 330, overflow: 'hidden' }}>
              <div style={s.panelTitle}>Recent Expenses</div>
              <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                {expenses.length === 0
                  ? <div style={{ textAlign: 'center', padding: '30px 0', color: T.text3, fontSize: 13 }}>No expenses yet</div>
                  : expenses.slice(0, 30).map(exp => (
                    <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: (CAT_COLORS[exp.category] || T.accent) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {exp.emoji || CAT_ICONS[exp.category] || '📦'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T.text }}>{exp.description}</div>
                        <div style={{ fontSize: 11, color: T.text3 }}>{exp.category} · {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fonts.mono, color: T.danger, flexShrink: 0 }}>-{fmt(parseFloat(exp.amount))}</div>
                      <button onClick={() => deleteExpense(exp.id)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 12, padding: '0 2px', opacity: 0.6 }}>✕</button>
                    </div>
                  ))
                }
              </div>
            </div>

            <div style={s.card}>
              <div style={s.panelTitle}>Category Stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.byCategory?.length === 0
                  ? <div style={{ color: T.text3, fontSize: 13 }}>No data yet</div>
                  : stats.byCategory?.map(c => {
                    const pct = stats.total ? parseFloat(c.total) / stats.total * 100 : 0;
                    return (
                      <div key={c.category}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: T.text2 }}>{CAT_ICONS[c.category] || '📦'} {c.category}</span>
                          <span style={{ fontFamily: T.fonts.mono, color: T.text2 }}>{fmt(parseFloat(c.total))} · {pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 4, background: T.bg3, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLORS[c.category] || T.accent, borderRadius: 3, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...s.card, marginTop: 0 }}>
          <div style={s.panelTitle}>Budget Limits</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            {['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Recharge'].map(cat => {
              const catStat = stats.byCategory?.find(c => c.category === cat);
              const spent = catStat ? parseFloat(catStat.total) : 0;
              const budget = budgets[cat] || 0;
              const pct = budget ? Math.min(spent / budget * 100, 100) : 0;
              const color = pct >= 100 ? T.danger : pct >= 80 ? T.warn : T.accent2;
              return (
                <div key={cat} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{CAT_ICONS[cat]} {cat}</span>
                    {budget > 0 && <span style={{ fontSize: 11, fontFamily: T.fonts.mono, color }}>{Math.round(pct)}%</span>}
                  </div>
                  {budget > 0 && (
                    <div style={{ height: 4, background: T.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: T.text3, marginBottom: 8 }}>{budget > 0 ? `${fmt(spent)} / ${fmt(budget)}` : 'No limit set'}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="number" placeholder="₹ limit" value={budgetEdit[cat] || ''}
                      onChange={e => setBudgetEdit(p => ({ ...p, [cat]: e.target.value }))}
                      style={{ flex: 1, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', color: T.text, fontFamily: T.fonts.mono, fontSize: 12, outline: 'none', minWidth: 0 }} />
                    <button onClick={() => saveBudget(cat)}
                      style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 10px', color: T.text2, cursor: 'pointer', fontSize: 11, fontFamily: T.fonts.display }}>
                      Set
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...s.card, marginTop: 0 }}>
          <div style={s.panelTitle}>Ask AI About Your Spending</div>
          {!user?.gemini_api_key && (
            <div style={{ fontSize: 12, color: T.warn, marginBottom: 12, padding: '8px 12px', background: `${T.warn}12`, borderRadius: 8, border: `1px solid ${T.warn}33` }}>
              Set your Gemini API key in Settings to enable AI insights.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input value={askQ} onChange={e => setAskQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doAsk()} disabled={aiLoading}
              placeholder="Ask: Where am I overspending? How can I save more?"
              style={{ flex: 1, background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', color: T.text, fontFamily: T.fonts.display, fontSize: 13, outline: 'none' }} />
            <button onClick={doAsk} disabled={aiLoading || !user?.gemini_api_key}
              style={{ background: T.bg3, border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 10, padding: '12px 18px', fontFamily: T.fonts.display, fontSize: 13, fontWeight: 700, cursor: (!user?.gemini_api_key || aiLoading) ? 'not-allowed' : 'pointer', opacity: (!user?.gemini_api_key || aiLoading) ? 0.4 : 1, whiteSpace: 'nowrap' }}>
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>
          {aiResp && (
            <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, padding: '12px 14px', background: T.bg3, borderRadius: 10, borderLeft: `3px solid ${T.accent}` }}>
              {aiResp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
