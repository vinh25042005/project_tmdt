import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { api } from '../../api/client';

export default function ComparisonModal({ provinceCodes = [], onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!provinceCodes.length) return;
    loadComparison();
  }, [provinceCodes]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await api.compareProvinces(provinceCodes.join(','));
      const unique = [];
      const seen = new Set();
      for (const item of res.data || []) {
        if (!seen.has(item.province_code)) {
          seen.add(item.province_code);
          unique.push(item);
        }
      }
      setData(unique);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!provinceCodes.length) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        className="detail-drawer"
        style={{
          width: '840px',
          maxHeight: '85vh',
          height: 'auto',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-hud)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={16} color="#00e5ff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Đối Sánh Đa Chiều Các Thị Trường
              </h3>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                So sánh song song các chỉ số vĩ mô và hạ tầng số giữa các địa bàn được chọn
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ranking-table" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ width: 200 }}>Chỉ Số Thị Trường</th>
                {data.map((p, idx) => (
                  <th key={`hdr-${p.province_code}-${idx}`} style={{ textAlign: 'center', minWidth: 160 }}>
                    <div style={{ fontWeight: 700, color: '#00e5ff', fontSize: '0.86rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{p.region}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: '#f8fafc' }}>Điểm Tiềm Năng</td>
                {data.map((p, idx) => (
                  <td key={`score-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>
                    {p.market_score} <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/ 100</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Dân số 2024</td>
                {data.map((p, idx) => (
                  <td key={`pop-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {Number(p.population).toLocaleString()} ng
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mật độ dân số</td>
                {data.map((p, idx) => (
                  <td key={`dens-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {p.population_density} ng/km²
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tỷ lệ đô thị hóa</td>
                {data.map((p, idx) => (
                  <td key={`urb-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {p.urban_pct}%
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Thu nhập b/q tháng</td>
                {data.map((p, idx) => (
                  <td key={`inc-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#10b981', fontWeight: 700 }}>
                    {p.per_capita_income_million_vnd} tr.đ
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tổng GRDP</td>
                {data.map((p, idx) => (
                  <td key={`gdp-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {(p.gdp_billion_vnd / 1000).toFixed(0)} nghìn tỷ
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Chỉ số TMĐT (EBI)</td>
                {data.map((p, idx) => (
                  <td key={`ebi-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#c084fc', fontWeight: 700 }}>
                    {p.ecommerce_index} EBI
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tiếp cận Internet</td>
                {data.map((p, idx) => (
                  <td key={`inet-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {p.internet_penetration_pct}%
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Sử dụng Smartphone</td>
                {data.map((p, idx) => (
                  <td key={`smart-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                    {p.smartphone_penetration_pct}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
