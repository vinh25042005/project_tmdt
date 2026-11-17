import React, { useState, useEffect } from 'react';
import { Map, BarChart2, Compass, Layers, ArrowRightLeft } from 'lucide-react';
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
      {/* Left Sidebar */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div>
            <div className="brand-title">
              <span>🇻🇳 VN-MarketMap</span>
              <span className="brand-badge">GIS Platform</span>
            </div>
            <div className="brand-sub">
              Hệ thống Thấu Hiểu Thị Trường & Khách Hàng Việt Nam
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ padding: '14px 20px 0 20px' }}>
          <SearchPanel onSelectLocation={handleSelectLocation} />
        </div>

        {/* Navigation Tabs */}
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            <Layers size={16} />
            <span>Bản Đồ & Lớp</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} />
            <span>Thống Kê Thị Trường</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            <Compass size={16} />
            <span>Hỗ Trợ Ra Quyết Định</span>
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
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
            />
          )}

          {activeTab === 'decision' && (
            <DecisionPanel
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
            />
          )}
        </div>

        {/* Bottom Bar: Compare shortcut */}
        {compareCodes.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Đang chọn: <strong>{compareCodes.length} tỉnh</strong>
            </span>
            <button
              onClick={() => setShowComparison(true)}
              style={{
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ArrowRightLeft size={14} /> Mở So Sánh
            </button>
          </div>
        )}
      </aside>

      {/* Main Map View */}
      <main className="map-container">
        {/* Floating Quick Metric Switcher */}
        <div className="map-top-bar">
          <div className="metric-selector-card">
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Chỉ số hiển thị:</span>
            <select
              className="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {Object.entries(METRIC_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <MapErrorBoundary>
          <MapView
            selectedMetric={selectedMetric}
            activeLayers={activeLayers}
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
