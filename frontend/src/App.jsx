import React, { useState, useEffect } from 'react';
import { Map, BarChart2, Compass, Layers, ArrowRightLeft, Radio } from 'lucide-react';
import MapView, { METRIC_CONFIG } from './components/Map/MapView';
import MapErrorBoundary from './components/Map/ErrorBoundary';
import SearchPanel from './components/Sidebar/SearchPanel';
import LayerControl from './components/Sidebar/LayerControl';
import DashboardPanel from './components/Analytics/DashboardPanel';
import DecisionPanel from './components/Decision/DecisionPanel';
import ProvinceDetailDrawer from './components/Sidebar/ProvinceDetailDrawer';
import ComparisonModal from './components/Analytics/ComparisonModal';
import { api } from './api/client';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('layers'); // 'layers', 'analytics', 'decision'
  const [selectedMetric, setSelectedMetric] = useState('market_score');
  const [activeLayers, setActiveLayers] = useState({
    provinces: true,
    districts: false,
    wards: false
  });
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [compareCodes, setCompareCodes] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const res = await api.getRegions();
      setRegions(res.data || []);
    } catch (err) {
      console.error('Failed to load regions:', err);
    }
  };

  const handleToggleLayer = (layerName) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const handleSelectLocation = (item) => {
    if (item.lon && item.lat) {
      setFocusLocation({
        lon: item.lon,
        lat: item.lat,
        zoom: item.type === 'province' ? 8 : item.type === 'district' ? 11 : 13
      });
    }
    if (item.type === 'province') {
      setSelectedProvinceCode(item.code);
      if (selectedRegion && item.region && item.region !== selectedRegion) {
        setSelectedRegion(null);
      }
    }
  };

  const handleAddCompare = (code) => {
    if (!compareCodes.includes(code)) {
      const updated = [...compareCodes, code].slice(-3); // max 3 provinces
      setCompareCodes(updated);
      setShowComparison(true);
    } else {
      setShowComparison(true);
    }
  };

  return (
    <div className="app-container">
      {/* Left Command Sidebar */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div>
            <div className="brand-title">
              <span>VN-MarketMap</span>
              <span className="brand-badge">GIS v2.4</span>
            </div>
            <div className="brand-sub">
              Hệ thống Thấu Hiểu Thị Trường & Không Gian Bán Lẻ
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
            <span>ONLINE</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ padding: '14px 18px 0 18px' }}>
          <SearchPanel onSelectLocation={handleSelectLocation} />
        </div>

        {/* Navigation Tabs */}
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            <Layers size={15} />
            <span>Lớp Bản Đồ</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={15} />
            <span>Phân Tích</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            <Compass size={15} />
            <span>Quyết Định</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="sidebar-content">
          {activeTab === 'layers' && (
            <LayerControl
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
              activeLayers={activeLayers}
              onToggleLayer={handleToggleLayer}
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
              regions={regions}
            />
          )}

          {activeTab === 'analytics' && (
            <DashboardPanel
              selectedRegion={selectedRegion}
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
            />
          )}

          {activeTab === 'decision' && (
            <DecisionPanel
              selectedRegion={selectedRegion}
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
            />
          )}
        </div>

        {/* Bottom Bar: Compare shortcut */}
        {compareCodes.length > 0 && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Đã ghim: <strong style={{ color: '#00e5ff' }}>{compareCodes.length} tỉnh/thành</strong>
            </span>
            <button
              onClick={() => setShowComparison(true)}
              style={{
                background: '#00e5ff',
                color: '#090d16',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: '0 0 12px rgba(0,229,255,0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowRightLeft size={13} />
              <span>So Sánh Chi Tiết</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Map Canvas */}
      <main className="map-container">
        {/* Floating Quick Metric Switcher & Region Filter Badge */}
        <div className="map-top-bar">
          <div className="metric-selector-card">
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Chỉ số:</span>
            <select
              className="metric-select"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {Object.entries(METRIC_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div
              className="metric-selector-card"
              style={{
                borderColor: 'rgba(0, 229, 255, 0.4)',
                background: 'rgba(13, 19, 33, 0.95)'
              }}
            >
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Vùng:</span>
              <strong style={{ fontSize: '0.8rem', color: '#00e5ff' }}>{selectedRegion}</strong>
              <button
                onClick={() => setSelectedRegion(null)}
                title="Bỏ lọc vùng kinh tế"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#cbd5e1',
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  lineHeight: 1,
                  marginLeft: 4
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <MapErrorBoundary>
          <MapView
            selectedMetric={selectedMetric}
            activeLayers={activeLayers}
            selectedRegion={selectedRegion}
            focusLocation={focusLocation}
            onSelectProvince={(code) => setSelectedProvinceCode(code)}
          />
        </MapErrorBoundary>
      </main>

      {/* Province Dossier Drawer */}
      {selectedProvinceCode && (
        <ProvinceDetailDrawer
          provinceCode={selectedProvinceCode}
          onClose={() => setSelectedProvinceCode(null)}
          onCompare={handleAddCompare}
        />
      )}

      {/* Side-by-side Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          provinceCodes={compareCodes}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
