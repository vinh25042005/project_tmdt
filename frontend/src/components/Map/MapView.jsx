import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';

export const METRIC_CONFIG = {
  market_score: {
    label: 'Điểm Tiềm Năng Thị Trường',
    unit: 'điểm (0-100)',
    format: (v) => `${v}/100`,
    domain: [25, 40, 55, 75],
    colors: ['#3b82f6', '#06b6d4', '#eab308', '#f97316', '#ef4444']
  },
  population: {
    label: 'Quy Mô Dân Số',
    unit: 'người',
    format: (v) => `${(v / 1000000).toFixed(2)} triệu`,
    domain: [1000000, 2000000, 4000000, 8000000],
    colors: ['#e0f2fe', '#7dd3fc', '#0284c7', '#0369a1', '#075985']
  },
  gdp_billion_vnd: {
    label: 'Tổng Sản Phẩm (GRDP)',
    unit: 'tỷ VNĐ',
    format: (v) => `${(v / 1000).toFixed(0)} nghìn tỷ`,
    domain: [50000, 150000, 300000, 600000],
    colors: ['#fef08a', '#facc15', '#eab308', '#ca8a04', '#a16207']
  },
  per_capita_income_million_vnd: {
    label: 'Thu Nhập Bình Quân',
    unit: 'tr.đ/tháng',
    format: (v) => `${v} tr.đ/tháng`,
    domain: [4.0, 5.0, 6.0, 7.5],
    colors: ['#dcfce7', '#86efac', '#22c55e', '#16a34a', '#15803d']
  },
  ecommerce_index: {
    label: 'Chỉ Số TMĐT (EBI)',
    unit: 'điểm EBI',
    format: (v) => `${v} điểm`,
    domain: [28, 35, 45, 75],
    colors: ['#ede9fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95']
  },
  population_density: {
    label: 'Mật Độ Dân Số',
    unit: 'người/km²',
    format: (v) => `${v.toLocaleString()} ng/km²`,
    domain: [150, 400, 1000, 2500],
    colors: ['#fed7aa', '#fb923c', '#f97316', '#ea580c', '#c2410c']
  }
};

function getColor(val, metric) {
  const conf = METRIC_CONFIG[metric] || METRIC_CONFIG.market_score;
  const num = Number(val) || 0;
  const [d0, d1, d2, d3] = conf.domain;
  const [c0, c1, c2, c3, c4] = conf.colors;

  if (num < d0) return c0;
  if (num < d1) return c1;
  if (num < d2) return c2;
  if (num < d3) return c3;
  return c4;
}

