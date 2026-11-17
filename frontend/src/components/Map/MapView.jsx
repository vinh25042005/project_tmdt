import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';

export const METRIC_CONFIG = {
  market_score: {
    label: 'Điểm Tiềm Năng Thị Trường',
    unit: 'điểm (0-100)',
    format: (v) => `${v}/100`,
    domain: [25, 40, 55, 75],
    // Dải màu đa sắc Radar thời tiết: Xanh lam (Thấp) -> Lục -> Vàng cam -> Đỏ đậm (Cao nhất)
    colors: ['#2563eb', '#10b981', '#f59e0b', '#f97316', '#dc2626']
  },
  population: {
    label: 'Quy Mô Dân Số',
    unit: 'người',
    format: (v) => `${(v / 1000000).toFixed(2)} triệu`,
    domain: [1000000, 2000000, 4000000, 8000000],
    colors: ['#0284c7', '#0d9488', '#eab308', '#ea580c', '#e11d48']
  },
  gdp_billion_vnd: {
    label: 'Tổng Sản Phẩm (GRDP)',
    unit: 'tỷ VNĐ',
    format: (v) => `${(v / 1000).toFixed(0)} nghìn tỷ`,
    domain: [50000, 150000, 300000, 600000],
    colors: ['#3b82f6', '#14b8a6', '#facc15', '#f97316', '#b91c1c']
  },
  per_capita_income_million_vnd: {
    label: 'Thu Nhập Bình Quân',
    unit: 'tr.đ/tháng',
    format: (v) => `${v} tr.đ/tháng`,
    domain: [4.0, 5.0, 6.0, 7.5],
    colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  },
  ecommerce_index: {
    label: 'Chỉ Số TMĐT (EBI)',
    unit: 'điểm EBI',
    format: (v) => `${v} điểm`,
    domain: [28, 35, 45, 75],
    colors: ['#0284c7', '#8b5cf6', '#ec4899', '#f97316', '#dc2626']
  },
  population_density: {
    label: 'Mật Độ Dân Số',
    unit: 'người/km²',
    format: (v) => `${v.toLocaleString()} ng/km²`,
    domain: [150, 400, 1000, 2500],
    colors: ['#38bdf8', '#34d399', '#fbbf24', '#fb923c', '#f43f5e']
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
  selectedRegion = null,
  onSelectProvince,
  activeLayers = { provinces: true, districts: false, wards: false },
  focusLocation,
  theme = 'light'
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const provincesLayerRef = useRef(null);
  const provincesBgLayerRef = useRef(null);
  const districtsLayerRef = useRef(null);
  const wardsLayerRef = useRef(null);
  const geojsonCache = useRef({ provinces: null, districts: null, wards: null });
  const prevRegionRef = useRef(selectedRegion);

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

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const tileUrl = theme === 'dark'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(map);

    if (!map.getPane('provincesPane')) {
      const pPane = map.createPane('provincesPane');
      pPane.style.zIndex = 400;
    }
    if (!map.getPane('districtsPane')) {
      const dPane = map.createPane('districtsPane');
      dPane.style.zIndex = 450;
    }
    if (!map.getPane('wardsPane')) {
      const wPane = map.createPane('wardsPane');
      wPane.style.zIndex = 500;
    }

    mapRef.current = map;
    loadProvincesGeoJSON();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Basemap on theme change
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const tileUrl = theme === 'dark'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    tileLayerRef.current.setUrl(tileUrl);

    if (geojsonCache.current.provinces) {
      renderProvincesLayer(geojsonCache.current.provinces, selectedMetric, selectedRegion);
    }
  }, [theme]);

  const loadProvincesGeoJSON = async () => {
    try {
      const res = await api.getProvincesGeoJSON();
      geojsonCache.current.provinces = res.data;
      renderProvincesLayer(res.data, selectedMetric, selectedRegion);
    } catch (err) {
      console.error('Failed to load provinces GeoJSON:', err);
    }
  };

  const renderProvincesLayer = (geojson, metric, region) => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !geojson) return;

    if (provincesLayerRef.current) {
      map.removeLayer(provincesLayerRef.current);
      provincesLayerRef.current = null;
    }
    if (provincesBgLayerRef.current) {
      map.removeLayer(provincesBgLayerRef.current);
      provincesBgLayerRef.current = null;
    }

    const isDark = theme === 'dark';
    const borderColor = isDark ? '#ffffff' : '#ffffff';
    const bgFill = isDark ? '#1e293b' : '#cbd5e1';

    if (region) {
      const bgLayer = L.geoJSON(geojson, {
        pane: 'provincesPane',
        filter: (feature) => feature.properties.region !== region,
        style: {
          fillColor: bgFill,
          weight: 0.8,
          opacity: 0.5,
          color: borderColor,
          fillOpacity: 0.25
        },
        interactive: false
      });
      bgLayer.addTo(map);
      provincesBgLayerRef.current = bgLayer;
    }

    const layer = L.geoJSON(geojson, {
      pane: 'provincesPane',
      filter: (feature) => (!region ? true : feature.properties.region === region),
      style: (feature) => {
        const val = feature.properties[metric];
        return {
          fillColor: getColor(val, metric),
          weight: 1.5,
          opacity: 0.95,
          color: borderColor,
          fillOpacity: 0.88
        };
      },
      onEachFeature: (feature, l) => {
        const p = feature.properties;
        l.on({
          mouseover: (e) => {
            const tgt = e.target;
            tgt.setStyle({
              weight: 3.5,
              color: '#000000',
              fillOpacity: 1
            });
            tgt.bringToFront();

            tgt.bindTooltip(`
              <div style="font-family: inherit; font-size: 12px; line-height: 1.5; padding: 2px;">
                <div style="font-weight: 800; font-size: 14px; color: ${getColor(p[metric], metric)}; margin-bottom: 2px;">
                  ${p.name || ''}
                </div>
                <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">Vùng: <strong>${p.region || ''}</strong></div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                  <span>Điểm tiềm năng:</span>
                  <strong style="color: #dc2626; font-size: 13px;">${p.market_score || 0} / 100</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                  <span>Quy mô dân số:</span>
                  <strong>${Number(p.population || 0).toLocaleString()} ng</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
                  <span>Thu nhập bình quân:</span>
                  <strong style="color: #10b981;">${p.per_capita_income_million_vnd || 0} tr.đ/th</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 16px;">
                  <span>Chỉ số TMĐT:</span>
                  <strong style="color: #6366f1;">${p.ecommerce_index || 0} EBI</strong>
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
              weight: 1.5,
              color: borderColor,
              fillOpacity: 0.88
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

    if (prevRegionRef.current !== region) {
      if (region && layer.getLayers().length > 0) {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9, animate: true });
        }
      } else if (!region && prevRegionRef.current) {
        map.flyTo([16.0, 107.5], 6, { animate: true, duration: 1 });
      }
      prevRegionRef.current = region;
    }
  };

  const renderDistrictsLayer = (geojson, isProvincesOn, region) => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !geojson) return;

    if (districtsLayerRef.current) {
      map.removeLayer(districtsLayerRef.current);
      districtsLayerRef.current = null;
    }

    const baseStyle = {
      color: '#334155',
      weight: 1.2,
      dashArray: '3, 3',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      opacity: 0.8
    };

    const dLayer = L.geoJSON(geojson, {
      pane: 'districtsPane',
      filter: (feature) => (!region ? true : feature.properties.region === region),
      style: () => baseStyle,
      onEachFeature: (feat, l) => {
        const p = feat.properties;
        l.on({
          mouseover: (e) => {
            const tgt = e.target;
            tgt.setStyle({ weight: 2.2, color: '#f59e0b', fillOpacity: 0.25 });
            tgt.bringToFront();
          },
          mouseout: (e) => {
            e.target.setStyle(baseStyle);
          },
          click: () => {
            if (l.getBounds && l.getBounds().isValid()) {
              map.fitBounds(l.getBounds(), { padding: [50, 50], maxZoom: 12, animate: true });
            }
          }
        });
      }
    });

    if (activeLayers.districts) {
      dLayer.addTo(map);
    }
    districtsLayerRef.current = dLayer;
  };

  const renderWardsLayer = (geojson) => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !geojson) return;

    if (wardsLayerRef.current) {
      map.removeLayer(wardsLayerRef.current);
      wardsLayerRef.current = null;
    }

    const baseStyle = {
      color: '#8b5cf6',
      weight: 0.8,
      fillColor: '#8b5cf6',
      fillOpacity: 0.08,
      opacity: 0.7
    };

    const wLayer = L.geoJSON(geojson, {
      pane: 'wardsPane',
      style: () => baseStyle
    });

    if (activeLayers.wards) {
      wLayer.addTo(map);
    }
    wardsLayerRef.current = wLayer;
  };

  useEffect(() => {
    if (geojsonCache.current.provinces) {
      renderProvincesLayer(geojsonCache.current.provinces, selectedMetric, selectedRegion);
    }
  }, [selectedMetric, selectedRegion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;

    if (provincesLayerRef.current) {
      if (activeLayers.provinces) {
        if (!map.hasLayer(provincesLayerRef.current)) provincesLayerRef.current.addTo(map);
        if (provincesBgLayerRef.current && !map.hasLayer(provincesBgLayerRef.current)) provincesBgLayerRef.current.addTo(map);
      } else {
        if (map.hasLayer(provincesLayerRef.current)) map.removeLayer(provincesLayerRef.current);
        if (provincesBgLayerRef.current && map.hasLayer(provincesBgLayerRef.current)) map.removeLayer(provincesBgLayerRef.current);
      }
    }

    if (activeLayers.districts) {
      if (!geojsonCache.current.districts) {
        api.getDistrictsGeoJSON().then((res) => {
          geojsonCache.current.districts = res.data;
          renderDistrictsLayer(res.data, activeLayers.provinces, selectedRegion);
        });
      } else {
        renderDistrictsLayer(geojsonCache.current.districts, activeLayers.provinces, selectedRegion);
      }
    } else if (districtsLayerRef.current && map.hasLayer(districtsLayerRef.current)) {
      map.removeLayer(districtsLayerRef.current);
    }

    if (activeLayers.wards) {
      if (!geojsonCache.current.wards) {
        api.getWardsGeoJSON().then((res) => {
          geojsonCache.current.wards = res.data;
          renderWardsLayer(res.data);
        });
      } else {
        renderWardsLayer(geojsonCache.current.wards);
      }
    } else if (wardsLayerRef.current && map.hasLayer(wardsLayerRef.current)) {
      map.removeLayer(wardsLayerRef.current);
    }
  }, [activeLayers, selectedRegion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusLocation) return;
    const { lon, lat, zoom = 9 } = focusLocation;
    if (lon && lat) {
      map.flyTo([lat, lon], zoom, { animate: true, duration: 1.2 });
    }
  }, [focusLocation]);

  const currentConf = METRIC_CONFIG[selectedMetric] || METRIC_CONFIG.market_score;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Weather-Radar Style GIS Legend */}
      <div className="radar-legend">
        <div className="radar-legend-title">
          <span>{currentConf.label}</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--brand)' }}>{currentConf.unit}</span>
        </div>
        <div className="radar-gradient-bar">
          {currentConf.colors.map((c, i) => (
            <div key={i} className="radar-gradient-step" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="radar-ticks">
          <span>Thấp (Lam)</span>
          <span>Trung Bình (Lục)</span>
          <span>Khá (Vàng)</span>
          <span>Cao Nhất (Đỏ)</span>
        </div>
      </div>
    </div>
  );
}
