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
          <Map size={14} style={{ color: 'var(--brand-primary)' }} />
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
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Filter size={12} style={{ color: 'var(--text-secondary)' }} />
            <span>Phạm Vi Vùng Kinh Tế:</span>
          </div>
          {selectedRegion && (
            <button
              onClick={() => onRegionChange(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--brand-primary)',
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
            borderColor: selectedRegion ? 'var(--brand-border)' : undefined,
            background: selectedRegion ? 'var(--brand-light)' : undefined
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
          <Layers size={14} style={{ color: 'var(--brand-primary)' }} />
          <span>Ranh Giới Không Gian Đa Cấp</span>
        </div>

        <div className="layer-toggle-item">
          <span className="layer-toggle-label">
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--brand-primary)' }} />
            <span>Tỉnh / Thành Phố</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>(63 đơn vị)</span>
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
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-warning)' }} />
            <span>Quận / Huyện</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>(708 đơn vị)</span>
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
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-purple)' }} />
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
