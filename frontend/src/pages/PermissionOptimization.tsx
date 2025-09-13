import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const fallbackRemediations = [
  {
    name: 'android.permission.CAMERA',
    remediation: 'Consider if camera access is necessary for core functionality',
    risk: 'High',
    description: '',
    enabled: true
  },
  {
    name: 'android.permission.ACCESS_FINE_LOCATION',
    remediation: 'Consider using coarse location instead if precise location is not required',
    risk: 'High',
    description: '',
    enabled: true
  },
  {
    name: 'android.permission.READ_CONTACTS',
    remediation: 'Consider if contact access is necessary for core functionality',
    risk: 'High',
    description: '',
    enabled: true
  },
  {
    name: 'android.permission.INTERNET',
    remediation: 'Consider if internet access is necessary for core functionality',
    risk: 'Medium',
    description: '',
    enabled: true
  },
  {
    name: 'android.permission.VIBRATE',
    remediation: 'Consider if vibration control is necessary for core functionality',
    risk: 'Low',
    description: '',
    enabled: true
  },
  {
    name: 'android.permission.FOREGROUND_SERVICE_CAMERA',
    remediation: 'Review if this permission is necessary for core functionality',
    risk: 'Low',
    description: '',
    enabled: true
  },
];

export default function PermissionOptimization() {
  const [permsToShow, setPermsToShow] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let perms: any[] = [];
    try {
      const stored = localStorage.getItem('last_permissions_full');
      if (stored) perms = JSON.parse(stored);
    } catch {}
    // Filter for high/medium risk, map risk number to level, sort, and take top 10
    if (perms && perms.length > 0) {
      perms = perms
        .filter((p: any) => typeof p.risk === 'number' && p.risk > 4)
        .map((p: any) => ({
          ...p,
          risk: p.risk > 7 ? 'High' : 'Medium',
        }))
        .sort((a: any, b: any) => b.risk === 'High' && a.risk !== 'High' ? 1 : a.risk === 'High' && b.risk !== 'High' ? -1 : 0 || b.risk - a.risk || 0)
        .slice(0, 10);
      if (perms.length === 0) perms = fallbackRemediations;
    } else {
      perms = fallbackRemediations;
    }
    setPermsToShow(perms);
    setLoading(false);
  }, []);

  if (loading) return <div style={{padding:'2rem'}}>Loading...</div>;

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 50%, #ffe4e6 100%)', padding:'2rem'}}>
      <div style={{maxWidth:600, margin:'2rem auto', background:'#fff', borderRadius:'2rem', boxShadow:'0 8px 32px 0 rgba(124,58,237,0.10)', padding:'2.5rem'}}>
        <h2 style={{fontSize:'2rem', fontWeight:900, color:'#7c3aed', marginBottom:'1.5rem'}}>Permission Optimization</h2>
        <h3 style={{fontWeight:700, marginTop:'1.5rem'}}>Remediation Suggestions</h3>
        <ul style={{marginBottom:'1.5rem', listStyle:'none', padding:0}}>
          {permsToShow.map(function(item, idx) {
            return (
              <li key={item.name} style={{marginBottom:'1.2rem', background:'#f3e8ff', borderRadius:'1rem', padding:'1rem 1.5rem', boxShadow:'0 2px 8px 0 rgba(124,58,237,0.06)'}}>
                <div style={{fontWeight:600, color:'#7c3aed', fontSize:'1.1rem'}}>{item.name}</div>
                <div style={{marginTop:'0.3rem', color:'#555'}}><b>Remediation:</b> {item.remediation}</div>
                {item.risk && (
                  <div style={{marginTop:'0.2rem', color:'#e11d48'}}><b>Risk:</b> {item.risk}</div>
                )}
              </li>
            );
          })}
        </ul>
        <button
          style={{marginTop:'2rem', padding:'0.8rem 2rem', borderRadius:'1rem', background:'#7c3aed', color:'#fff', fontWeight:700, fontSize:'1.1rem', border:'none', cursor:'pointer'}}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
} 