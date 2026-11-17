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
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeIn 0.18s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 34, 
              height: 34, 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--brand-light)', 
              color: 'var(--brand-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Đối Sánh Đa Chiều Các Thị Trường
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                So sánh song song các chỉ số vĩ mô và hạ tầng số giữa các địa bàn được chọn
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
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
                    <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.86rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{p.region}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Điểm Tiềm Năng</td>
                {data.map((p, idx) => (
                  <td key={`score-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-warning)', fontSize: '1rem' }}>
                    {p.market_score} <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>/ 100</span>
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
                  <td key={`inc-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-success)', fontWeight: 700 }}>
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
                  <td key={`ebi-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 700 }}>
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