export default function MapView({
  selectedMetric = 'market_score',
  onSelectProvince,
  activeLayers = { provinces: true, districts: false, wards: false },
  focusLocation
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const provincesLayerRef = useRef(null);
  const districtsLayerRef = useRef(null);
  const wardsLayerRef = useRef(null);
  const geojsonCache = useRef({ provinces: null, districts: null, wards: null });
  const [loading, setLoading] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    if (typeof window.L === 'undefined') {
      console.error('Leaflet is not loaded on window.');
      return;
    }

    const L = window.L;
    const map = L.map(mapContainer.current, {
      center: [16.0, 107.5],
      zoom: 6,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark Canvas basemap (Esri Dark Gray Base)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(map);

    mapRef.current = map;

    // Load provinces GeoJSON from backend
    loadProvincesGeoJSON();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const loadProvincesGeoJSON = async () => {
    try {
      setLoading(true);
      const res = await api.getProvincesGeoJSON();
      geojsonCache.current.provinces = res.data;
      renderProvincesLayer(res.data, selectedMetric);
    } catch (err) {
      console.error('Failed to load provinces GeoJSON:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderProvincesLayer = (geojson, metric) => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !geojson) return;

    if (provincesLayerRef.current) {
      map.removeLayer(provincesLayerRef.current);
    }

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const val = feature.properties[metric];
        return {
          fillColor: getColor(val, metric),
          weight: 1.2,
          opacity: 0.8,
          color: '#ffffff',
          fillOpacity: 0.75
        };
      },
      onEachFeature: (feature, l) => {
        const p = feature.properties;
        l.on({
          mouseover: (e) => {
            const tgt = e.target;
            tgt.setStyle({
              weight: 3,
              color: '#38bdf8',
              fillOpacity: 0.9
            });
            tgt.bringToFront();

            tgt.bindTooltip(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #f8fafc; padding: 4px;">
                <div style="font-weight: 700; font-size: 14px; color: #38bdf8; margin-bottom: 2px;">
                  ${p.name || ''}
                </div>
                <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">${p.region || ''}</div>
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                  <span>Điểm Thị Trường:</span>
                  <strong style="color: #ef4444;">${p.market_score || 0} / 100</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                  <span>Dân số:</span>
                  <strong>${Number(p.population || 0).toLocaleString()} ng</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                  <span>Thu nhập b/q:</span>
                  <strong style="color: #4ade80;">${p.per_capita_income_million_vnd || 0} tr.đ/th</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 12px;">
                  <span>Chỉ số TMĐT:</span>
                  <strong style="color: #c084fc;">${p.ecommerce_index || 0}</strong>
                </div>
              </div>
            `, {
              sticky: true,
              className: 'custom-leaflet-tooltip'
            }).openTooltip();
          },
          mouseout: (e) => {
            const tgt = e.target;
            const val = feature.properties[metric];
            tgt.setStyle({
              fillColor: getColor(val, metric),
              weight: 1.2,
              color: '#ffffff',
              fillOpacity: 0.75
            });
          },
          click: () => {
            if (onSelectProvince) {
              onSelectProvince(p.province_code || p.ascii_name);
            }
          }
        });
      }
    });

    if (activeLayers.provinces) {
      layer.addTo(map);
    }
    provincesLayerRef.current = layer;
  };

  // Update styles when metric changes
  useEffect(() => {
    if (geojsonCache.current.provinces) {
      renderProvincesLayer(geojsonCache.current.provinces, selectedMetric);
    }
  }, [selectedMetric]);

  // Handle Layer toggles (provinces, districts, wards)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;

    // 1. Provinces
    if (provincesLayerRef.current) {
      if (activeLayers.provinces) {
        if (!map.hasLayer(provincesLayerRef.current)) provincesLayerRef.current.addTo(map);
      } else {
        if (map.hasLayer(provincesLayerRef.current)) map.removeLayer(provincesLayerRef.current);
      }
    }

    // 2. Districts
    if (activeLayers.districts) {
      if (!geojsonCache.current.districts) {
        api.getDistrictsGeoJSON().then((res) => {
          geojsonCache.current.districts = res.data;
          const dLayer = window.L.geoJSON(res.data, {
            style: {
              color: '#94a3b8',
              weight: 1,
              dashArray: '3, 3',
              fillOpacity: 0.1,
              fillColor: '#64748b'
            },
            onEachFeature: (feat, l) => {
              l.bindTooltip(feat.properties.name || '', { sticky: true });
            }
          });
          districtsLayerRef.current = dLayer;
          if (activeLayers.districts) dLayer.addTo(map);
        });
      } else if (districtsLayerRef.current && !map.hasLayer(districtsLayerRef.current)) {
        districtsLayerRef.current.addTo(map);
      }
    } else if (districtsLayerRef.current && map.hasLayer(districtsLayerRef.current)) {
      map.removeLayer(districtsLayerRef.current);
    }

    // 3. Wards
    if (activeLayers.wards) {
      if (!geojsonCache.current.wards) {
        api.getWardsGeoJSON().then((res) => {
          geojsonCache.current.wards = res.data;
          const wLayer = window.L.geoJSON(res.data, {
            style: {
              color: '#a855f7',
              weight: 0.8,
              fillOpacity: 0.35,
              fillColor: '#8b5cf6'
            },
            onEachFeature: (feat, l) => {
              const p = feat.properties;
              l.bindTooltip(`${p.ward_type} ${p.name} (${Number(p.population).toLocaleString()} ng)`, { sticky: true });
            }
          });
          wardsLayerRef.current = wLayer;
          if (activeLayers.wards) wLayer.addTo(map);
        });
      } else if (wardsLayerRef.current && !map.hasLayer(wardsLayerRef.current)) {
        wardsLayerRef.current.addTo(map);
      }
    } else if (wardsLayerRef.current && map.hasLayer(wardsLayerRef.current)) {
      map.removeLayer(wardsLayerRef.current);
    }
  }, [activeLayers]);

  // Handle focus fly-to from search
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusLocation) return;

    const { lon, lat, zoom = 9 } = focusLocation;
    if (lon && lat) {
      map.flyTo([lat, lon], zoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [focusLocation]);

  const currentConf = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.market_score;

  return (
    <div className="map-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Floating Metric Legend */}
      <div className="map-legend">
        <div className="legend-title">{currentConf.label}</div>
        <div className="legend-scale">
          {currentConf.colors.map((c, i) => (
            <div key={i} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </div>
        <div className="legend-labels">
          <span>Thấp</span>
          <span>{currentConf.unit}</span>
          <span>Cao</span>
        </div>
      </div>
    </div>
  );
}
