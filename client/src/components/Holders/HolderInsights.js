import React, { useState } from "react";
import { Button } from "reactstrap";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import "./HolderInsights.css";
import * as utilities from "../../utilities.js";
import moment from "moment";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement
);

export default function FormAndAnalytics() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [rollupTimeFrame, setRollupTimeFrame] = useState("1d");
  const [viewModeAcquisition, setViewModeAcquisition] = useState("chart"); // Toggle view for acquisition
  const [viewModeDistribution, setViewModeDistribution] = useState("chart"); // Toggle view for distribution
  const [showAcquisition, setShowAcquisition] = useState(false); // Toggle acquisition datasets on line chart
  const [startDate, setStartDate] = useState(""); // Start date
  const [endDate, setEndDate] = useState(""); // End date

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert dates to timestamps
    // const startTimestamp = startDate ? new Date(startDate) : null;
    // const endTimestamp = endDate ? new Date(endDate) : null;

    // if (!startTimestamp || !endTimestamp || startTimestamp > endTimestamp) {
    //   setError("Please select valid start and end dates.");
    //   return;
    // }

    fetchData(startDate, endDate);
  };

  const fetchData = async (startTimestamp, endTimestamp) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/api/chain/${chain}/tokens/${address}/holders/insights?chain=${chain}&rollupTimeFrame=${rollupTimeFrame}&start=${startTimestamp}&end=${endTimestamp}`;
      const response = await fetch(apiUrl);
      const { summary, timeSeries } = await response.json();

      setSummaryData(summary);
      setTimeSeriesData(timeSeries.reverse());
    } catch (err) {
      setError("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const renderPieChart = () => {
    if (!summaryData) return null;

    const acquisitionData = Object.entries(
      summaryData.holdersByAcquisition
    ).reduce(
      (acc, [key, value]) => {
        if (value > 0) {
          acc.labels.push(key);
          acc.data.push(value);
        }
        return acc;
      },
      { labels: [], data: [] }
    );

    const data = {
      labels: acquisitionData.labels,
      datasets: [
        {
          data: acquisitionData.data,
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#cc65fe",
            "#ffce56",
            "#4bc0c0",
          ],
        },
      ],
    };

    return (
      <div className="pie-chart-container">
        <Doughnut
          data={data}
          options={{
            plugins: {
              legend: {
                display: true,
                position: "right", // Move legend to the right
              },
            },
          }}
        />
      </div>
    );
  };

  const renderAcquisitionList = () => {
    const totalAcquisitions = Object.values(
      summaryData.holdersByAcquisition
    ).reduce((acc, value) => acc + (value > 0 ? value : 0), 0);

    const acquisitionPercentages = Object.entries(
      summaryData.holdersByAcquisition
    ).map(([key, value]) => ({
      type: key,
      value,
      percentage:
        totalAcquisitions > 0
          ? ((value / totalAcquisitions) * 100).toFixed(2)
          : 0,
    }));

    const airdropPercentage = acquisitionPercentages.find(
      (item) => item.type === "airdrop"
    )?.percentage;

    const showWarning = airdropPercentage && airdropPercentage > 10;

    return (
      <ul className="stats-list acquisition-list">
        {acquisitionPercentages.map(({ type, value, percentage }) => (
          <li key={type}>
            <div>
              {type === "swap" ? "💰 " : type === "airdrop" ? "🎈 " : "↪️ "}
              {type}
            </div>
            <div>
              {utilities.formatPriceNumber(value)} ({percentage}%)
            </div>
          </li>
        ))}

        {showWarning && (
          <div className="warning" style={{ color: "red", fontWeight: "bold" }}>
            ⚠️ Airdrop percentage exceeds 10%!
          </div>
        )}
      </ul>
    );
  };

  const renderStyledDistribution = () => {
    if (!summaryData) return null;

    // Calculate total holders, treating -1 as 0
    const totalHolders = Object.values(summaryData.holderDistribution).reduce(
      (acc, value) => acc + (value > 0 ? value : 0), // Treat -1 and other negatives as 0
      0
    );

    // Map distribution data with percentages
    const distributionData = Object.entries(summaryData.holderDistribution).map(
      ([key, value]) => ({
        label: key,
        value: value > 0 ? value : 0, // Treat -1 and other negatives as 0
        percentage:
          totalHolders > 0
            ? (((value > 0 ? value : 0) / totalHolders) * 100).toFixed(2)
            : 0, // Calculate percentage
      })
    );

    return (
      <ul className="styled-distribution-container">
        {distributionData.map(({ label, value, percentage }) => (
          <li key={label}>
            <div className="category-value">
              <span style={{ marginRight: "10px" }}>
                {getEmojiForCategory(label)}
              </span>
              {label}
            </div>
            <div
              className="distribution-bar"
              style={{
                width: `${percentage}%`, // Use the percentage for the bar width
                backgroundColor: "#36a2eb",
                height: "20px", // Adjust height as needed
                marginTop: "5px",
              }}
            ></div>
          </li>
        ))}
      </ul>
    );
  };

  const renderDistributionList = () => {
    // Map distribution data with percentages
    const totalHolders = Object.values(summaryData.holderDistribution).reduce(
      (acc, value) => acc + (value > 0 ? value : 0), // Treat -1 and other negatives as 0
      0
    );

    const distributionData = Object.entries(summaryData.holderDistribution).map(
      ([key, value]) => ({
        label: key,
        value: value > 0 ? value : 0, // Treat -1 and other negatives as 0
        percentage:
          totalHolders > 0
            ? (((value > 0 ? value : 0) / totalHolders) * 100).toFixed(2)
            : 0, // Calculate percentage
      })
    );

    return (
      <ul className="stats-list distribution-list">
        {distributionData.map(({ label, value, percentage }) => (
          <li key={label}>
            <div>
              <span style={{ marginRight: "10px" }}>
                {getEmojiForCategory(label)}
              </span>
              {label}
            </div>
            <div>
              {utilities.formatPriceNumber(value)} ({percentage}%)
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderHolderChangeBarChart = () => {
    if (!timeSeriesData.length) return null;

    // Get the last 20 data points
    const last20DataPoints = timeSeriesData.slice(-20);

    // Prepare the data
    const labels = last20DataPoints.map((item) => item.timestamp);
    const totalHolders = last20DataPoints.map((item) => item.totalHolders);

    const data = {
      labels, // X-axis labels (time buckets)
      datasets: [
        {
          label: "Total Holders",
          data: totalHolders, // Y-axis data (total holders)
          backgroundColor: "#36a2eb",
          borderColor: "#36a2eb",
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false, // Hide gridlines on X-axis
          },
        },
        y: {
          beginAtZero: true, // Start Y-axis at zero
        },
      },
      plugins: {
        legend: {
          display: false, // Hide the legend for simplicity
        },
      },
    };

    return (
      <div style={{ height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!summaryData) return null;

    return (
      <div className="container analytics-summary">
        <div className="row">
          <div className="col-lg-6">
            <div className="wallet-card">
              <h3>
                Total Holders:{" "}
                {utilities.formatPriceNumber(summaryData.totalHolders)}
              </h3>
            </div>

            <div className="wallet-card">
              <h4>Holder Supply</h4>
              <ul className="stats-list">
                <li>
                  <div className="key">Top 10</div>
                  <div>
                    {utilities.formatPriceNumber(
                      summaryData.holderSupply.top10.supply
                    )}{" "}
                    ({summaryData.holderSupply.top10.supplyPercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">Top 50</div>
                  <div>
                    {utilities.formatPriceNumber(
                      summaryData.holderSupply.top50.supply
                    )}{" "}
                    ({summaryData.holderSupply.top50.supplyPercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">Top 100</div>
                  <div>
                    {utilities.formatPriceNumber(
                      summaryData.holderSupply.top100.supply
                    )}{" "}
                    ({summaryData.holderSupply.top100.supplyPercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">Top 250</div>
                  <div>
                    {utilities.formatPriceNumber(
                      summaryData.holderSupply.top250.supply
                    )}{" "}
                    ({summaryData.holderSupply.top250.supplyPercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">Top 500</div>
                  <div>
                    {utilities.formatPriceNumber(
                      summaryData.holderSupply.top500.supply
                    )}{" "}
                    ({summaryData.holderSupply.top500.supplyPercent}%)
                  </div>
                </li>
              </ul>

              {/* {renderHolderChangeBarChart()} */}
            </div>

            <div className="wallet-card">
              <div className="chart-title">
                <h4>Holder Distribution</h4>
                {/* <Button
                  color="primary"
                  size="sm"
                  onClick={() =>
                    setViewModeDistribution(
                      viewModeDistribution === "chart" ? "list" : "chart"
                    )
                  }
                >
                  Show {viewModeDistribution === "chart" ? "List" : "Chart"}
                </Button> */}
              </div>
              <p>Coming soon</p>
              {/* {viewModeDistribution === "chart"
                ? renderStyledDistribution()
                : renderDistributionList()} */}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="wallet-card">
              <h4>Holder Change</h4>
              <ul className="stats-list">
                <li>
                  <div className="key">5 mins</div>
                  <div
                    className={`value ${
                      summaryData.holderChange["5min"].change >= 0
                        ? `positive`
                        : `negative`
                    }`}
                  >
                    {summaryData.holderChange["5min"].change} (
                    {summaryData.holderChange["5min"].changePercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">1 hour</div>
                  <div
                    className={`value ${
                      summaryData.holderChange["1h"].change >= 0
                        ? `positive`
                        : `negative`
                    }`}
                  >
                    {summaryData.holderChange["1h"].change} (
                    {summaryData.holderChange["1h"].changePercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">6 hours</div>
                  <div
                    className={`value ${
                      summaryData.holderChange["6h"].change >= 0
                        ? `positive`
                        : `negative`
                    }`}
                  >
                    {summaryData.holderChange["6h"].change} (
                    {summaryData.holderChange["6h"].changePercent}%)
                  </div>
                </li>
                <li>
                  <div className="key">24 hours</div>
                  <div
                    className={`value ${
                      summaryData.holderChange["24h"].change >= 0
                        ? `positive`
                        : `negative`
                    }`}
                  >
                    {summaryData.holderChange["24h"].change} (
                    {summaryData.holderChange["24h"].changePercent}%)
                  </div>
                </li>
              </ul>

              {/* {renderHolderChangeBarChart()} */}
            </div>

            <div className="wallet-card">
              <div className="chart-title">
                <h4>Holders by Acquisition</h4>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() =>
                    setViewModeAcquisition(
                      viewModeAcquisition === "chart" ? "list" : "chart"
                    )
                  }
                >
                  Show {viewModeAcquisition === "chart" ? "List" : "Chart"}
                </Button>
              </div>
              {viewModeAcquisition === "chart"
                ? renderPieChart()
                : renderAcquisitionList()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [showBreakdown, setShowBreakdown] = useState(false);

  const getEmojiForCategory = (category) => {
    const emojis = {
      whales: "🐳",
      sharks: "🦈",
      dolphins: "🐬",
      fish: "🐟",
      octopus: "🐙",
      crabs: "🦀",
      shrimps: "🦐",
    };
    return emojis[category] || "❓";
  };

  const renderChart = () => {
    if (!timeSeriesData.length) return null;

    const labels = timeSeriesData.map((item) => item.timestamp);
    const totalHolders = timeSeriesData.map((item) => item.totalHolders);

    const aggregateHoldersIn = timeSeriesData.map((item) =>
      Object.values(item.holdersIn).reduce((a, b) => a + b, 0)
    );
    const aggregateHoldersOut = timeSeriesData.map(
      (item) => -Object.values(item.holdersOut).reduce((a, b) => a + b, 0)
    );

    const holderByAcquisition = showAcquisition
      ? timeSeriesData.reduce(
          (acc, item) => ({
            swap: [...acc.swap, item.newHoldersByAcquisition.swap || 0],
            transfer: [
              ...acc.transfer,
              item.newHoldersByAcquisition.transfer || 0,
            ],
            airdrop: [
              ...acc.airdrop,
              item.newHoldersByAcquisition.airdrop || 0,
            ],
          }),
          { swap: [], transfer: [], airdrop: [] }
        )
      : null;

    const getColorForCategory = (category) => {
      const colors = {
        whales: "#007BFF", // Blue
        sharks: "#FFC107", // Amber
        dolphins: "#E83E8C", // Magenta
        fish: "#17A2B8", // Cyan
        octopus: "#6F42C1", // Purple
        crabs: "#28A745", // Lime Green
        shrimps: "#FD7E14", // Orange
      };
      return colors[category] || "#FFFFFF";
    };

    const breakdownHoldersIn = showBreakdown
      ? Object.keys(timeSeriesData[0].holdersIn).map((key) => ({
          label: `${getEmojiForCategory(key)} In (${key})`,
          data: timeSeriesData.map((item) => item.holdersIn[key] || 0),
          backgroundColor: getColorForCategory(key),
          type: "bar",
          stack: "holders",
          yAxisID: "y2",
        }))
      : [];

    const breakdownHoldersOut = showBreakdown
      ? Object.keys(timeSeriesData[0].holdersOut).map((key) => ({
          label: `${getEmojiForCategory(key)} Out (${key})`,
          data: timeSeriesData.map((item) => -(item.holdersOut[key] || 0)),
          backgroundColor: getColorForCategory(key),
          type: "bar",
          stack: "holders",
          yAxisID: "y2",
        }))
      : [];

    const acquisitionDatasets = showAcquisition
      ? Object.entries(holderByAcquisition).map(([key, values]) => ({
          label: `Acquisition (${key})`,
          data: values,
          type: "bar",
          backgroundColor:
            key === "swap"
              ? "purple"
              : key === "transfer"
              ? "orange"
              : "yellow",
          stack: "acquisitions", // Separate stack for acquisitions
          yAxisID: "y2",
        }))
      : [];

    const datasets = [
      {
        label: "Total Holders",
        data: totalHolders,
        type: "line",
        borderColor: "#0C6EFD",
        tension: 0.1,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          return createGradient(ctx, chartArea);
        },
        yAxisID: "y1",
      },
      ...(!showBreakdown
        ? [
            {
              label: "Holders In",
              data: aggregateHoldersIn,
              type: "bar",
              backgroundColor: "green",
              stack: "holders",
              yAxisID: "y2",
            },
            {
              label: "Holders Out",
              data: aggregateHoldersOut,
              type: "bar",
              backgroundColor: "red",
              stack: "holders",
              yAxisID: "y2",
            },
          ]
        : []),
      ...breakdownHoldersIn,
      ...breakdownHoldersOut,
      ...acquisitionDatasets, // Add acquisitions datasets
    ];

    const data = {
      labels,
      datasets,
    };

    const options = {
      responsive: true,
      scales: {
        y1: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "Total Holders",
          },
        },
        y2: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "Holders In/Out and Acquisitions",
          },
          stacked: true,
        },
        x: {
          stacked: true,
          title: {
            display: true,
            text: "Time",
          },
          display: false,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw;
              return `${label}: ${value}`;
            },
          },
        },
      },
    };

    const createGradient = (ctx, chartArea) => {
      const gradient = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom
      );
      gradient.addColorStop(0, "rgba(12,109,253,1)");
      gradient.addColorStop(1, "rgba(12,109,253,0)");
      return gradient;
    };

    return (
      <div className="holder-chart-container">
        <div className="wallet-card">
          <Button
            color="primary"
            size="sm"
            onClick={() => setShowAcquisition(!showAcquisition)}
          >
            {showAcquisition ? "Hide Acquisitions" : "Show Acquisitions"}
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? "Hide Breakdown" : "Toggle Breakdown"}
          </Button>
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };

  const timeFrames = [
    { label: "1 Minute", value: "1min" },
    { label: "5 Minutes", value: "5min" },
    { label: "10 Minutes", value: "10min" },
    { label: "30 Minutes", value: "30min" },
    { label: "1 Hour", value: "1h" },
    { label: "4 Hours", value: "4h" },
    { label: "12 Hours", value: "12h" },
    { label: "1 Day", value: "1d" },
    { label: "1 Week", value: "1w" },
    { label: "1 Month", value: "1m" },
  ];

  return (
    <div className="container holders">
      <h1>Token Holder Analytics</h1>
      <form onSubmit={handleSubmit} className="wallet-form">
        <input
          type="text"
          placeholder="Enter token address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="chain-selector"
        >
          <option value="eth">Ethereum</option>
          <option value="base">Base</option>
          <option value="linea">Linea</option>
          <option value="solana">Solana</option>
          <option value="polygon">Polygon</option>
        </select>
        <select
          value={rollupTimeFrame}
          onChange={(e) => setRollupTimeFrame(e.target.value)}
          className="timeframe-selector"
        >
          {timeFrames.map((timeFrame) => (
            <option key={timeFrame.value} value={timeFrame.value}>
              {timeFrame.label}
            </option>
          ))}
        </select>
        <div className="date-selector">
          <label>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>
        <Button color="primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </Button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      {renderAnalytics()}
      {renderChart()}
    </div>
  );
}
