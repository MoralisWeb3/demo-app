import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import * as utilities from "../../utilities";

function VolumeCategoryBars({ categories }) {
  const [selectedTimeframes, setSelectedTimeframes] = useState(() => {
    // Initialize all categories with "5m" as the default timeframe
    const defaultTimeframes = {};
    categories.forEach((category) => {
      defaultTimeframes[category.categoryId] = "1h";
    });
    return defaultTimeframes;
  });

  const handleTimeframeChange = (categoryId, timeframe) => {
    setSelectedTimeframes((prev) => ({
      ...prev,
      [categoryId]: timeframe,
    }));
  };

  const getTimeseriesChartData = (timeseries) => {
    if (!Array.isArray(timeseries)) return { labels: [], datasets: [] };

    const labels = timeseries.map((point) =>
      new Date(point.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    const totalVolumes = timeseries.map(
      (point) => point.buyVolume + point.sellVolume
    );

    // Determine if the trend is positive or negative
    const isPositiveTrend =
      totalVolumes[totalVolumes.length - 1] > totalVolumes[0];

    // Set the line and fill colors based on the trend
    const borderColor = isPositiveTrend
      ? "rgba(75, 192, 192, 1)"
      : "rgba(255, 99, 132, 1)";
    const backgroundColor = isPositiveTrend
      ? "rgba(75, 192, 192, 0.2)"
      : "rgba(255, 99, 132, 0.2)";

    return {
      labels,
      datasets: [
        {
          label: "Total Volume",
          data: totalVolumes,
          borderColor,
          backgroundColor,
          fill: true,
        },
      ],
    };
  };

  return (
    <div className="row">
      {categories.map((category) => {
        const selectedTimeframe =
          selectedTimeframes[category.categoryId] || "24h";

        const stats = {
          totalBuyVolume: category.totalBuyVolume[selectedTimeframe],
          totalSellVolume: category.totalSellVolume[selectedTimeframe],
          totalBuyers: category.totalBuyers[selectedTimeframe],
          totalSellers: category.totalSellers[selectedTimeframe],
        };

        const buySellVolumeWidths = {
          width1:
            (stats.totalBuyVolume /
              (stats.totalBuyVolume + stats.totalSellVolume)) *
              100 || 0,
          width2:
            (stats.totalSellVolume /
              (stats.totalBuyVolume + stats.totalSellVolume)) *
              100 || 0,
        };

        const buyersSellersWidths = {
          width1:
            (stats.totalBuyers / (stats.totalBuyers + stats.totalSellers)) *
              100 || 0,
          width2:
            (stats.totalSellers / (stats.totalBuyers + stats.totalSellers)) *
              100 || 0,
        };

        return (
          <div key={category.categoryId} className="col-lg-4">
            <div className="category-card">
              <div className="category-title">{category.categoryId}</div>

              {/* Timeframe Buttons */}
              <div className="timeframe-buttons">
                {["5m", "1h", "6h", "24h"].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() =>
                      handleTimeframeChange(category.categoryId, timeframe)
                    }
                    className={
                      selectedTimeframe === timeframe
                        ? "btn btn-primary"
                        : "btn btn-secondary"
                    }
                    style={{ margin: "5px" }}
                  >
                    {timeframe === "5m"
                      ? "5m"
                      : timeframe === "1h"
                      ? "1h"
                      : timeframe === "6h"
                      ? "6h"
                      : "24h"}
                  </button>
                ))}
              </div>

              {/* Stats Display */}
              <div className="stats-display">
                {/* Buy Volume vs. Sell Volume */}
                <div className="stat-group">
                  <div className="stat-titles">
                    <div>
                      Buy Volume
                      <div className="value">
                        ${stats.totalBuyVolume.toLocaleString()}
                      </div>
                    </div>
                    <div className="right">
                      Sell Volume
                      <div className="value">
                        ${stats.totalSellVolume.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="bar green"
                      style={{ width: `${buySellVolumeWidths.width1}%` }}
                    ></div>
                    <div
                      className="bar red"
                      style={{ width: `${buySellVolumeWidths.width2}%` }}
                    ></div>
                  </div>
                </div>

                {/* Buyers vs. Sellers */}
                <div className="stat-group">
                  <div className="stat-titles">
                    <div>
                      Buyers
                      <div className="value">{stats.totalBuyers}</div>
                    </div>
                    <div className="right">
                      Sellers
                      <div className="value">{stats.totalSellers}</div>
                    </div>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="bar green"
                      style={{ width: `${buyersSellersWidths.width1}%` }}
                    ></div>
                    <div
                      className="bar red"
                      style={{ width: `${buyersSellersWidths.width2}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Sparkline Chart */}
              {category.timeseries &&
              Array.isArray(category.timeseries.timeseries) &&
              category.timeseries.timeseries.length > 0 ? (
                <div className="timeseries-chart" style={{ height: "50px" }}>
                  <Line
                    data={getTimeseriesChartData(
                      category.timeseries.timeseries
                    )}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true },
                      },
                      scales: {
                        x: { display: false },
                        y: { display: false },
                      },
                      elements: {
                        point: { radius: 0 },
                      },
                    }}
                  />
                </div>
              ) : (
                <div>No timeseries data available</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VolumeCategoryBars;
