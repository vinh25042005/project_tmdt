import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BarChart2, 
  Compass, 
  ArrowRightLeft, 
  Sun, 
  Moon, 
  MapPin
} from 'lucide-react';
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
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
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
      const updated = [...compareCodes, code].slice(-3);
      setCompareCodes(updated);
      setShowComparison(true);
    } else {
      setShowComparison(true);
    }
  };

  return (
    <div className="app-container">
      {/* Docked Left Command Sidebar */}
      <aside className="sidebar">
        {/* Brand Header with Theme Switcher */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-logo-icon">
              <MapPin size={18} />
            </div>
            <div>
              <div className="brand-title">
                <span>VN-MarketMap</span>
                <span className="brand-badge">GIS 2.0</span>
              </div>
              <div className="brand-sub">Hệ thống Thấu Hiểu Thị Trường & Bán Lẻ</div>
            </div>
          </div>

          <button 
            className="theme-switch-btn" 
            onClick={toggleTheme} 
            title={theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        {/* Global Search Bar */}
        <div style={{ padding: '14px 16px 0 16px' }}>
          <SearchPanel onSelectLocation={handleSelectLocation} />
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            <Layers size={16} />
            <span>Lớp Bản Đồ</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} />
            <span>Phân Tích</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            <Compass size={16} />
            <span>Quyết Định</span>
          </button>
        </div>

        {/* Dynamic Sidebar Content */}
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

        {/* Bottom Bar: Compare Shortcut */}
        {compareCodes.length > 0 && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Đã ghim: <strong style={{ color: 'var(--brand-primary)' }}>{compareCodes.length} tỉnh/thành</strong>
            </span>
            <button
              onClick={() => setShowComparison(true)}
              style={{
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ArrowRightLeft size={13} />
              <span>Xem So Sánh</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Map Viewport */}
      <main className="map-container">
        {/* Floating Quick Metric Switcher & Region Filter Badge */}
        <div className="map-top-bar">
          <div className="metric-selector-card">
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Chỉ số:</span>
            <select
              className="metric-select"
              style={{ padding: '5px 28px 5px 10px', fontSize: '0.78rem', width: 'auto' }}
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              {Object.entries(METRIC_CONFIG).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div className="metric-selector-card" style={{ borderColor: 'var(--brand-border)' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Vùng:</span>
              <strong style={{ fontSize: '0.8rem', color: 'var(--brand-primary)' }}>{selectedRegion}</strong>
              <button
                onClick={() => setSelectedRegion(null)}
                title="Bỏ lọc vùng kinh tế"
                style={{
                  background: 'var(--bg-surface-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  color: 'var(--text-secondary)',
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
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
            theme={theme}
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
