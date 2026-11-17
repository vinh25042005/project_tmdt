import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, ShoppingBag, Smartphone, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hồ Sơ Thị Trường Tỉnh / TP
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
              {data ? data.name : 'Đang tải...'}
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: 2 }}>
              {data?.region}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
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
            <X size={18} />
          </button>
        </div>

        {/* Market Score Hero */}
        {data && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>
                Chỉ Số Tiềm Năng Thị Trường
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                {data.market_score} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
              </div>
            </div>
            <button
              onClick={() => onCompare && onCompare(data.province_code)}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + So Sánh
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ paddingBottom: 8 }}
          >
            Tổng Quan
          </button>
          <button
            className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategy')}
            style={{ paddingBottom: 8 }}
          >
            Khách Hàng & Nhu Cầu
          </button>
          <button
            className={`tab-btn ${activeTab === 'wards' ? 'active' : ''}`}
            onClick={() => setActiveTab('wards')}
            style={{ paddingBottom: 8 }}
          >
            Xã / Phường ({data?.wards?.length || 0})
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
                <div className="stat-value">{data.per_capita_income_million_vnd} tr.đ</div>
                <div className="stat-sub">Mỗi tháng</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Tổng GRDP</div>
                <div className="stat-value">{(data.gdp_billion_vnd / 1000).toFixed(0)}k tỷ</div>
                <div className="stat-sub">Bán lẻ: {(data.retail_sales_billion_vnd / 1000).toFixed(0)}k tỷ</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Chỉ số TMĐT (EBI)</div>
                <div className="stat-value">{data.ecommerce_index}</div>
                <div className="stat-sub">Đô thị: {data.urban_pct}%</div>
              </div>
            </div>

            <div className="layer-group">
              <div className="layer-group-title">Chỉ Số Kết Nối Kỹ Thuật Số</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span>Tỷ lệ tiếp cận Internet</span>
                    <strong>{data.internet_penetration_pct}%</strong>
                  </div>
                  <div style={{ height: 6, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${data.internet_penetration_pct}%`, height: '100%', background: '#38bdf8' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                    <span>Tỷ lệ sử dụng Smartphone</span>
                    <strong>{data.smartphone_penetration_pct}%</strong>
                  </div>
                  <div style={{ height: 6, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${data.smartphone_penetration_pct}%`, height: '100%', background: '#a855f7' }} />
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
              <div className="layer-group-title">Phân Khúc Khách Hàng Tiềm Năng</div>
              {profile.customer_segments?.map((seg, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
                    <span>{seg.segment}</span>
                    <span style={{ color: '#38bdf8' }}>~{seg.estimated_share}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                    Kênh tiếp cận ưu tiên: {seg.channel_preference}
                  </div>
                </div>
              ))}
            </div>

            <div className="layer-group">
              <div className="layer-group-title">Ngành Hàng Khuyên Dùng</div>
              {profile.suitable_categories?.map((cat, i) => (
                <div key={i} style={{ marginBottom: 10, background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                      {cat.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: '#16a34a22', color: '#4ade80', fontWeight: 600 }}>
                      {cat.potential}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                    💡 {cat.fit_reason}
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
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', marginTop: 20 }}>
                Không có dữ liệu xã/phường cho địa phương này.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.wards.map((w) => (
                  <div
                    key={w.ward_id || w.name}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                        {w.ward_type} {w.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Diện tích: {w.area_km2} km²
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>
                        {Number(w.population).toLocaleString()} ng
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
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
