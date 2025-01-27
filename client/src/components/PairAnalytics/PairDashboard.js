import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import classnames from "classnames";
import moment from "moment";
import Loader from "../Misc/Loader";
import PairStats from "./PairStats";
import Trending from "./Trending";
import Traders from "./Traders";
import Holders from "./Holders";
import Transactions from "./Transactions";
import Snipers from "./Snipers";
import SmartMoney from "./SmartMoney";
import WhaleMovements from "./WhaleMovements";
import MoneyFlowList from "./MoneyFlowList";
import NavBar from "../Misc/NavBar";
import { useData } from "../../DataContext";
import { Chart } from "chart.js"; // Import Chart from chart.js directly
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { Chart as ChartJS } from "react-chartjs-2";
import "chartjs-adapter-date-fns"; // Import adapter for date-fns
import "chartjs-plugin-annotation"; // Import chartjs-plugin-annotation for annotations
import * as utilities from "../../utilities.js";
import "./PairStats.css"; // Include CSS for animations and styles
import ChartAnnotation from "chartjs-plugin-annotation"; // Correct import of the annotation plugin
import "./PairDashboard.css";

// Register Chart.js components
Chart.register(CandlestickController, CandlestickElement);

// Register the annotation plugin explicitly (Chart.js v4 needs this)

Chart.register(ChartAnnotation); // Register the annotation plugin with Chart.js

