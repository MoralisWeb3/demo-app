import React, { useState, useEffect, useRef } from "react";
import * as utilities from "../../utilities.js";
import { useNavigate } from "react-router-dom";
import { useData } from "../../DataContext";
import VolumeCategoryBars from "./VolumeCategoryBars";
import Loader from "../Misc/Loader";
import { Table } from "reactstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function VolumeStats() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/volume/categories`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setGlobalDataCache((prevData) => ({
          ...prevData,
          volumeCategories: data.categories,
          volumeChains: data.chains,
        }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    // Fetch data immediately
    fetchCategories();

    // Set up the interval
    const interval = setInterval(fetchCategories, 3000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once when the component mounts

  const colorMap = {
    "0x1": "#FF6384", // Ethereum
    "0x38": "#36A2EB", // BSC
    "0x89": "#FFCE56", // Polygon
    "0xa": "#4BC0C0", // Optimism
    "0xa86a": "#9966FF", // Avalanche
    solana: "#FF9F40", // Solana
    "0xfa": "#FF6384", // Fantom
    "0x171": "#36A2EB", // Custom Chain
    "0x2105": "#FFCE56", // Another Custom Chain
    "0xe708": "#4BC0C0", // Custom Chain
  };

  const chartData = {
    labels: globalDataCache.volumeChains?.[0]?.timeseries?.timeseries.map(
      (point) => new Date(point.timestamp).toLocaleTimeString()
    ),
    datasets: globalDataCache.volumeChains
      ? globalDataCache.volumeChains.map((chain) => ({
          label: chain.chainId,
          data: chain.timeseries.timeseries.map((point) => point.volume),
          borderColor: colorMap[chain.chainId] || "#000000",
          fill: false,
        }))
      : [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        type: "linear",
        title: {
          display: true,
          text: "Volume",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container">
      {loading && <Loader />}

      {globalDataCache.volumeCategories && (
        <>
          <h1>Chain Stats</h1>
          <div style={{ height: "400px", marginBottom: "30px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
          <Table>
            <thead>
              <tr>
                <th>Chain</th>
                <th>5min Volume</th>
                <th>1hr Volume</th>
                <th>6hr Volume</th>
                <th>24hr Volume</th>
                <th>5min Active Wallets</th>
                <th>1hr Active Wallets</th>
                <th>6hr Active Wallets</th>
                <th>24hr Active Wallets</th>
              </tr>
            </thead>
            <tbody>
              {globalDataCache.volumeChains.map((chain) => (
                <tr key={chain.chainId}>
                  <td>{chain.chainId}</td>
                  <td>{utilities.formatAsUSD(chain.totalVolume["5m"])}</td>
                  <td>{utilities.formatAsUSD(chain.totalVolume["1h"])}</td>
                  <td>{utilities.formatAsUSD(chain.totalVolume["6h"])}</td>
                  <td>{utilities.formatAsUSD(chain.totalVolume["24h"])}</td>
                  <td>
                    {utilities.formatPriceNumber(chain.activeWallets["5m"])}
                  </td>
                  <td>
                    {utilities.formatPriceNumber(chain.activeWallets["1h"])}
                  </td>
                  <td>
                    {utilities.formatPriceNumber(chain.activeWallets["6h"])}
                  </td>
                  <td>
                    {utilities.formatPriceNumber(chain.activeWallets["24h"])}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <h1>Category Stats</h1>
          <VolumeCategoryBars categories={globalDataCache.volumeCategories} />
          <Table>
            <thead>
              <tr>
                <th>Category</th>
                <th>5min Volume</th>
                <th>1hr Volume</th>
                <th>6hr Volume</th>
                <th>24hr Volume</th>
                <th>5min Buyers</th>
                <th>5min Sellers</th>
                <th>1hr Buyers</th>
                <th>1hr Sellers</th>
                <th>6hr Buyers</th>
                <th>6hr Sellers</th>
                <th>24hr Buyers</th>
                <th>24hr Sellers</th>
              </tr>
            </thead>
            <tbody>
              {globalDataCache.volumeCategories.map((category) => (
                <tr key={category.categoryId}>
                  <td>{category.categoryId}</td>
                  <td>
                    {utilities.formatAsUSD(
                      category.totalBuyVolume["5m"] +
                        category.totalSellVolume["5m"]
                    )}
                    <div className="positive small">
                      Buy:{" "}
                      {utilities.formatAsUSD(category.totalBuyVolume["5m"])}
                    </div>
                    <div className="negative small">
                      Sell:{" "}
                      {utilities.formatAsUSD(category.totalSellVolume["5m"])}
                    </div>
                  </td>
                  <td>
                    {utilities.formatAsUSD(
                      category.totalBuyVolume["1h"] +
                        category.totalSellVolume["1h"]
                    )}
                    <div className="positive small">
                      Buy:{" "}
                      {utilities.formatAsUSD(category.totalBuyVolume["1h"])}
                    </div>
                    <div className="negative small">
                      Sell:{" "}
                      {utilities.formatAsUSD(category.totalSellVolume["1h"])}
                    </div>
                  </td>
                  <td>
                    {utilities.formatAsUSD(
                      category.totalBuyVolume["6h"] +
                        category.totalSellVolume["6h"]
                    )}
                    <div className="positive small">
                      Buy:{" "}
                      {utilities.formatAsUSD(category.totalBuyVolume["6h"])}
                    </div>
                    <div className="negative small">
                      Sell:{" "}
                      {utilities.formatAsUSD(category.totalSellVolume["6h"])}
                    </div>
                  </td>
                  <td>
                    {utilities.formatAsUSD(
                      category.totalBuyVolume["24h"] +
                        category.totalSellVolume["24h"]
                    )}
                    <div className="positive small">
                      Buy:{" "}
                      {utilities.formatAsUSD(category.totalBuyVolume["24h"])}
                    </div>
                    <div className="negative small">
                      Sell:{" "}
                      {utilities.formatAsUSD(category.totalSellVolume["24h"])}
                    </div>
                  </td>
                  <td className="positive">{category.totalBuyers["5m"]}</td>
                  <td className="negative">{category.totalSellers["5m"]}</td>
                  <td className="positive">{category.totalBuyers["1h"]}</td>
                  <td className="negative">{category.totalSellers["1h"]}</td>
                  <td className="positive">{category.totalBuyers["6h"]}</td>
                  <td className="negative">{category.totalSellers["6h"]}</td>
                  <td className="positive">{category.totalBuyers["24h"]}</td>
                  <td className="negative">{category.totalSellers["24h"]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}

export default VolumeStats;
