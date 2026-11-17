import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, Smartphone, Award, ArrowUpRight } from 'lucide-react';
import { api } from '../../api/client';

export default function DashboardPanel({ onSelectProvince, selectedRegion = null }) {
  const [summary, setSummary] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [metric, setMetric] = useState('market_score');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [metric, selectedRegion]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, rankRes] = await Promise.all([
        api.getNationalSummary(selectedRegion),
        api.getRanking(metric, 10, 'desc', selectedRegion)
      ]);
      setSummary(sumRes.data.summary);
      setRankings(rankRes.data || []);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = () => {
    if (metric === 'market_score') return 'Điểm Tiềm Năng (0-100)';
    if (metric === 'population') return 'Dân Số (triệu)';
    if (metric === 'gdp_billion_vnd') return 'GRDP (nghìn tỷ)';
    if (metric === 'per_capita_income_million_vnd') return 'Thu Nhập (tr.đ/tháng)';
    return 'Chỉ Số TMĐT';
  };

  const formatBarValue = (val) => {
    if (metric === 'population') return Number((val / 1000000).toFixed(2));
    if (metric === 'gdp_billion_vnd') return Number((val / 1000).toFixed(0));
    return Number(val);
  };

  const chartData = rankings.map((r) => ({
    name: r.name.replace('Thành phố ', 'TP. '),
    val: formatBarValue(r[metric] || 0),
    code: r.province_code
  }));

  return (
    <div>
      {/* Telemetry Metric KPI Cards */}
      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">
              <Users size={13} style={{ color: 'var(--brand-primary)' }} />
              <span>Dân Số {selectedRegion ? `(${selectedRegion})` : 'Toàn Quốc'}</span>
            </div>
            <div className="stat-value">
              {Number(summary.total_population || 0).toLocaleString()}
            </div>
            <div className="stat-sub">
              Tỷ lệ đô thị: <strong style={{ color: 'var(--brand-primary)' }}>{summary.avg_urbanization_pct}%</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <DollarSign size={13} style={{ color: 'var(--accent-success)' }} />
              <span>Thu Nhập Bình Quân</span>
            </div>
            <div className="stat-value">
              {summary.avg_income_million_vnd} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>tr.đ</span>
            </div>
            <div className="stat-sub">Tháng / đầu người</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <TrendingUp size={13} style={{ color: 'var(--accent-warning)' }} />
              <span>Tổng GRDP {selectedRegion ? `(${selectedRegion})` : 'Khu Vực'}</span>
            </div>
            <div className="stat-value">
              {(Number(summary.total_gdp_billion_vnd || 0) / 1000000).toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>tr. tỷ</span>
            </div>
            <div className="stat-sub">VNĐ / năm</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              <Smartphone size={13} style={{ color: 'var(--accent-purple)' }} />
              <span>Chỉ Số TMĐT & Số Hóa</span>
            </div>
            <div className="stat-value">
              {summary.avg_ecommerce_index} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>EBI</span>
            </div>
            <div className="stat-sub">
              Smartphone: <strong style={{ color: 'var(--accent-purple)' }}>{summary.avg_smartphone_penetration_pct}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="layer-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="layer-group-title" style={{ margin: 0 }}>
            <Award size={14} style={{ color: 'var(--brand-primary)' }} />
            <span>Top Thị Trường {selectedRegion ? `(${selectedRegion})` : 'Dẫn Đầu'}</span>
          </div>
          <select
            className="metric-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.74rem' }}
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="market_score">Điểm Tiềm Năng</option>
            <option value="population">Dân Số</option>
            <option value="gdp_billion_vnd">GRDP</option>
            <option value="per_capita_income_million_vnd">Thu Nhập</option>
            <option value="ecommerce_index">Chỉ Số TMĐT</option>
          </select>
        </div>

        <div style={{ height: 210, width: '100%', marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 10, left: -22, bottom: 25 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontFamily: 'var(--font-sans)' }}
                interval={0}
                angle={-32}
                textAnchor="end"
              />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10, fontFamily: 'var(--font-mono)' }} />
              <Tooltip
                cursor={{ fill: 'var(--bg-surface-hover)' }}
                contentStyle={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <Bar dataKey="val" fill="var(--brand-primary)" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#f59e0b' : index === 1 ? '#3b82f6' : '#60a5fa'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="layer-group">
        <div className="layer-group-title">
          <span>Bảng Xếp Hạng Chi Tiết</span>
        </div>
        <table className="ranking-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>Hạng</th>
              <th>Địa Phương</th>
              <th>Vùng</th>
              <th style={{ textAlign: 'right' }}>Giá Trị</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r) => (
              <tr key={`${r.province_code}-${r.rank}`} onClick={() => onSelectProvince(r.province_code)}>
                <td>
                  <span className={`rank-badge ${r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : ''}`}>
                    {r.rank}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{r.name}</span>
                    <ArrowUpRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>{r.region}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {metric === 'market_score' && `${r.market_score}`}
                  {metric === 'population' && `${(r.population / 1000000).toFixed(2)}M`}
                  {metric === 'gdp_billion_vnd' && `${(r.gdp_billion_vnd / 1000).toFixed(0)}k tỷ`}
                  {metric === 'per_capita_income_million_vnd' && `${r.per_capita_income_million_vnd} tr`}
                  {metric === 'ecommerce_index' && `${r.ecommerce_index}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
