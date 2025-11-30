// Currency Service để quản lý tỷ giá và giá VND
import logger from "../utils/logger";

class CurrencyService {
  constructor() {
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000, // 5 phút
    };
  }

  // Kiểm tra cache có còn hiệu lực không
  isCacheValid() {
    if (!this.cache.data || !this.cache.timestamp) {
      return false;
    }
    return Date.now() - this.cache.timestamp < this.cache.ttl;
  }

  // Lấy giá VND từ API
  async getPricingVnd() {
    // Kiểm tra cache trước
    if (this.isCacheValid()) {
      return this.cache.data;
    }

    try {
      const response = await fetch("/api/currency/pricing-vnd");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Lưu vào cache
      this.cache.data = data;
      this.cache.timestamp = Date.now();

      return data;
    } catch (error) {
      logger.error("Error fetching VND pricing:", error);

      // Trả về fallback data nếu có cache cũ
      if (this.cache.data) {
        return this.cache.data;
      }

      // Fallback data mặc định
      return {
        free: { usd: 0.0, vnd: 0, vndFormatted: "0đ" },
        plus: { usd: 3.99, vnd: 109604, vndFormatted: "109.604đ" },
        pro: { usd: 9.99, vnd: 274422, vndFormatted: "274.422đ" },
        rate: 27469.67,
        fallback: true,
      };
    }
  }

  // Lấy tỷ giá VND
  async getVndRate() {
    try {
      const response = await fetch("/api/currency/vnd-rate");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error("Error fetching VND rate:", error);
      return {
        usdToVnd: 27469.67,
        fallback: true,
      };
    }
  }

  // Format số tiền VND
  formatVnd(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Làm mới cache
  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }
}

// Export singleton instance
export default new CurrencyService();