const PairDashboard = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false); // Toggle for `ai-ta` visibility
  const [tokenAddress, setTokenAddress] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [lastTransactions, setLastTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState(null); // Manage filtered transactions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showDifferentPair, setShowDifferentPair] = useState(false);
  const [filteringWallet, setFilteringWallet] = useState(null);
  const [showVolume, setShowVolume] = useState(false); // Visibility for Volume
  const [showTrades, setShowTrades] = useState(false); // Visibility for Trades

  const containerStyle = {
    maxWidth: "1800px",
  };

  console.log("Rendering PairDashboard. Current tokenAddress:", tokenAddress);

  const toggleDifferentPairVisibility = () => {
    setShowDifferentPair((prev) => !prev);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const { chain, address } = useParams();

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const fetchInitialData = async () => {
    try {
      const [statsResponse, ohlcResponse] = await Promise.all([
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}?chain=${chain}`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/ohlc?chain=${chain}`
        ),
      ]);

      // Parse JSON responses in parallel
      const [statsData, ohlcData] = await Promise.all([
        statsResponse.json(),
        ohlcResponse.json(),
      ]);

      // Update global data cache
      setGlobalDataCache((prevData) => ({
        ...prevData,
        pairStats: statsData,
        pairOHLC: ohlcData,
      }));

      if (!ohlcData.tokenAddress) {
        return;
      }
      setTokenAddress(ohlcData.tokenAddress);

      const [
        transactionsResponse,
        snipersResponse,
        trendingResponse,
        holdersResponse,
        tradersResponse,
        flowResponse,
      ] = await Promise.all([
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/swaps?chain=${chain}`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/snipers?chain=${chain}`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/tokens/${ohlcData.tokenAddress}/trending?chain=${chain}`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/tokens/${ohlcData.tokenAddress}/holders`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/tokens/${ohlcData.tokenAddress}/traders`
        ),
        fetch(
          `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/money-flows`
        ),
      ]);

      // Parse JSON responses in parallel
      const [
        transactionsData,
        snipersData,
        trendingData,
        holdersData,
        tradersData,
        flowData,
      ] = await Promise.all([
        transactionsResponse.json(),
        snipersResponse.json(),
        trendingResponse.json(),
        holdersResponse.json(),
        tradersResponse.json(),
        flowResponse.json(),
      ]);

      // Update global data cache
      setGlobalDataCache((prevData) => ({
        ...prevData,
        pairTransactions: transactionsData,
        pairSnipers: snipersData,
        trendingData: trendingData,
        tokenHolders: holdersData,
        topTraders: tradersData,
        moneyFlows: flowData,
      }));
    } catch (error) {
      console.log(error);
      setError("An error occurred while fetching initial pair data");
    } finally {
      setLoading(false);
    }
  };

  const refreshPairData = async () => {
    try {
      if (!tokenAddress) {
        return;
      }

      const [transactionsResponse, trendingResponse, flowResponse] =
        await Promise.all([
          fetch(
            `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/swaps?chain=${chain}`
          ),
          fetch(
            `${process.env.REACT_APP_API_URL}/api/chain/${chain}/tokens/${tokenAddress}/trending?chain=${chain}`
          ),
          fetch(
            `${process.env.REACT_APP_API_URL}/api/chain/${chain}/pairs/${address}/money-flows`
          ),
        ]);

      // Parse JSON responses in parallel
      const [
        transactionsData,
        trendingData,
        flowData,
        // holderInsightsData,
      ] = await Promise.all([
        transactionsResponse.json(),
        trendingResponse.json(),
        flowResponse.json(),
      ]);

      // Update global data cache
      setGlobalDataCache((prevData) => ({
        ...prevData,
        pairTransactions: transactionsData,
        trendingData: trendingData,
        selectedChain: chain,
        moneyFlows: flowData,
      }));

      // Identify new transactions
      const newTransactions = transactionsData.result.filter(
        (tx) =>
          !lastTransactions.some(
            (existingTx) => existingTx.transaction_hash === tx.transaction_hash
          )
      );
      setLastTransactions(newTransactions);
    } catch (error) {
      console.log(error);
      setError("An error occurred while refreshing pair data");
    } finally {
      setLoading(false);
    }
  };

  const filterByWallet = async (walletAddress) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/${walletAddress}/token/${globalDataCache.pairOHLC.tokenAddress}/swaps?chain=${chain}`
      );
      const data = await response.json();
      console.log("Filtered Transactions:", data);
      const transformedTransactions = utilities.transformTransactionFormat(
        data,
        globalDataCache.pairStats.pairAddress
      );
      setFilteredTransactions(transformedTransactions);
      console.log(
        "Transformed Filtered Transactions:",
        transformedTransactions
      );
    } catch (error) {
      console.error("Error filtering transactions by wallet:", error);
    }
  };

  const resetFilter = () => {
    setFilteredTransactions(null); // Reset to show all transactions
  };

  useEffect(() => {
    document.body.style.marginTop = "0px";
    fetchInitialData();
    const interval = setInterval(() => {
      refreshPairData();
    }, 20000);
    return () => {
      document.body.style.marginTop = "120px";
      clearInterval(interval);
    };
  }, [chain, address, tokenAddress]);

  const analyzeChart = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    setShowAnalysis(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional crypto market analyst specializing in DEX pairs.",
              },
              {
                role: "user",
                content: `Analyze the following OHLC data and provide a summary including trend direction (bullish, bearish, neutral), key levels, and significant observations:\n${JSON.stringify(
                  globalDataCache?.pairOHLC?.result
                )}`,
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch analysis");

      const data = await response.json();
      setAnalysis(data.choices[0].message.content);
      setShowAnalysis(true); // Show analysis panel after successful fetch
    } catch (error) {
      console.error("Error analyzing chart:", error);
      setAnalysis(
        "Failed to analyze chart. Make sure your OpenAI API Key is configured."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const chartRef = useRef(null);
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !isPoppedOut) {
          // setIsPoppedOut(true); // Show mini chart
        } else if (entry.isIntersecting && isPoppedOut) {
          setIsPoppedOut(false); // Hide mini chart
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [isPoppedOut, globalDataCache]);

  const prepareChartData = (ohlcData) => {
    if (!ohlcData) return { candles: [], volume: [], trades: [] };

    const candles = ohlcData.map((item) => ({
      x: new Date(item.timestamp).getTime(), // Time for X-axis
      o: item.open,
      h: item.high,
      l: item.low,
      c: item.close,
    }));

    const volume = ohlcData.map((item) => ({
      x: new Date(item.timestamp).getTime(), // Time for X-axis
      y: item.volume, // Volume for Y-axis
    }));

    const trades = ohlcData.map((item) => ({
      x: new Date(item.timestamp).getTime(), // Time for X-axis
      y: item.trades, // Trades for Y-axis
    }));

    return { candles, volume, trades };
  };

  // Prepare chart data dynamically based on visibility state
  const chartData = (() => {
    const { candles, volume, trades } = prepareChartData(
      globalDataCache?.pairOHLC?.result || []
    );

    const datasets = [
      {
        label: "Candlestick",
        data: candles,
        type: "candlestick",
        backgroundColors: {
          up: "#4DE667",
          down: "#E64D4C",
          unchanged: "rgba(143, 143, 143, 1)",
        },
        borderColors: {
          up: "#4DE667",
          down: "#E64D4C",
          unchanged: "rgba(143, 143, 143, 1)",
        },
      },
    ];

    if (showVolume) {
      datasets.push({
        label: "Volume",
        data: volume,
        type: "bar",
        yAxisID: "volume-axis",
        backgroundColor: "#21673D",
      });
    }

    if (showTrades) {
      datasets.push({
        label: "Trades",
        data: trades,
        type: "line",
        yAxisID: "trades-axis",
        borderColor: "rgba(75, 75, 192, 1)",
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    }

    return { datasets };
  })();

  const chartOptions = {
    responsive: true, // Ensures the chart resizes with the container
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          tooltipFormat: "yyyy-MM-dd HH:mm",
        },
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text: "Price",
        },
      },
      "volume-axis": {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Volume",
        },
      },
      annotationAxis: {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: false,
        },
        ticks: {
          display: false,
          max: 1,
          min: 0,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      annotation: {
        annotations: [
          ...(filteredTransactions && filteredTransactions.length > 0
            ? filteredTransactions
                .filter((tx) => {
                  if (tx.isDifferentPair && !showDifferentPair) return false;
                  return tx.blockTimestamp && tx.transactionType;
                })
                .map((tx) => {
                  const isBuyTransaction = tx.transactionType === "buy";
                  const transactionTime = new Date(tx.blockTimestamp);

                  const normalizedTransactionDate = new Date(transactionTime);
                  normalizedTransactionDate.setMinutes(0, 0, 0);

                  const matchingCandle = chartData.datasets[0]?.data?.find(
                    (candle) => {
                      const candleTime = new Date(candle.x);
                      const normalizedCandleDate = new Date(candleTime);
                      normalizedCandleDate.setMinutes(0, 0, 0);

                      return (
                        normalizedTransactionDate.getTime() ===
                        normalizedCandleDate.getTime()
                      );
                    }
                  );

                  if (!matchingCandle) return null;

                  const yValue = isBuyTransaction
                    ? matchingCandle.c
                    : matchingCandle.o;

                  const annotationColor = (() => {
                    if (isBuyTransaction && !tx.isDifferentPair) {
                      // Same pair + Buy
                      return "#36A168"; // Green
                    } else if (isBuyTransaction && tx.isDifferentPair) {
                      // Different pair + Buy
                      return "#01643E";
                    } else if (!isBuyTransaction && !tx.isDifferentPair) {
                      // Same pair + Sell
                      return "#E53F3F"; // Red
                    } else if (!isBuyTransaction && tx.isDifferentPair) {
                      // Different pair + Sell
                      return "#920007";
                    }
                  })();

                  return {
                    type: "label",
                    xValue: normalizedTransactionDate.getTime(),
                    yValue: yValue,
                    content: [isBuyTransaction ? "B" : "S"],
                    backgroundColor: annotationColor,
                    borderRadius: 50,
                    padding: {
                      top: 10,
                      right: 13,
                      bottom: 10,
                      left: 13,
                    },
                    font: {
                      size: 12,
                      weight: "bold",
                      family: "Arial",
                    },
                    color: "white",
                    textAlign: "center",
                    position: {
                      x: "center",
                      y: "center",
                    },
                    borderColor: tx.isDifferentPair ? "white" : annotationColor,
                    borderWidth: 2,
                    tooltip: {
                      enabled: true,
                      label: "Hello",
                    },
                    enter({ element }) {
                      setModalData(tx);
                      setIsModalOpen(true);
                    },
                  };
                })
            : []
          ).filter((annotation) => annotation !== null),
        ],
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: true, // Ensures chart scales correctly
    plugins: {
      legend: {
        display: false, // Hides the legend
      },
      tooltip: {
        enabled: false, // Disables tooltips
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 8, // Smaller font size for X-axis
          },
          maxRotation: 0, // Ensures labels don’t rotate
          minRotation: 0,
        },
        grid: {
          display: false, // Optional: Hide grid lines
        },
      },
      y: {
        ticks: {
          font: {
            size: 8, // Smaller font size for Y-axis
          },
        },
        grid: {
          display: false, // Optional: Hide grid lines
        },
      },
    },
    animation: {
      duration: 0, // Removes animation for performance
    },
  };

  return (
    <div>
      <div>
        {loading && <Loader />}

        {error && <div className="text-danger">{error}</div>}

        {!loading && !error && globalDataCache.pairStats && (
          <>
            <div className="trending-bar-wrapper">
              <ul className="trending-bar">
                {globalDataCache.marketCap &&
                  [
                    ...globalDataCache.marketCap,
                    ...globalDataCache.marketCap,
                  ].map((token, index) => (
                    <li key={index}>
                      <div className="rank">
                        #{(index % globalDataCache.marketCap.length) + 1}
                      </div>

                      <img
                        className="logo"
                        src={token.token_logo}
                        alt={token.token_symbol}
                      />

                      <div className="symbol">{token.token_symbol}</div>
                      <div className="price">
                        {utilities.formatAsUSD(token.price_usd)}{" "}
                        <span>
                          {Number(token.price_24h_percent_change).toFixed(2)}%
                        </span>
                      </div>
                    </li>
                  ))}

                {!globalDataCache.marketCap && <li>Trending Unavailable</li>}
              </ul>
            </div>
            <div className="container pair-info" style={containerStyle}>
              <div className="row">
                <div className="col-lg-3 border-right">
                  <PairStats pairStats={globalDataCache.pairStats} />
                </div>
                <div className="col-lg-9 main-col">
                  <div className="filter-options">
                    <span>Chart Controls:</span>
                    <button onClick={() => analyzeChart()}>
                      {analyzing ? `Analzying...` : `Analyze`}
                    </button>
                    <button
                      onClick={() => setShowVolume((prev) => !prev)}
                      style={{
                        backgroundColor: showVolume ? "#0e2135" : "",
                        marginLeft: "10px",
                      }}
                    >
                      {showVolume ? "Hide Volume" : "Show Volume"}
                    </button>
                    <button
                      onClick={() => setShowTrades((prev) => !prev)}
                      style={{
                        backgroundColor: showTrades ? "#0e2135" : "",
                        marginLeft: "10px",
                      }}
                    >
                      {showTrades ? "Hide Trades" : "Show Trades"}
                    </button>
                  </div>
                  <div
                    ref={chartRef}
                    className={`chart-container ${
                      showAnalysis ? "with-analysis" : ""
                    }`}
                  >
                    <div className="chart">
                      <ChartJS
                        type="candlestick"
                        data={chartData}
                        options={chartOptions}
                      />

                      {/* Mini chart (fixed at the top-left corner) */}
                      <div
                        className={`mini-chart ${isPoppedOut ? "visible" : ""}`}
                      >
                        <ChartJS
                          type="candlestick"
                          data={chartData}
                          options={miniChartOptions}
                        />
                      </div>
                    </div>
                    {showAnalysis && (
                      <div className="ai-ta">
                        <h2>AI Analysis</h2>
                        <button onClick={() => setShowAnalysis(false)}>
                          Close
                        </button>
                        <button onClick={() => analyzeChart()}>
                          {analyzing ? `Analzying...` : `Re-analyze`}
                        </button>
                        <div className="analysis-content">{analysis}</div>
                      </div>
                    )}
                  </div>
                  <Nav tabs id="core-tabs">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "1" })}
                        onClick={() => toggle("1")}
                      >
                        <div className="trending-title">
                          <div>✨ Trending</div>
                          <div className="live-indicator">
                            <div className="dot"></div>
                          </div>
                        </div>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "2" })}
                        onClick={() => toggle("2")}
                      >
                        💰 Transactions
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "3" })}
                        onClick={() => toggle("3")}
                      >
                        💎 Top Holders
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "4" })}
                        onClick={() => toggle("4")}
                      >
                        🎯 Snipers
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "5" })}
                        onClick={() => toggle("5")}
                      >
                        🏆 Top Traders
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "6" })}
                        onClick={() => toggle("6")}
                      >
                        🐳 Whales
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "7" })}
                        onClick={() => toggle("7")}
                      >
                        🔮 Smart Money
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "8" })}
                        onClick={() => toggle("8")}
                      >
                        🔀 Money Flows
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === "9" })}
                        onClick={() => toggle("9")}
                      >
                        ⚡️ Holder Insights
                      </NavLink>
                    </NavItem>
                  </Nav>
                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="1">
                      {globalDataCache?.trendingData?.sortedTransactions && (
                        <Trending
                          trendingData={
                            globalDataCache.trendingData.sortedTransactions
                          }
                        />
                      )}
                    </TabPane>
                    <TabPane tabId="2">
                      {globalDataCache?.pairTransactions && (
                        <>
                          {filteredTransactions && (
                            <Button
                              color={
                                showDifferentPair ? "primary" : "secondary"
                              }
                              onClick={toggleDifferentPairVisibility}
                            >
                              {showDifferentPair
                                ? "Hide Different Pair"
                                : "Show Different Pair"}
                            </Button>
                          )}

                          <Transactions
                            key={
                              filteredTransactions ? "filtered" : "unfiltered"
                            } // Forces re-render
                            pairLabel={
                              globalDataCache.pairTransactions.pairLabel
                            }
                            transactions={
                              filteredTransactions ||
                              globalDataCache.pairTransactions.result
                            }
                            lastTransactions={lastTransactions}
                            filterByWallet={filterByWallet}
                            resetFilter={resetFilter}
                          />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="3">
                      {globalDataCache?.tokenHolders && (
                        <>
                          <Holders holders={globalDataCache.tokenHolders} />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="4">
                      {globalDataCache?.pairSnipers?.result && (
                        <>
                          <p>
                            First liquidity event{" "}
                            {moment(
                              globalDataCache.pairSnipers.blockTimestamp
                            ).fromNow()}{" "}
                            at block number{" "}
                            {globalDataCache.pairSnipers.blockNumber}
                          </p>
                          <Snipers
                            snipers={globalDataCache.pairSnipers.result}
                          />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="5">
                      {globalDataCache?.topTraders && (
                        <>
                          <Traders traders={globalDataCache.topTraders} />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="6">
                      {globalDataCache?.trendingData?.sortedTransactions && (
                        <>
                          <WhaleMovements
                            transactions={globalDataCache.trendingData.sortedTransactions.filter(
                              (transaction) =>
                                transaction.type === "whaleMovement"
                            )}
                          />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="7">
                      {globalDataCache?.trendingData?.sortedTransactions && (
                        <>
                          <SmartMoney
                            transactions={globalDataCache.trendingData.sortedTransactions.filter(
                              (transaction) => transaction.type === "smartMoney"
                            )}
                          />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="8">
                      {globalDataCache?.moneyFlows?.soldPrior && (
                        <>
                          <MoneyFlowList
                            moneyFlows={globalDataCache.moneyFlows}
                          />
                        </>
                      )}
                    </TabPane>
                    <TabPane tabId="9"></TabPane>
                  </TabContent>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal */}
        <Modal isOpen={isModalOpen} toggle={toggleModal}>
          <ModalHeader toggle={toggleModal}>Annotation Details</ModalHeader>
          <ModalBody>
            {modalData ? (
              <>
                <p>
                  {modalData.transactionType === "buy" ? `Bought` : `Sold`}{" "}
                  {utilities.formatAsUSD(modalData.totalValueUsd)} on{" "}
                  {moment(modalData.blockTimestamp).format(
                    "Do MMM YYYY HH:mm:ss"
                  )}
                </p>
              </>
            ) : (
              <p>Loading...</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={toggleModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
};

export default PairDashboard;
