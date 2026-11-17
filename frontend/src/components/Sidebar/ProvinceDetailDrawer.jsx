import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, ShoppingBag, Smartphone, Layers, CheckCircle2, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { api } from '../../api/client';

export default function ProvinceDetailDrawer({ provinceCode, onClose, onCompare }) {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'wards', 'strategy'

  useEffect(() => {
    if (!provinceCode) return;
    loadDetail();
  }, [provinceCode]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [detailRes, profileRes] = await Promise.all([
        api.getProvinceDetail(provinceCode),
        api.getMarketProfile(provinceCode)
      ]);
      setData(detailRes.data);
      setProfile(profileRes.data);
    } catch (err) {
      console.error('Province detail load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!provinceCode) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
              Hồ Sơ Thị Trường Tỉnh / TP
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: 3, letterSpacing: '-0.02em' }}>
              {data ? data.name : 'Đang tải...'}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#00e5ff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{data?.region}</span>
              <span style={{ color: '#475569' }}>•</span>
              <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Mã: {data?.province_code}</span>
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
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Market Score Hero */}
        {data && (
          <div
            style={{
              background: 'var(--bg-surface-card)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              boxShadow: '0 4px 20px rgba(0, 229, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chỉ Số Tiềm Năng Thị Trường
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 800, color: '#00e5ff', lineHeight: 1.1, marginTop: 4 }}>
                {data.market_score} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>
            <button
              onClick={() => onCompare && onCompare(data.province_code)}
              style={{
                background: 'rgba(0, 229, 255, 0.12)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.18s ease'
              }}
            >
              <ArrowRightLeft size={13} />
              <span>Ghim So Sánh</span>
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, background: 'rgba(9, 13, 22, 0.4)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ padding: '6px 4px', fontSize: '0.73rem' }}
          >
            Tổng Quan
          </button>
          <button
            className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategy')}
            style={{ padding: '6px 4px', fontSize: '0.73rem' }}
          >
            Khách Hàng & Nhu Cầu
          </button>
          <button
            className={`tab-btn ${activeTab === 'wards' ? 'active' : ''}`}
            onClick={() => setActiveTab('wards')}
            style={{ padding: '6px 4px', fontSize: '0.73rem' }}
          >
            Xã/Phường ({data?.wards?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && data && (
          <div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Dân số 2024</div>
                <div className="stat-value">{Number(data.population).toLocaleString()}</div>
                <div className="stat-sub">Mật độ: {data.population_density} ng/km²</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Thu nhập b/q người</div>
                <div className="stat-value">{data.per_capita_income_million_vnd} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>tr.đ</span></div>
                <div className="stat-sub">Mỗi tháng / đầu người</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Tổng GRDP</div>
                <div className="stat-value">{(data.gdp_billion_vnd / 1000).toFixed(0)} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>nghìn tỷ</span></div>
                <div className="stat-sub">Bán lẻ: {(data.retail_sales_billion_vnd / 1000).toFixed(0)}k tỷ</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Chỉ số TMĐT (EBI)</div>
                <div className="stat-value">{data.ecommerce_index}</div>
                <div className="stat-sub">Tỷ lệ đô thị: {data.urban_pct}%</div>
              </div>
            </div>

            <div className="layer-group">
              <div className="layer-group-title">
                <Smartphone size={13} color="#00e5ff" />
                <span>Hạ Tầng Kết Nối & Độ Phủ Số</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: 5 }}>
                    <span>Tỷ lệ tiếp cận Internet</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#00e5ff' }}>{data.internet_penetration_pct}%</strong>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${data.internet_penetration_pct}%`, height: '100%', background: '#00e5ff' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', marginBottom: 5 }}>
                    <span>Tỷ lệ sử dụng Smartphone</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#c084fc' }}>{data.smartphone_penetration_pct}%</strong>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${data.smartphone_penetration_pct}%`, height: '100%', background: '#c084fc' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Strategy & Customer Profile */}
        {activeTab === 'strategy' && profile && (
          <div>
            <div className="layer-group">
              <div className="layer-group-title">
                <Users size={13} color="#00e5ff" />
                <span>Phân Khúc Khách Hàng Tiềm Năng</span>
              </div>
              {profile.customer_segments?.map((seg, i) => (
                <div key={i} style={{ padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.82rem' }}>
                    <span>{seg.segment}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#00e5ff' }}>~{seg.estimated_share}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
                    Kênh tiếp cận: <span style={{ color: '#cbd5e1' }}>{seg.channel_preference}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="layer-group">
              <div className="layer-group-title">
                <ShoppingBag size={13} color="#10b981" />
                <span>Ngành Hàng Khuyên Dùng</span>
              </div>
              {profile.suitable_categories?.map((cat, i) => (
                <div key={i} style={{ marginBottom: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                      {cat.category}
                    </span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.14)', color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {cat.potential}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 5, lineHeight: 1.4 }}>
                    {cat.fit_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Wards */}
        {activeTab === 'wards' && data && (
          <div>
            {data.wards?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center', marginTop: 24 }}>
                Không có dữ liệu xã/phường cho địa phương này.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.wards.map((w) => (
                  <div
                    key={w.ward_id || w.name}
                    style={{
                      background: 'var(--bg-surface-card)',
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f8fafc' }}>
                        {w.ward_type} {w.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Diện tích: {w.area_km2} km²
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#00e5ff' }}>
                        {Number(w.population).toLocaleString()} ng
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                        {w.density} ng/km²
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
