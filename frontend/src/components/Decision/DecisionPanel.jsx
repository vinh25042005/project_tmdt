import React, { useState, useEffect } from 'react';
import { Target, Sliders, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { api } from '../../api/client';

export default function DecisionPanel({ onSelectProvince, selectedRegion = null }) {
  const [weights, setWeights] = useState({
    population: 0.25,
    income: 0.25,
    ecommerce: 0.30,
    urbanization: 0.20
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState('ecommerce'); // 'ecommerce', 'fmcg', 'luxury'

  useEffect(() => {
    fetchRecommendations();
  }, [weights, selectedRegion]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations(weights, selectedRegion, 10);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error('Decision load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (type) => {
    setPreset(type);
    if (type === 'ecommerce') {
      setWeights({ population: 0.20, income: 0.25, ecommerce: 0.40, urbanization: 0.15 });
    } else if (type === 'fmcg') {
      setWeights({ population: 0.45, income: 0.20, ecommerce: 0.15, urbanization: 0.20 });
    } else if (type === 'luxury') {
      setWeights({ population: 0.15, income: 0.50, ecommerce: 0.20, urbanization: 0.15 });
    }
  };

  const handleSliderChange = (key, val) => {
    setPreset('custom');
    setWeights((prev) => ({
      ...prev,
      [key]: parseFloat(val)
    }));
  };

  return (
    <div>
      {/* Header and Explanation */}
      <div className="layer-group">
        <div className="layer-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={14} /> Công Cụ Hỗ Trợ Ra Quyết Định (MCDA)
        </div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
          Động cơ phân tích đa tiêu chí (Multi-Criteria Decision Analysis) giúp doanh nghiệp chọn thị trường tối ưu dựa trên chiến lược kinh doanh riêng.
        </p>

        {/* Business Presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button
            className={`tab-btn ${preset === 'ecommerce' ? 'active' : ''}`}
            style={{ borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem' }}
            onClick={() => applyPreset('ecommerce')}
          >
            🛒 TMĐT / Online
          </button>
          <button
            className={`tab-btn ${preset === 'fmcg' ? 'active' : ''}`}
            style={{ borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem' }}
            onClick={() => applyPreset('fmcg')}
          >
            📦 Tiêu Dùng FMCG
          </button>
          <button
            className={`tab-btn ${preset === 'luxury' ? 'active' : ''}`}
            style={{ borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem' }}
            onClick={() => applyPreset('luxury')}
          >
            💎 Phân Khúc Cao Cấp
          </button>
        </div>

        {/* Weight Sliders */}
        <div className="weight-slider-item">
          <div className="weight-header">
            <span>Dân Số (Quy mô khách hàng)</span>
            <strong>{Math.round(weights.population * 100)}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.population}
            onChange={(e) => handleSliderChange('population', e.target.value)}
            className="weight-slider"
          />
        </div>

        <div className="weight-slider-item">
          <div className="weight-header">
            <span>Thu Nhập & Sức Mua</span>
            <strong>{Math.round(weights.income * 100)}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.income}
            onChange={(e) => handleSliderChange('income', e.target.value)}
            className="weight-slider"
          />
        </div>

        <div className="weight-slider-item">
          <div className="weight-header">
            <span>Độ Sẵn Sàng TMĐT & Số Hóa</span>
            <strong>{Math.round(weights.ecommerce * 100)}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.ecommerce}
            onChange={(e) => handleSliderChange('ecommerce', e.target.value)}
            className="weight-slider"
          />
        </div>

        <div className="weight-slider-item">
          <div className="weight-header">
            <span>Đô Thị Hóa & Hạ Tầng Giao Vận</span>
            <strong>{Math.round(weights.urbanization * 100)}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.urbanization}
            onChange={(e) => handleSliderChange('urbanization', e.target.value)}
            className="weight-slider"
          />
        </div>
      </div>

      {/* Target Market Recommendations */}
      <div className="layer-group">
        <div className="layer-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color="#f59e0b" /> Thị Trường Đề Xuất Ưu Tiên {selectedRegion ? `(${selectedRegion})` : ''}
        </div>

        {recommendations.map((item, idx) => (
          <div
            key={`${item.province_code}-${idx}`}
            className="recom-card"
            onClick={() => onSelectProvince(item.province_code)}
          >
            <div className="recom-header">
              <span className="recom-name">
                #{idx + 1} {item.name}
              </span>
              <span className="recom-score">{item.custom_score} đ</span>
            </div>

            <span
              className="recom-tier"
              style={{
                backgroundColor: `${item.tier_color}22`,
                color: item.tier_color,
                border: `1px solid ${item.tier_color}55`
              }}
            >
              {item.market_tier}
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: 6 }}>
              <span>Dân số: {(item.population / 1000000).toFixed(1)}M</span>
              <span>Thu nhập: {item.per_capita_income_million_vnd} tr</span>
              <span>TMĐT: {item.ecommerce_index}</span>
            </div>

            <div className="recom-strategy">{item.strategy}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
