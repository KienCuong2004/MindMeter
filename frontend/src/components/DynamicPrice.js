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
    // Luôn hiển thị giá USD thay vì VND
    const displayPrice = `$${planData.usd}`;

    return (
      <div className={className}>
        <span>{displayPrice}</span>
        {/* Không hiển thị "(ước tính)" nữa vì đã chuyển sang USD */}
      </div>
    );
  }

  // Fallback về giá cố định
  return <span className={className}>{fallbackPrice}</span>;
};

export default DynamicPrice;
