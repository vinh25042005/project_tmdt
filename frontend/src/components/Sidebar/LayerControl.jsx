import React from 'react';
import { Layers, Map, Eye } from 'lucide-react';
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
        <div className="layer-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Map size={14} /> Lớp Trực Quan Hóa (Choropleth)
        </div>
        <select
          className="metric-select"
          style={{ width: '100%', marginBottom: 12 }}
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
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Lọc Theo Vùng Kinh Tế:
          </div>
          {selectedRegion && (
            <button
              onClick={() => onRegionChange(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Xóa lọc
            </button>
          )}
        </div>
        <select
          className="metric-select"
          style={{
            width: '100%',
            borderColor: selectedRegion ? '#38bdf8' : undefined,
            backgroundColor: selectedRegion ? 'rgba(56, 189, 248, 0.08)' : undefined
          }}
          value={selectedRegion || ''}
          onChange={(e) => onRegionChange(e.target.value || null)}
        >
          <option value="">Toàn Quốc (63 Tỉnh/Thành)</option>
          {regions.map((r) => (
            <option key={r.region} value={r.region}>
              {r.region} ({r.province_count} tỉnh)
            </option>
          ))}
        </select>
      </div>

      {/* Administrative Boundary Layers */}
      <div className="layer-group">
        <div className="layer-group-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={14} /> Các Lớp Ranh Giới Hành Chính
        </div>

        <div className="layer-toggle-item">
          <span className="layer-toggle-label">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} />
            Tỉnh / Thành Phố (63 tỉnh)
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
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} />
            Quận / Huyện (708 quận/huyện)
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
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c084fc' }} />
            Xã / Phường / Thị Trấn
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
