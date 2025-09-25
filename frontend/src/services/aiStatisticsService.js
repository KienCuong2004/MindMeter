// AI Statistics Service for MindMeter
// Integrates OpenAI GPT for intelligent data analysis and insights

import i18n from "../i18n";

const AI_STATISTICS_CONFIG = {
  model: "gpt-4o-mini", // Cost-effective for analytics
  maxTokens: 1000,
  temperature: 0.3, // Lower temperature for more analytical responses
};

/**
 * Generate AI insights from statistics data
 * @param {Object} statisticsData - Raw statistics from backend
 * @returns {Promise<Object>} AI insights and recommendations
 */
export const generateStatisticsInsights = async (statisticsData) => {
  try {
    const {
      totalTests,
      depressionRatio,
      userCountByRole,
      testCountByLevel,
      recentTrends,
      weeklyGrowth,
    } = statisticsData;

    // Calculate key metrics
    const severePercentage = (
      ((depressionRatio?.severe || 0) / totalTests) *
      100
    ).toFixed(1);
    const moderatePercentage = (
      ((depressionRatio?.moderate || 0) / totalTests) *
      100
    ).toFixed(1);
    const totalSevereModerate =
      (depressionRatio?.severe || 0) + (depressionRatio?.moderate || 0);
    const riskPercentage = ((totalSevereModerate / totalTests) * 100).toFixed(
      1
    );

    const prompt = `
Analyze the following mental health platform statistics and provide actionable insights:

CURRENT DATA:
- Total assessments: ${totalTests}
- Severe depression cases: ${
      depressionRatio?.severe || 0
    } (${severePercentage}%)
- Moderate depression cases: ${
      depressionRatio?.moderate || 0
    } (${moderatePercentage}%)
- Mild cases: ${depressionRatio?.mild || 0}
- No depression: ${depressionRatio?.minimal || 0}
- High-risk users (severe + moderate): ${riskPercentage}%

USER DISTRIBUTION:
- Students: ${userCountByRole?.student || 0}
- Experts: ${userCountByRole?.expert || 0}
- Admins: ${userCountByRole?.admin || 0}

RECENT TRENDS:
${recentTrends ? JSON.stringify(recentTrends) : "No recent trend data"}

As a mental health platform analyst, provide:
1. Key insights (2-3 critical observations)
2. Urgent concerns (if any)
3. Actionable recommendations (3-4 specific actions)
4. Timeline suggestions (when to act)

IMPORTANT: Respond in ${
      i18n.language === "vi" ? "Vietnamese" : "English"
    } language. All content must be in ${
      i18n.language === "vi" ? "Vietnamese" : "English"
    }.
Format: JSON response with insights, alerts, recommendations, and timeline.
Keep responses professional but accessible. Focus on student mental health impact.
`;

    const response = await fetch(
      "http://localhost:8080/api/ai/analyze-statistics",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          prompt,
          model: AI_STATISTICS_CONFIG.model,
          maxTokens: AI_STATISTICS_CONFIG.maxTokens,
          temperature: AI_STATISTICS_CONFIG.temperature,
          statisticsData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate AI insights");
    }

    const aiResponse = await response.json();

    // Parse GPT response and structure it
    try {
      const insights = JSON.parse(aiResponse.content);
      return {
        success: true,
        insights: insights.insights?.keyObservations || insights.insights || [],
        alerts: insights.urgentConcerns || insights.alerts || [],
        recommendations:
          insights.recommendations?.actions || insights.recommendations || [],
        timeline: insights.timeline || {},
        confidence: calculateConfidence(statisticsData),
        generatedAt: new Date().toISOString(),
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        success: true,
        insights: [aiResponse.content],
        alerts: [],
        recommendations: [],
        timeline: {},
        confidence: 75,
        generatedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error("AI Statistics Error:", error);
    return {
      success: false,
      error: error.message,
      fallbackInsights: generateFallbackInsights(statisticsData),
    };
  }
};

/**
 * Generate trend predictions using AI
 * @param {Array} historicalData - Time series data
 * @returns {Promise<Object>} Trend predictions
 */
export const generateTrendPrediction = async (historicalData) => {
  try {
    const recentTrend = calculateTrendDirection(historicalData);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentDay = String(currentDate.getDate()).padStart(2, "0");

    const prompt = `
Analyze mental health assessment trends and predict future patterns:

HISTORICAL DATA (last 30 days):
${historicalData
  .map((day) => `${day.date}: ${day.total} tests (${day.severe} severe)`)
  .join("\n")}

CURRENT TREND: ${recentTrend.direction} (${recentTrend.percentage}% change)

CRITICAL: You MUST respond with a valid JSON object in this exact format:
{
  "predictions": {
    "next_7_days_trend": "trend description",
    "expected_change_percentage": 5,
    "trend_start_date": "${currentYear}-${currentMonth}-${currentDay}",
    "trend_end_date": "2025-10-02",
    "peak_risk_periods": [
      {
        "date": "2025-10-15",
        "reason": "specific reason based on data analysis",
        "priority": "high"
      }
    ]
  }
}

IMPORTANT: 
- All dates must be in ${currentYear}
- peak_risk_periods MUST be an array, even if empty []
- Provide specific dates and reasons based on the historical data
- Respond in ${i18n.language === "vi" ? "Vietnamese" : "English"} language
- Analyze the actual historical data patterns to predict real risk periods
`;

    const response = await fetch(
      "http://localhost:8080/api/ai/predict-trends",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          prompt,
          model: AI_STATISTICS_CONFIG.model,
          historicalData,
        }),
      }
    );

    const aiResponse = await response.json();
    try {
      const result = JSON.parse(aiResponse.content);
      return result;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return generateFallbackPredictions(historicalData);
    }
  } catch (error) {
    console.error("Trend Prediction Error:", error);
    return generateFallbackPredictions(historicalData);
  }
};

