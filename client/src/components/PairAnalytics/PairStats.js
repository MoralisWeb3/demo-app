import React, { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "./PairStats.css";
import * as utilities from "../../utilities.js";
import { useData } from "../../DataContext";

// Register chart components
ChartJS.register(
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const PairStats = ({ pairStats = {} }) => {
  const timeframes = ["5min", "1h", "4h", "24h"];
  const [selectedTimeframe, setSelectedTimeframe] = useState("5min");
  const { globalDataCache, setGlobalDataCache } = useData();

  const handleTimeframeClick = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const getBarWidths = (value1, value2) => {
    const total = value1 + value2;
    return total > 0
      ? { width1: (value1 / total) * 100, width2: (value2 / total) * 100 }
      : { width1: 50, width2: 50 }; // Default to 50% each if total is 0
  };

  // Safeguard against missing `pairStats` or its nested fields
  const buys = pairStats?.buys?.[selectedTimeframe] || 0;
  const sells = pairStats?.sells?.[selectedTimeframe] || 0;
  const buyers = pairStats?.buyers?.[selectedTimeframe] || 0;
  const sellers = pairStats?.sellers?.[selectedTimeframe] || 0;
  const buyVolume = pairStats?.buyVolume?.[selectedTimeframe] || 0;
  const sellVolume = pairStats?.sellVolume?.[selectedTimeframe] || 0;
  const liquidityChange =
    pairStats?.liquidityPercentChange?.[selectedTimeframe] || 0;
  const currentTotalLiquidity = parseFloat(pairStats?.totalLiquidityUsd || "0");

  const buysSellsWidths = getBarWidths(buys, sells);
  const buyersSellersWidths = getBarWidths(buyers, sellers);
  const buySellVolumeWidths = getBarWidths(buyVolume, sellVolume);

  // Liquidity risk label
  const getLiquidityRiskLabel = (totalLiquidity) => {
    if (totalLiquidity < 5000) {
      return { label: "Extremely Low Liquidity", class: "super-low" };
    } else if (totalLiquidity < 50000) {
      return { label: "Low Liquidity", class: "low" };
    } else if (totalLiquidity < 300000) {
      return { label: "Good Liquidity", class: "good" };
    } else {
      return { label: "Deep Liquidity", class: "deep" };
    }
  };

  const getLiquidityLabel = (liquidityChange) => {
    if (liquidityChange > 50) {
      return { label: "Major Liquidity Surge", color: "green" };
    } else if (liquidityChange > 20) {
      return { label: "Significant Liquidity Increase", color: "lightgreen" };
    } else if (liquidityChange > 5) {
      return { label: "Liquidity Growing", color: "blue" };
    } else if (liquidityChange > 2) {
      return { label: "Small Growth in Liquidity", color: "blue" };
    } else if (liquidityChange < -50) {
      return { label: "Major Liquidity Drop", color: "red" };
    } else if (liquidityChange < -15) {
      return { label: "Significant Liquidity Decrease", color: "orange" };
    } else if (liquidityChange < -5) {
      return { label: "Liquidity Shrinking", color: "yellow" };
    } else {
      return { label: "Stable Liquidity", color: "gray" };
    }
  };

  const liquidityRiskLabel = getLiquidityRiskLabel(currentTotalLiquidity);
  const liquidityLabel = getLiquidityLabel(liquidityChange);
  // Sentence about liquidity change
  const calculateLiquidityUSDChange = (percentChange, totalLiquidity) => {
    return (percentChange / 100) * totalLiquidity;
  };

  const liquidityUSDChange = calculateLiquidityUSDChange(
    liquidityChange,
    currentTotalLiquidity
  );

  const liquidityChangeSentence = (
    <div>
      The liquidity has changed by{" "}
      <span
        className={`liquidity-change-percentage ${
          liquidityChange > 0 ? "positive" : "negative"
        }`}
      >
        {liquidityChange.toFixed(2)}%
      </span>{" "}
      (
      <span
        className={`liquidity-change-usd ${
          liquidityUSDChange > 0 ? "positive" : "negative"
        }`}
      >
        {liquidityUSDChange > 0 ? "+" : ""}
        {utilities.formatAsUSD(liquidityUSDChange)}
      </span>
      ) in the last {selectedTimeframe}.
    </div>
  );

  // Liquidity line chart data
  const liquidityChanges = [
    pairStats?.liquidityPercentChange?.["5min"] || 0,
    pairStats?.liquidityPercentChange?.["1h"] || 0,
    pairStats?.liquidityPercentChange?.["4h"] || 0,
    pairStats?.liquidityPercentChange?.["24h"] || 0,
  ];

  const currentLiquidityChange = liquidityChanges[liquidityChanges.length - 1];

  const weights = [4, 3, 2, 1]; // Weights for 5min, 1h, 4h, 24h
  const calculateWeightedAverage = (values, weights) => {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedSum = values.reduce(
      (sum, value, index) => sum + value * weights[index],
      0
    );
    return weightedSum / totalWeight;
  };

  const trendLineData = liquidityChanges.map((_, idx) =>
    calculateWeightedAverage(
      liquidityChanges.slice(0, idx + 1),
      weights.slice(0, idx + 1)
    )
  );

  const liquidityChartData = {
    labels: ["5min", "1h", "4h", "24h"],
    datasets: [
      {
        label: "Liquidity Change (%)",
        data: liquidityChanges,
        borderColor: currentLiquidityChange >= 0 ? "green" : "red",
        backgroundColor:
          currentLiquidityChange >= 0
            ? "rgba(0, 255, 0, 0.2)"
            : "rgba(255, 0, 0, 0.2)",
        fill: true,
        tension: 0.4, // Smooth curve
      },
      {
        label: "Trend Line (Weighted)",
        data: trendLineData,
        borderColor: "orange",
        borderDash: [5, 5], // Dashed line
        fill: false,
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const liquidityChartOptions = {
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...liquidityChanges) * 1.5,
        max: Math.max(...liquidityChanges) * 1.5,
        title: {
          display: true,
          text: "Change (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Timeframe",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  const liquidityBarChartData = {
    labels: ["5min", "1h", "4h", "24h"],
    datasets: [
      {
        label: "Liquidity Change (%)",
        data: liquidityChanges,
        backgroundColor: liquidityChanges.map((change) =>
          change >= 0 ? "#4ce666" : "#e64c4c"
        ),
        borderColor: liquidityChanges.map((change) =>
          change >= 0 ? "darkgreen" : "darkred"
        ),
        borderWidth: 1,
      },
    ],
  };

  const liquidityBarChartOptions = {
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...liquidityChanges) * 1.5,
        max: Math.max(...liquidityChanges) * 1.5,
        title: {
          display: true,
          text: "Change (%)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Timeframe",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="pair-stats">
      <div className="token-name">
        <img src={globalDataCache.pairStats.tokenLogo} width="50" />
        <div className="token-symbol">
          <h1>{globalDataCache.pairStats.tokenName}</h1>
          <div className="pair-exchange">
            {globalDataCache.pairStats.pairLabel}
            <span>
              <img src={globalDataCache.pairStats.exchangeLogo} width="30" />
              {globalDataCache.pairStats.exchange}
            </span>
          </div>
        </div>
      </div>

      <div className="token-stats">
        <div className="token-group two">
          <div className="token-stat">
            <div className="title">Price USD</div>
            <div className="value">
              {utilities.formatAsUSD(pairStats?.currentUsdPrice)}
            </div>
          </div>
          <div className="token-stat">
            <div className="title">Liquidity</div>
            <div className="value">
              ${utilities.abbreviateNumber(pairStats?.totalLiquidityUsd)}
            </div>
          </div>
        </div>

        <div className="token-group three">
          <div className="token-stat">
            <div className="title">Supply</div>
            <div className="value">
              {utilities.abbreviateNumber(
                pairStats?.tokenMetadata?.total_supply_formatted
                  ? pairStats?.tokenMetadata?.total_supply_formatted
                  : pairStats?.tokenMetadata?.totalSupplyFormatted
              )}
            </div>
          </div>
          <div className="token-stat">
            <div className="title">FDV</div>
            <div className="value">
              $
              {utilities.abbreviateNumber(
                pairStats?.tokenMetadata?.fully_diluted_valuation
                  ? pairStats?.tokenMetadata?.fully_diluted_valuation
                  : pairStats?.tokenMetadata?.fullyDilutedValue
              )}
            </div>
          </div>
          <div className="token-stat">
            <div className="title">Market Cap</div>
            <div className="value">
              $
              {utilities.abbreviateNumber(
                pairStats?.tokenMetadata?.fully_diluted_valuation
                  ? pairStats?.tokenMetadata?.fully_diluted_valuation
                  : pairStats?.tokenMetadata?.fullyDilutedValue
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pair-stats-timeframes">
        {/* Timeframe Buttons */}
        <div className="timeframe-buttons">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => handleTimeframeClick(timeframe)}
              className={timeframe === selectedTimeframe ? "active" : ""}
            >
              <div className="button-stat">
                <div className="timeframe">{timeframe}</div>

                <div
                  className={`value ${
                    Number(
                      pairStats?.pricePercentChange?.[timeframe] || 0
                    ).toFixed(2) > 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {Number(
                    pairStats?.pricePercentChange?.[timeframe] || 0
                  ).toFixed(2)}
                  %
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Stats Display */}
        <div className="stats-display">
          <div className="row">
            <div className="col-lg-3 border-right">
              <div className="stat-totals">
                <div className="stat-total">
                  <div className="title">Swaps</div>
                  <div className="value">{buys + sells}</div>
                </div>

                <div className="stat-total">
                  <div className="title">Traders</div>
                  <div className="value">{buyers + sellers}</div>
                </div>

                <div className="stat-total">
                  <div className="title">Volume</div>
                  <div className="value">
                    ${utilities.abbreviateNumber(buyVolume + sellVolume)}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-9">
              {/* Buys vs. Sells */}
              <div className="stat-group">
                <div className="stat-titles">
                  <div>
                    Buys
                    <div className="value">{buys}</div>
                  </div>
                  <div className="right">
                    Sells
                    <div className="value">{sells}</div>
                  </div>
                </div>
                <div className="stat-bar">
                  <div
                    className="bar green"
                    style={{ width: `${buysSellsWidths.width1}%` }}
                  ></div>
                  <div
                    className="bar red"
                    style={{ width: `${buysSellsWidths.width2}%` }}
                  ></div>
                </div>
              </div>

              {/* Buyers vs. Sellers */}
              <div className="stat-group">
                <div className="stat-titles">
                  <div>
                    Buyers
                    <div className="value">{buyers}</div>
                  </div>
                  <div className="right">
                    Sellers
                    <div className="value">{sellers}</div>
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

              {/* Buy Volume vs. Sell Volume */}
              <div className="stat-group">
                <div className="stat-titles">
                  <div>
                    Buy Volume
                    <div className="value">${buyVolume.toLocaleString()}</div>
                  </div>
                  <div className="right">
                    Sell Volume
                    <div className="value">${sellVolume.toLocaleString()}</div>
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
            </div>
          </div>
        </div>
      </div>

      <div className="liquidity-stats">
        {/* Liquidity Risk Label */}

        <div className="liquidity">
          <div className={`liquidity-risk ${liquidityRiskLabel.class}`}>
            {liquidityRiskLabel.label}
          </div>
          <div className="total-liquidity">
            {utilities.formatAsUSD(pairStats?.totalLiquidityUsd)}
          </div>
        </div>

        {/* Liquidity Warning */}
        <div
          className="liquidity-warning"
          style={{ color: liquidityLabel.color }}
        >
          {liquidityLabel.label}
        </div>

        {/* Liquidity Change Sentence */}
        <div className="liquidity-sentence">{liquidityChangeSentence}</div>

        {/* Liquidity Charts */}
        <div className="liquidity-chart-container">
          {/* <h6>Liquidity Line Chart</h6>
          <Line data={liquidityChartData} options={liquidityChartOptions} /> */}
          <Bar
            data={liquidityBarChartData}
            options={liquidityBarChartOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default PairStats;
