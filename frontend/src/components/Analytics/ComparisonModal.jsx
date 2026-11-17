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
      // Filter out duplicate province codes if any
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
        style={{ width: '800px', maxHeight: '85vh', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRightLeft size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>So Sánh Các Tỉnh / Thành Phố</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ranking-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ width: 180 }}>Chỉ Số Thị Trường</th>
                {data.map((p, idx) => (
                  <th key={`hdr-${p.province_code}-${idx}`} style={{ textAlign: 'center', minWidth: 150 }}>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.region}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Điểm Thị Trường</td>
                {data.map((p, idx) => (
                  <td key={`score-${p.province_code}-${idx}`} style={{ textAlign: 'center', fontWeight: 800, color: '#ef4444' }}>
                    {p.market_score} / 100
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Dân số 2024</td>
                {data.map((p, idx) => (
                  <td key={`pop-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
                    {Number(p.population).toLocaleString()} ng
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mật độ dân số</td>
                {data.map((p, idx) => (
                  <td key={`dens-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
                    {p.population_density} ng/km²
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tỷ lệ đô thị hóa</td>
                {data.map((p, idx) => (
                  <td key={`urb-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
                    {p.urban_pct}%
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Thu nhập b/q tháng</td>
                {data.map((p, idx) => (
                  <td key={`inc-${p.province_code}-${idx}`} style={{ textAlign: 'center', color: '#4ade80', fontWeight: 700 }}>
                    {p.per_capita_income_million_vnd} tr.đ
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tổng GRDP</td>
                {data.map((p, idx) => (
                  <td key={`gdp-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
                    {(p.gdp_billion_vnd / 1000).toFixed(0)} nghìn tỷ
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Chỉ số TMĐT (EBI)</td>
                {data.map((p, idx) => (
                  <td key={`ebi-${p.province_code}-${idx}`} style={{ textAlign: 'center', color: '#c084fc', fontWeight: 700 }}>
                    {p.ecommerce_index}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Tiếp cận Internet</td>
                {data.map((p, idx) => (
                  <td key={`inet-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
                    {p.internet_penetration_pct}%
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Sử dụng Smartphone</td>
                {data.map((p, idx) => (
                  <td key={`smart-${p.province_code}-${idx}`} style={{ textAlign: 'center' }}>
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
