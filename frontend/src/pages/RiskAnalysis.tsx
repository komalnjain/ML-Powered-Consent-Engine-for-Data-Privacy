import React, { useState } from 'react';
import '../styles/riskanalysis.css';
import { RiskAnalysis } from '../components/dashboard/RiskAnalysis';
import { RiskBadge } from '../components/dashboard/RiskBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function RiskAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [urlResult, setUrlResult] = useState<any>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('http://localhost:5000/api/scan/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to analyze APK');
      const data = await response.json();
      setResult(data);
      if (data && data.permissions) {
        localStorage.setItem('last_permissions', JSON.stringify(data.permissions.map((p: any) => p.name)));
        localStorage.setItem('last_permissions_full', JSON.stringify(data.permissions));
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to analyze APK');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlAnalyze = async () => {
    if (!url) return;
    setUrlLoading(true);
    setUrlError('');
    setUrlResult(null);
    try {
      const response = await fetch('http://localhost:5000/api/scan/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error('Failed to analyze URL');
      const data = await response.json();
      setUrlResult(data);
    } catch (err) {
      if (err instanceof Error) setUrlError(err.message);
      else setUrlError('Failed to analyze URL');
    } finally {
      setUrlLoading(false);
    }
  };

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (result && result.risk_score >= 7) riskLevel = 'high';
  else if (result && result.risk_score >= 4) riskLevel = 'medium';

  // Debug: log the result state
  console.log('APK analysis result:', result);

  const RISK_COLORS = ['#22c55e', '#facc15', '#ef4444']; // green, yellow, red

  function getRiskLevel(score: number) {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  function getRiskColor(score: number) {
    if (score >= 7) return RISK_COLORS[2];
    if (score >= 4) return RISK_COLORS[1];
    return RISK_COLORS[0];
  }

  return (
    <div className="risk-bg">
      <div className="risk-card">
        <h2 className="risk-title">Risk Analysis</h2>
        <p className="risk-desc">Upload an APK file to analyze its privacy and security risk.</p>
        <input type="file" accept=".apk" onChange={handleFileChange} className="risk-file" />
        <button
          className="risk-btn"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze APK'}
        </button>
        <hr style={{margin:'2rem 0 1.5rem 0', border:'none', borderTop:'1px solid #e0e7ff'}} />
        <h3 className="risk-title" style={{fontSize:'1.2rem', marginBottom:'0.5rem'}}>Analyze Website or URL Risk</h3>
        <input
          type="text"
          className="risk-file"
          placeholder="Enter website URL (e.g. https://example.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{marginBottom:'0.7rem'}}
        />
        <button
          className="risk-btn"
          onClick={handleUrlAnalyze}
          disabled={!url || urlLoading}
        >
          {urlLoading ? 'Analyzing...' : 'Analyze URL'}
        </button>
        {urlError && <div className="risk-error">{urlError}</div>}
        {urlResult && (
          <div className="risk-result">
            <h3 style={{fontWeight:600, marginBottom:'0.5rem'}}>URL Risk Result</h3>
            <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(urlResult, null, 2)}</pre>
            <div style={{marginTop:'1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
              <RiskBadge level={urlResult.risk_level || 'low'} score={urlResult.risk_score} />
              <span style={{fontWeight:500, color:'#555'}}>Risk Level: <b style={{textTransform:'capitalize'}}>{urlResult.risk_level || 'low'}</b></span>
            </div>
          </div>
        )}
        {result && (
          <div style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto' }}>
            {/* Overall Risk Gauge (PieChart) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <PieChart width={220} height={180}>
                <Pie
                  data={[{ name: 'Risk', value: result.risk_score }, { name: 'Remaining', value: 10 - result.risk_score }]}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  cornerRadius={10}
                >
                  <Cell key="risk" fill={getRiskColor(result.risk_score)} />
                  <Cell key="remaining" fill="#e0e7ff" />
                </Pie>
                <Legend />
              </PieChart>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '1.5rem' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: getRiskColor(result.risk_score) }}>{result.risk_score?.toFixed(1)}/10</span>
                <span style={{ fontWeight: 500, color: '#555' }}>Overall Risk</span>
              </div>
            </div>
            {/* Category Breakdown BarChart */}
            <div style={{ marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#7c3aed' }}>Risk by Category</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(result.categories || {}).map(([category, score]) => ({ category, score }))}>
                  <XAxis dataKey="category" style={{ fontWeight: 500 }} />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Permissions by Risk Level BarChart */}
            <div style={{ marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#7c3aed' }}>Permissions by Risk Level</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={['high', 'medium', 'low'].map(level => ({
                  level,
                  count: (result.permissions || []).filter((p: any) => getRiskLevel(p.risk) === level).length
                }))}>
                  <XAxis dataKey="level" style={{ fontWeight: 500 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Critical Items as Badges */}
            {result.critical_items && result.critical_items.length > 0 && (
              <div style={{ marginBottom: '2rem', background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12, color: '#e11d48' }}>Critical Findings</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                  {result.critical_items.map((item: string, idx: number) => (
                    <span key={idx} style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 12, padding: '0.4rem 1rem', fontWeight: 500, fontSize: 15 }}>{item}</span>
                  ))}
                </div>
              </div>
            )}
            {/* JSON Result Box */}
            <div className="risk-result" style={{ maxWidth: '1000px', minWidth: '600px', margin: '2rem auto', padding: '1.5rem 2.5rem', borderRadius: '1.2rem', background: '#f3e8ff', boxShadow: '0 2px 8px 0 rgba(124,58,237,0.06)', wordBreak: 'break-word' }}>
              <h3 style={{fontWeight:600, marginBottom:'0.5rem'}}>Analysis Result</h3>
              <pre style={{whiteSpace:'pre-wrap', fontSize: '1.05rem', lineHeight: 1.5}}>{JSON.stringify(result, null, 2)}</pre>
              <div style={{marginTop:'1.5rem', display:'flex', alignItems:'center', gap:'1rem'}}>
                <RiskBadge level={riskLevel} score={result.risk_score} />
                <span style={{fontWeight:500, color:'#555'}}>Risk Level: <b style={{textTransform:'capitalize'}}>{riskLevel}</b></span>
              </div>
              <div style={{marginTop:'1.5rem', background:'#e0e7ff', borderRadius:'1rem', padding:'1rem', border:'1px solid #a5b4fc'}}>
                <b>Want to reduce your app's risk?</b> See actionable remediation and optimization suggestions on the{' '}
                <a href="/permission-optimization" style={{color:'#6366f1', textDecoration:'underline'}}>Optimization</a> page.
              </div>
              {result && result.scan_id && (
                <button
                  className="risk-btn"
                  style={{ marginTop: '1rem' }}
                  onClick={async () => {
                    try {
                      const response = await fetch(`http://localhost:5000/api/scan/download-report/${result.scan_id}`);
                      if (!response.ok) throw new Error('Failed to download PDF');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `scan_report_${result.scan_id}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      alert('Failed to download PDF report.');
                    }
                  }}
                >
                  Download PDF Report
                </button>
              )}
            </div>
          </div>
        )}
        {error && <div className="risk-error">{error}</div>}
      </div>
    </div>
  );
} 