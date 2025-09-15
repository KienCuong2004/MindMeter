import React from "react";
import { FaSync } from "react-icons/fa";

const DynamicPrice = ({
  plan,
  pricingVnd,
  loadingPricing,
  fallbackPrice,
  className = "",
  language = "vi", // Thêm prop language
}) => {
  // Nếu đang loading hoặc chưa có data, hiển thị fallback
  if (loadingPricing || !pricingVnd) {
    return (
      <div className={`${className} flex items-center gap-2`}>
        <span>{fallbackPrice}</span>
        {loadingPricing && (
          <FaSync className="w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>
    );
  }

  // Nếu có data từ API, hiển thị giá động
  const planData = pricingVnd[plan.toLowerCase()];
  if (planData) {
    // Hiển thị giá theo ngôn ngữ
    let displayPrice;
    if (language === "en") {
      // Tiếng Anh: hiển thị giá USD
      displayPrice = `$${planData.usd}`;
    } else {
      // Tiếng Việt: hiển thị giá VND
      displayPrice = planData.vndFormatted;
    }

    return (
      <div className={className}>
        <span>{displayPrice}</span>
        {/* Chỉ hiển thị "(ước tính)" cho tiếng Việt và không phải gói Free */}
        {pricingVnd.fallback &&
          language === "vi" &&
          plan.toLowerCase() !== "free" && (
            <span className="text-xs text-gray-400 ml-1">(ước tính)</span>
          )}
      </div>
    );
  }

  // Fallback về giá cố định
  return <span className={className}>{fallbackPrice}</span>;
};

export default DynamicPrice;
