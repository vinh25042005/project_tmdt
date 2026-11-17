import React from 'react';
import { Layers, Map, Filter, RotateCcw } from 'lucide-react';
import { METRIC_CONFIG } from '../Map/MapView';

export default function LayerControl({
  selectedMetric,
  onMetricChange,
  activeLayers,
  onToggleLayer,
  selectedRegion,
  onRegionChange,
  regions = []
}) {
  return (
    <div>
      {/* Metric Selection */}
      <div className="layer-group">
        <div className="layer-group-title">
          <Map size={14} color="#00e5ff" />
          <span>Lớp Trực Quan Hóa (Choropleth GIS)</span>
        </div>
        <select
          className="metric-select"
          style={{ width: '100%', marginBottom: 14 }}
          value={selectedMetric}
          onChange={(e) => onMetricChange(e.target.value)}
        >
          {Object.entries(METRIC_CONFIG).map(([key, conf]) => (
            <option key={key} value={key}>
              {conf.label} ({conf.unit})
            </option>
          ))}
        </select>

        {/* Region Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Filter size={12} color="#94a3b8" />
            <span>Phạm Vi Vùng Kinh Tế:</span>
          </div>
          {selectedRegion && (
            <button
              onClick={() => onRegionChange(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00e5ff',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: 0
              }}
            >
              <RotateCcw size={11} />
              <span>Toàn quốc</span>
            </button>
          )}
        </div>
        <select
          className="metric-select"
          style={{
            borderColor: selectedRegion ? 'rgba(0, 229, 255, 0.4)' : undefined,
            background: selectedRegion ? 'rgba(0, 229, 255, 0.06)' : undefined
          }}
          value={selectedRegion || ''}
          onChange={(e) => onRegionChange(e.target.value || null)}
        >
          <option value="">Toàn Quốc (63 Tỉnh / Thành phố)</option>
          {regions.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region} ({r.province_count} tỉnh thành)
            </option>
          ))}
        </select>
      </div>

      {/* Administrative Boundary Layers */}
      <div className="layer-group">
        <div className="layer-group-title">
          <Layers size={14} color="#00e5ff" />
          <span>Ranh Giới Không Gian Đa Cấp</span>
        </div>

        <div className="layer-toggle-item">
          <span className="layer-toggle-label">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px rgba(0,229,255,0.6)' }} />
            <span>Tỉnh / Thành Phố</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>(63 đơn vị)</span>
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={activeLayers.provinces}
              onChange={() => onToggleLayer('provinces')}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="layer-toggle-item">
          <span className="layer-toggle-label">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} />
            <span>Quận / Huyện</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>(708 đơn vị)</span>
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={activeLayers.districts}
              onChange={() => onToggleLayer('districts')}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="layer-toggle-item">
          <span className="layer-toggle-label">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
            <span>Xã / Phường / Thị Trấn</span>
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={activeLayers.wards}
              onChange={() => onToggleLayer('wards')}
            />
            <span className="slider" />
          </label>
        </div>
      </div>
    </div>
  );
}
