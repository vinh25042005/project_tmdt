import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, MapPin, Building, Home, X } from 'lucide-react';
import { api } from '../../api/client';

export default function SearchPanel({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim(), 8);
        setResults(res.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (item) => {
    setIsOpen(false);
    if (onSelectLocation) {
      onSelectLocation(item);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getIcon = (type) => {
    if (type === 'province') return <Building size={16} className="text-sky-400" />;
    if (type === 'district') return <MapPin size={16} className="text-amber-400" />;
    return <Home size={16} className="text-emerald-400" />;
  };

  const getTypeLabel = (type) => {
    if (type === 'province') return 'Tỉnh / TP';
    if (type === 'district') return 'Quận / Huyện';
    return 'Xã / Phường';
  };

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <SearchIcon size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Tìm tỉnh, huyện, xã (VD: Hà Nội, Đà Nẵng, Ba Đình...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: 12,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results-list">
          {results.map((item, idx) => (
            <div
              key={`${item.type}-${item.code}-${idx}`}
              className="search-item"
              onClick={() => handleSelect(item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {getIcon(item.type)}
                <div className="search-item-info">
                  <span className="search-item-name">{item.name}</span>
                  <span className="search-item-sub">{item.region}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.market_score > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                    ⭐ {item.market_score}
                  </span>
                )}
                <span className="search-badge">{getTypeLabel(item.type)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