/**
 * Generate personalized recommendations based on current statistics
 * @param {Object} currentStats - Current statistics snapshot
 * @returns {Promise<Array>} Array of actionable recommendations
 */
export const generateActionRecommendations = async (currentStats) => {
  try {
    const urgencyLevel = calculateUrgencyLevel(currentStats);

    const prompt = `
As a mental health operations advisor, analyze this data and provide specific action items:

CURRENT SITUATION:
- Risk level: ${urgencyLevel}
- Severe cases: ${currentStats.severe}
- Student-to-expert ratio: ${currentStats.studentCount}:${
      currentStats.expertCount
    }
- Recent growth: ${currentStats.weeklyGrowth}%

Generate 5 specific, actionable recommendations with:
1. Action description
2. Urgency level (High/Medium/Low)
3. Who should execute
4. Deadline
5. Expected impact

Focus on immediate student welfare and operational efficiency.
IMPORTANT: Respond in ${
      i18n.language === "vi" ? "Vietnamese" : "English"
    } language. All content must be in ${
      i18n.language === "vi" ? "Vietnamese" : "English"
    }.
Format as JSON array.
`;

    const response = await fetch(
      "http://localhost:8080/api/ai/generate-recommendations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt, currentStats }),
      }
    );

    const aiResponse = await response.json();
    try {
      const result = JSON.parse(aiResponse.content);
      return result;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return generateFallbackRecommendations(currentStats);
    }
  } catch (error) {
    console.error("Recommendations Error:", error);
    return generateFallbackRecommendations(currentStats);
  }
};

/**
 * Generate executive summary for mental health reports
 * @param {Object} fullData - Complete statistics data
 * @returns {Promise<String>} Executive summary
 */
export const generateExecutiveSummary = async (fullData) => {
  try {
    const prompt = `
Create an executive summary for mental health platform performance:

KEY METRICS:
- Platform users: ${fullData.totalUsers}
- Monthly assessments: ${fullData.monthlyTests}
- Risk cases requiring attention: ${fullData.highRiskCount}
- Expert utilization: ${fullData.expertUtilization}%
- Student satisfaction: ${fullData.satisfaction}%

TRENDS:
- Week-over-week growth: ${fullData.weeklyGrowth}%
- Severe case trend: ${fullData.severeTrend}
- Peak usage hours: ${fullData.peakHours}

Write a professional executive summary (150-200 words) highlighting:
1. Overall platform health
2. Critical areas requiring attention  
3. Key achievements
4. Strategic recommendations

Tone: Professional, data-driven, action-oriented.
`;

    const response = await fetch(
      "http://localhost:8080/api/ai/executive-summary",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ prompt, fullData }),
      }
    );

    const aiResponse = await response.json();
    return aiResponse.content;
  } catch (error) {
    console.error("Executive Summary Error:", error);
    return generateFallbackSummary(fullData);
  }
};

// Helper functions
const calculateConfidence = (data) => {
  const sampleSize = data.totalTests || 0;
  if (sampleSize > 100) return 90;
  if (sampleSize > 50) return 80;
  if (sampleSize > 20) return 70;
  return 60;
};

const calculateTrendDirection = (data) => {
  if (!data || data.length < 2) return { direction: "stable", percentage: 0 };

  const recent = data.slice(-7); // Last 7 days
  const previous = data.slice(-14, -7); // Previous 7 days

  const recentAvg =
    recent.reduce((sum, day) => sum + day.total, 0) / recent.length;
  const previousAvg =
    previous.reduce((sum, day) => sum + day.total, 0) / previous.length;

  const change = ((recentAvg - previousAvg) / previousAvg) * 100;

  return {
    direction:
      change > 5 ? "increasing" : change < -5 ? "decreasing" : "stable",
    percentage: Math.abs(change).toFixed(1),
  };
};

const calculateUrgencyLevel = (stats) => {
  const severeRatio = (stats.severe || 0) / (stats.totalTests || 1);
  if (severeRatio > 0.3) return "High";
  if (severeRatio > 0.15) return "Medium";
  return "Low";
};

// Fallback functions when AI is not available
const generateFallbackInsights = (data) => [
  {
    id: 1,
    message: `${data.totalTests} total assessments completed with ${(
      ((data.severe || 0) / data.totalTests) *
      100
    ).toFixed(1)}% severe cases`,
    confidence: 100,
  },
  {
    id: 2,
    message: `Student-to-expert ratio: ${Math.round(
      (data.studentCount || 0) / (data.expertCount || 1)
    )}:1`,
    confidence: 100,
  },
];

const generateFallbackPredictions = (data) => ({
  predictions: {
    next_7_days_trend: "Trend analysis requires more historical data",
    expected_change_percentage: 0,
    trend_start_date: new Date().toISOString().split("T")[0],
    trend_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    peak_risk_periods: [],
  },
});

const generateFallbackRecommendations = (stats) => [
  {
    action: "Monitor severe depression cases",
    urgency: "High",
    assignee: "Mental Health Team",
    deadline: "Daily",
    impact: "Student Safety",
  },
];

const generateFallbackSummary = (data) =>
  `Platform Overview: ${data.totalUsers} users with ${data.monthlyTests} monthly assessments. Current focus on ${data.highRiskCount} high-risk cases requiring attention.`;

export default {
  generateStatisticsInsights,
  generateTrendPrediction,
  generateActionRecommendations,
  generateExecutiveSummary,
};
