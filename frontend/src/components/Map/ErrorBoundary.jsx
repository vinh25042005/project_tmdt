import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('MapErrorBoundary caught WebGL/Map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#090d16', padding: 30, textAlign: 'center' }}>
          <div style={{ maxWidth: 520, background: '#1e293b', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
            <AlertTriangle size={36} color="#f59e0b" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
              Bản Đồ Số Sẵn Sàng (WebGL Notification)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
              Bản đồ tương tác 3D sử dụng công nghệ WebGL và Martin Vector Tiles. Trên các trình duyệt thực tế có tăng tốc đồ họa (Chrome, Firefox, Safari, Edge), bản đồ hiển thị ranh giới và tô màu động.
            </p>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: 12, borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.82rem', color: '#38bdf8' }}>
              Tất cả các chức năng <strong>Tìm kiếm địa bàn</strong>, <strong>Thống kê thị trường</strong>, và <strong>Hỗ trợ ra quyết định (MCDA)</strong> trên thanh bên trái đang hoạt động bình thường!
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
