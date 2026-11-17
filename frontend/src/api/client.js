import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const MARTIN_URL = import.meta.env.VITE_MARTIN_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const api = {
  // Geography & GeoJSON
  getProvinces: (params) => client.get('/api/provinces', { params }),
  getProvinceDetail: (code) => client.get(`/api/provinces/${code}`),
  getProvinceWards: (code) => client.get(`/api/provinces/${code}/wards`),
  getDistricts: (params) => client.get('/api/districts', { params }),
  getRegions: () => client.get('/api/regions'),
  getProvincesGeoJSON: () => client.get('/api/geojson/provinces'),
  getDistrictsGeoJSON: () => client.get('/api/geojson/districts'),
  getWardsGeoJSON: () => client.get('/api/geojson/wards'),

  // Search
  search: (q, limit = 10) => client.get('/api/search', { params: { q, limit } }),
  searchNearby: (lat, lng, radius_km = 50) => client.get('/api/search/nearby', { params: { lat, lng, radius_km } }),

  // Analytics
  getNationalSummary: (region = null) => client.get('/api/analytics/summary', { params: region ? { region } : {} }),
  getRanking: (metric, top = 10, order = 'desc', region = null) => client.get('/api/analytics/ranking', { params: { metric, top, order, ...(region ? { region } : {}) } }),
  compareProvinces: (codes) => client.get('/api/analytics/compare', { params: { codes } }),
  getDistribution: (by = 'region') => client.get('/api/analytics/distribution', { params: { by } }),

  // Decision Support
  getRecommendations: (weights, region = null, top = 10) => client.get('/api/decision/recommendations', {
    params: {
      w_pop: weights.population,
      w_income: weights.income,
      w_ecom: weights.ecommerce,
      w_urban: weights.urbanization,
      ...(region ? { region } : {}),
      top
    }
  }),
  getMarketProfile: (code) => client.get(`/api/decision/market-profile/${code}`)
};

export default client;
