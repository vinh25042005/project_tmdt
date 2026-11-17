import React, { useState, useEffect } from 'react';
import { Target, Sliders, ChevronRight, Sparkles, Compass, ShoppingCart, Package, Gem } from 'lucide-react';
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
  const [preset, setPreset] = useState('ecommerce');

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
        <div className="layer-group-title">
          <Target size={14} color="#00e5ff" />
          <span>Hỗ Trợ Ra Quyết Định (MCDA Model)</span>
        </div>
        <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: 14 }}>
          Mô hình đánh giá đa tiêu chí (MCDA) phân bổ trọng số động theo chiến lược mở rộng và định vị phân khúc khách hàng.
        </p>

        {/* Business Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
          <button
            onClick={() => applyPreset('ecommerce')}
            style={{
              padding: '8px 6px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: preset === 'ecommerce' ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: preset === 'ecommerce' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: preset === 'ecommerce' ? '#00e5ff' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.18s ease'
            }}
          >
            <ShoppingCart size={13} />
            <span>TMĐT / Retail</span>
          </button>

          <button
            onClick={() => applyPreset('fmcg')}
            style={{
              padding: '8px 6px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: preset === 'fmcg' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: preset === 'fmcg' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: preset === 'fmcg' ? '#f59e0b' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.18s ease'
            }}
          >
            <Package size={13} />
            <span>Tiêu Dùng FMCG</span>
          </button>

          <button
            onClick={() => applyPreset('luxury')}
            style={{
              padding: '8px 6px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: preset === 'luxury' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: preset === 'luxury' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: preset === 'luxury' ? '#c084fc' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.18s ease'
            }}
          >
            <Gem size={13} />
            <span>Cao Cấp / Hạng Sang</span>
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
        <div className="layer-group-title">
          <Sparkles size={14} color="#f59e0b" />
          <span>Thị Trường Đề Xuất Ưu Tiên {selectedRegion ? `(${selectedRegion})` : ''}</span>
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
                backgroundColor: `${item.tier_color}18`,
                color: item.tier_color,
                border: `1px solid ${item.tier_color}44`
              }}
            >
              {item.market_tier}
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8 }}>
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
