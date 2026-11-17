import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, Smartphone, Award } from 'lucide-react';
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
      {/* National KPI Cards */}
      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} color="#38bdf8" /> Dân Số {selectedRegion ? `(${selectedRegion})` : 'Toàn Quốc'}
            </div>
            <div className="stat-value">
              {Number(summary.total_population || 0).toLocaleString()}
            </div>
            <div className="stat-sub">Đô thị: {summary.avg_urbanization_pct}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <DollarSign size={12} color="#22c55e" /> Thu Nhập Bình Quân
            </div>
            <div className="stat-value">
              {summary.avg_income_million_vnd} tr.đ
            </div>
            <div className="stat-sub">Mỗi người / tháng</div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} color="#f59e0b" /> Tổng GRDP {selectedRegion ? `(${selectedRegion})` : '63 Tỉnh'}
            </div>
            <div className="stat-value">
              {(Number(summary.total_gdp_billion_vnd || 0) / 1000000).toFixed(1)} triệu tỷ
            </div>
            <div className="stat-sub">VNĐ / năm</div>
          </div>

          <div className="stat-card">
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Smartphone size={12} color="#a855f7" /> Kết Nối Số & TMĐT
            </div>
            <div className="stat-value">
              {summary.avg_ecommerce_index} EBI
            </div>
            <div className="stat-sub">Smartphone: {summary.avg_smartphone_penetration_pct}%</div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="layer-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="layer-group-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} /> Top Thị Trường {selectedRegion ? `(${selectedRegion})` : ''}
          </div>
          <select
            className="metric-select"
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

        <div style={{ height: 200, width: '100%', marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                interval={0}
                angle={-30}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#fff' }}
              />
              <Bar dataKey="val" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#38bdf8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="layer-group">
        <div className="layer-group-title">Bảng Xếp Hạng Chi Tiết</div>
        <table className="ranking-table">
          <thead>
            <tr>
              <th style={{ width: 35 }}>Hạng</th>
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
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{r.region}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
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
