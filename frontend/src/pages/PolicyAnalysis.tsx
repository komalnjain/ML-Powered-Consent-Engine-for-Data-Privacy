import React, { useState } from 'react';
import '../styles/policyanalysis.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function PolicyAnalysis() {
  const [policyText, setPolicyText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('http://localhost:5000/api/scan/analyze-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: policyText }),
      });
      if (!response.ok) throw new Error('Failed to analyze policy');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to analyze policy');
    } finally {
      setLoading(false);
    }
  };

  const RISK_COLORS = ['#22c55e', '#facc15', '#ef4444']; // green, yellow, red
  function getRiskColor(score: number) {
    if (score >= 7) return RISK_COLORS[2];
    if (score >= 4) return RISK_COLORS[1];
    return RISK_COLORS[0];
  }

  return (
    <div className="policy-bg">
      <div className="policy-card">
        <h2 className="policy-title">Policy Analysis</h2>
        <p className="policy-desc">Paste your privacy policy text below to analyze its risk and compliance.</p>
        <textarea
          className="policy-textarea"
          placeholder="Paste your privacy policy here..."
          value={policyText}
          onChange={e => setPolicyText(e.target.value)}
        />
        <button
          className="policy-btn"
          onClick={handleAnalyze}
          disabled={!policyText.trim() || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Policy'}
        </button>
        {error && <div className="policy-error">{error}</div>}
        {result && (
          <div style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto' }}>
            {/* Overall Policy Risk Gauge (PieChart) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <PieChart width={220} height={180}>
                <Pie
                  data={[{ name: 'Risk', value: result.overall_risk }, { name: 'Remaining', value: 10 - result.overall_risk }]}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  cornerRadius={10}
                >
                  <Cell key="risk" fill={getRiskColor(result.overall_risk)} />
                  <Cell key="remaining" fill="#e0e7ff" />
                </Pie>
                <Legend />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '1.5rem' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: getRiskColor(result.overall_risk) }}>{result.overall_risk?.toFixed(1)}/10</span>
                <span style={{ fontWeight: 500, color: '#555' }}>Overall Policy Risk</span>
              </div>
            </div>
            {/* Category Risk Breakdown BarChart */}
            <div style={{ marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#7c3aed' }}>Risk by Policy Category</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(result.risk_scores || {}).map(([category, score]) => ({ category, score }))}>
                  <XAxis dataKey="category" style={{ fontWeight: 500 }} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Category Findings as Badges */}
            {result.categories && Object.keys(result.categories).length > 0 && (
              <div style={{ marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#6366f1' }}>Category Findings</h4>
                {Object.entries(result.categories).map(([cat, findings]) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <span style={{ fontWeight: 500, color: '#7c3aed', marginRight: 8 }}>{cat}:</span>
                    {(findings as string[]).map((point, idx) => (
                      <span key={idx} style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 12, padding: '0.3rem 0.9rem', fontWeight: 500, fontSize: 15, marginRight: 6, marginBottom: 4, display: 'inline-block' }}>{point}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {/* JSON Result Box */}
            <div className="policy-result">
              <h3 style={{fontWeight:600, marginBottom:'0.5rem'}}>Policy Analysis Result</h3>
              <pre style={{whiteSpace:'pre-wrap', fontSize: '1.05rem', lineHeight: 1.5}}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 