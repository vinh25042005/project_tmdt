# Vietnam Market Intelligence Platform (VN-MarketMap)

Hệ thống phân tích bản đồ số thấu hiểu thị trường và nhu cầu khách hàng Việt Nam .

---

## 🚀 Điểm Nổi Bật

- **Bản đồ số đa tầng**:
  - Cấp Quốc gia 
  - 63 Tỉnh/Thành phố 
  - 708 Quận/Huyện/Thị xã 
  - Hàng nghìn Xã/Phường/Thị trấn
- **Dữ liệu Dân số & Kinh tế tích hợp**:
  - Dân số, diện tích, mật độ dân số, tỷ lệ đô thị hóa
  - Tổng sản phẩm (GRDP), thu nhập bình quân/người/tháng, tổng mức bán lẻ
  - Chỉ số thương mại điện tử (E-commerce Index - EBI), tỷ lệ tiếp cận internet & smartphone
- **Trực quan hóa (Visualization)**:
  - Vector Tile Server hiệu năng cao trực tiếp từ PostGIS
  - Bản đồ Choropleth nhiều chỉ số (Điểm thị trường, Dân số, GRDP, Thu nhập, TMĐT, Mật độ)
  - Tương tác di chuột và bấm chọn xem hồ sơ chi tiết 
- **Tìm kiếm thông minh**:
  - Tìm kiếm tiếng Việt có dấu/không dấu
  - Tự động hoàn thành và bay tới tọa độ trên bản đồ 
  - Tìm kiếm địa phương lân cận theo bán kính GPS 
- **Hỗ trợ ra quyết định **:
  - Thuật toán chấm điểm tiềm năng thị trường 
  - Tùy chỉnh trọng số theo mô hình kinh doanh (TMĐT / FMCG / Hàng cao cấp)
  - Phân tầng thị trường (Tier 1 Trọng điểm, Tier 2 Đang phát triển, Tier 3 Tiềm năng dài hạn)
  - Gợi ý chiến lược mở rộng và ngành hàng phù hợp

---

## 🏗️ Kiến Trúc Hệ Thống 

| Service | Container Name | Port | Công nghệ | Nhiệm vụ |
|---|---|---|---|---|
| **Database** | `vn_gis_db` | `5434` (mapped) | PostGIS 16 | Spatial database, lưu trữ ranh giới & dữ liệu thống kê |
| **Tile Server** | `vn_gis_martin` | `3000` | Martin (MapLibre) | Vector tile server MVT auto-discover từ PostGIS |
| **Backend API**| `vn_gis_backend` | `8000` | FastAPI (Python 3.12) | REST API cho search, analytics, decision engine |
| **Frontend** | `vn_gis_frontend` | `5173` | React 18 + MapLibre GL | Giao diện bản đồ số tương tác & Dashboard |
| **DB Admin** | `vn_gis_pgadmin` | `5050` | pgAdmin 4 | Quản lý CSDL trực quan |

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh

### Yêu cầu
- Đã cài đặt [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### chạy docker compose:
```bash
docker compose up --build -d
```

### Các đường link truy cập:
- **Giao diện Bản đồ & Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Tài liệu API (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Martin Tile Server UI**: [http://localhost:3000](http://localhost:3000)
- **pgAdmin 4 (Quản trị DB)**: [http://localhost:5050](http://localhost:5050)
  - Tài khoản: `admin@admin.com`
  - Mật khẩu: `admin`

---

## 🔄 Cập Nhật / Tùy Chỉnh Dữ Liệu

1. Dữ liệu ranh giới và dân số/kinh tế mẫu được lưu tại thư mục `db/data/`.
2. Khi muốn thay đổi số liệu dân số hoặc kinh tế, chỉnh sửa file `db/data/provinces_demographics.csv` hoặc `db/data/provinces_economics.csv`.
3. Chạy lệnh tái sinh SQL:
   ```bash
   python3 db/generate_seed_sql.py
   ```
4. Nạp lại vào database:
   ```bash
   docker compose exec db psql -U docker -d gis -f /docker-entrypoint-initdb.d/02-seed-data.sql
   ```

---

## 🛠️ Dừng hệ thống
```bash
docker compose down
```
Để xóa cả dữ liệu database nếu muốn khởi tạo lại từ đầu:
```bash
docker compose down -v
```
