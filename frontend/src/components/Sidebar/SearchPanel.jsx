import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, MapPin, Building2, Home, X } from 'lucide-react';
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
    }, 220);

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
    if (type === 'province') return <Building2 size={15} style={{ color: 'var(--brand-primary)' }} />;
    if (type === 'district') return <MapPin size={15} style={{ color: 'var(--accent-warning)' }} />;
    return <Home size={15} style={{ color: 'var(--accent-success)' }} />;
  };

  const getTypeLabel = (type) => {
    if (type === 'province') return 'Tỉnh/TP';
    if (type === 'district') return 'Quận/Huyện';
    return 'Xã/Phường';
  };

  return (
    <div className="search-container">
      <div className="search-input-wrap">
        <SearchIcon size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Tìm địa bàn, tỉnh, huyện, tọa độ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query ? (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: 12,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span
            style={{
              position: 'absolute',
              right: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '1px 5px',
              pointerEvents: 'none'
            }}
          >
            /
          </span>
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                    {item.market_score} đ
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
