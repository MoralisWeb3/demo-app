import React, { useState, useEffect } from "react";
import { Collapse } from "reactstrap"; // Import Collapse from Reactstrap
import { useData } from "../../DataContext";
import Skeleton from "../Misc/Skeleton";
import moment from "moment";
import "../WalletPortfolio/Wallet.css";
import "../PairAnalytics/PairStats.css";
import "./Trending.css";
import * as utilities from "../../utilities.js";
import CopyToClipboard from "../Misc/CopyToClipboard";
import MiniAreaChart from "./MiniAreaChart";
import SideDrawer from "../PairAnalytics/SideDrawer"; // Import the reusable SideDrawer component
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const TrendingFeed = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState([]); // Track new transaction IDs
  const [filter, setFilter] = useState("all"); // Filter state
  const [expandedItem, setExpandedItem] = useState(null); // Track expanded item
  const [selectedHolder, setSelectedHolder] = useState(null); // Store the clicked holder
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state

  const handleRowClick = (transaction, sentence, baseToken, isBuy) => {
    transaction.sentence = sentence;
    transaction.baseToken = baseToken;
    transaction.isBuy = isBuy;
    setSelectedHolder(transaction); // Store the clicked holder
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(transaction.walletAddress, baseToken.address); // Fetch additional wallet data
  };

  // Fetch wallet information
  const fetchWalletData = async (walletAddress, tokenAddress) => {
    setMenuLoading(true);
    setError(null);
    setWalletData(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/${walletAddress}/token/${tokenAddress}/top-holder?chain=${globalDataCache.selectedChain}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch wallet data");
      }
      const data = await response.json();
      setWalletData(data);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setError("Failed to load wallet data");
    } finally {
      setMenuLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: "1800px",
  };

  const fetchFeed = () => {
    setFeedLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/trending-feed`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch data");
        return response.json();
      })
      .then((fetchedData) => {
        setGlobalDataCache((prevData) => {
          const previousTransactions =
            prevData.trendingFeed?.sortedTransactions || [];

          // Filter for new transactions
          const newTransactions = fetchedData.sortedTransactions.filter(
            (tx) =>
              !previousTransactions.some(
                (prevTx) => prevTx.transactionHash === tx.transactionHash
              )
          );

          // Merge and sort transactions by blockTimestamp (most recent first)
          const updatedTransactions = [
            ...newTransactions,
            ...previousTransactions,
          ].sort(
            (a, b) => new Date(b.blockTimestamp) - new Date(a.blockTimestamp)
          );

          // Highlight new transactions
          setHighlightedIds(newTransactions.map((tx) => tx.transactionHash));

          return {
            ...prevData,
            trendingLoaded: true,
            trendingFeed: { sortedTransactions: updatedTransactions },
            favouriteTokens: fetchedData.tokenData,
            favouriteWallets: fetchedData.savedWallets,
          };
        });
        setFeedLoading(false);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setFeedLoading(false);
        setLoading(false);
      });
  };

  // Toggle expanded item
  const toggleExpandItem = (transactionHash) => {
    setExpandedItem((prev) =>
      prev === transactionHash ? null : transactionHash
    );
  };

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchFeed();
  }, []);

  // Poll every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(fetchFeed, 10000);
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  // Remove highlights after 3 seconds
  useEffect(() => {
    if (highlightedIds.length > 0) {
      const timeout = setTimeout(() => setHighlightedIds([]), 3000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedIds]);

  // Filter logic for transactions
  const filterTransactions = (transactions) => {
    if (filter === "largeTrade") {
      return transactions.filter((tx) => tx.type === "largeTrade");
    } else if (filter === "smartMoney") {
      return transactions.filter((tx) => tx.type === "smartMoney");
    } else if (filter === "whaleMovement") {
      return transactions.filter((tx) => tx.type === "whaleMovement");
    } else if (filter === "savedWalletActivity") {
      return transactions.filter((tx) => tx.type === "savedWalletActivity");
    }
    return transactions; // Default: show all
  };

  return (
    <div id="market-data" className="container" style={containerStyle}>
      <div className="row">
        <div className="col-md-3 offset-md-1">
          <div className="wallet-card saved-tokens">
            <h2>Saved Tokens</h2>
            {loading && <Skeleton />}
            <ul className="favourite-list">
              {globalDataCache.favouriteTokens && (
                <>
                  {globalDataCache.favouriteTokens.map((token, index) => {
                    const ohlcClosePrices =
                      token?.ohlcv?.map((entry) => entry.close)?.reverse() ||
                      [];

                    const trend =
                      ohlcClosePrices.length > 1
                        ? ohlcClosePrices[ohlcClosePrices.length - 1] -
                          ohlcClosePrices[0]
                        : 0;

                    return (
                      <li key={`${index}-symbol`}>
                        <div className="favourite-token">
                          <img
                            src={token?.price?.tokenLogo}
                            alt={token?.price?.tokenSymbol}
                          />
                          <div>
                            <div className="favourite-symbol">
                              {token?.price?.tokenSymbol}
                            </div>
                            <div className="favourite-name">Ethereum</div>
                          </div>
                        </div>
                        <div className="favourite-price">
                          <div
                            className={
                              Number(token?.price?.percentChange24h) > 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {Number(token?.price?.percentChange24h).toFixed(2)}%
                          </div>
                          <div className="price">
                            {utilities.formatAsUSD(token?.price?.usdPrice)}
                          </div>
                        </div>
                        <div className="favourite-chart">
                          {ohlcClosePrices.length > 0 && (
                            <MiniAreaChart
                              data={ohlcClosePrices}
                              trend={trend}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>

            <h2>Saved Wallets</h2>
            <ul className="favourite-list">
              {globalDataCache.favouriteWallets && (
                <>
                  {globalDataCache.favouriteWallets.map((address, index) => (
                    <li>
                      <div>
                        <div className="favourite-symbol">{address.name}</div>
                        <div className="favourite-name">{address.address}</div>
                      </div>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="wallet-card">
            <h2>
              Trending Feed{" "}
              <div className="live-indicator">
                <div className="dot"></div>
              </div>
            </h2>

            <div className="filter-buttons">
              <button
                className={`btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                className={`btn ${filter === "largeTrade" ? "active" : ""}`}
                onClick={() => setFilter("largeTrade")}
              >
                ⚡️ <br />
                Significant Trades
              </button>
              <button
                className={`btn ${filter === "whaleMovement" ? "active" : ""}`}
                onClick={() => setFilter("whaleMovement")}
              >
                🐋 <br />
                Whale Movements
              </button>
              <button
                className={`btn ${filter === "smartMoney" ? "active" : ""}`}
                onClick={() => setFilter("smartMoney")}
              >
                🔮 <br />
                Smart Money
              </button>
              <button
                className={`btn ${
                  filter === "savedWalletActivity" ? "active" : ""
                }`}
                onClick={() => setFilter("savedWalletActivity")}
              >
                ⭐️ <br />
                Saved Wallets
              </button>
            </div>

            {loading && <Skeleton />}
            {error && <div className="text-red-500">{error}</div>}
            <ul className="">
              {globalDataCache.trendingFeed &&
                filterTransactions(
                  globalDataCache.trendingFeed.sortedTransactions
                ).map((transaction, index) => {
                  const isBuy = transaction.transactionType === "buy";
                  const baseToken = isBuy
                    ? transaction.bought
                    : transaction.sold;

                  const isExpanded =
                    expandedItem === transaction.transactionHash;

                  let sentence = "";
                  let category = "";
                  switch (transaction.type) {
                    case "largeTrade":
                      sentence = `A whale wallet just `;
                      category = "Large Trade";
                      break;
                    case "tradeIdea":
                      sentence = `A whale wallet just `;
                      category = "Trade Idea";
                      break;
                    case "smartMoney":
                      sentence = `A top trader of ${transaction.token} just `;
                      category = "Smart Money Movements";
                      break;
                    case "whaleMovement":
                      sentence = `A top holder of ${transaction.token} just `;
                      category = "Whale Movements";
                      break;
                    case "savedWalletActivity":
                      sentence = `Saved wallet just `;
                      category = "Saved Wallet";
                      break;
                    default:
                      sentence = `Transaction for ${transaction.token}`;
                  }

                  const isNew = highlightedIds.includes(
                    transaction.transactionHash
                  );

                  return (
                    <li
                      className={`feed-item swap-item ${
                        isBuy ? "buy" : "sell"
                      } ${isNew ? "highlight" : ""}`}
                      key={index}
                      onClick={() =>
                        handleRowClick(transaction, sentence, baseToken, isBuy)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div className="tx-type">
                        <div className={`icon ${transaction.type}`}>
                          {transaction.type === "whaleMovement" && <>🐋</>}
                          {transaction.type === "tradeIdea" && <>⚡️</>}
                          {transaction.type === "largeTrade" && <>💸</>}
                          {transaction.type === "smartMoney" && <>🔮</>}
                          {transaction.type === "savedWalletActivity" && (
                            <>⭐️</>
                          )}
                        </div>
                        <div>
                          <div className="category">{category}</div>
                        </div>
                      </div>

                      <div className="swap-line">
                        <div className="swap-summary">
                          {sentence}
                          <strong>
                            {isBuy ? (
                              <span className="positive">bought</span>
                            ) : (
                              <span className="negative">sold</span>
                            )}{" "}
                            <span className="usd-amount">
                              {utilities.formatAsUSD(transaction.totalValueUsd)}
                            </span>
                          </strong>{" "}
                          of{" "}
                          <a
                            href={`https://moralis.com/chain/ethereum/token/price/${baseToken.address}`}
                            target="_blank"
                          >
                            {baseToken.logo && (
                              <img
                                src={baseToken.logo}
                                width="20"
                                alt={baseToken.symbol}
                              />
                            )}
                            <strong>{baseToken.symbol} </strong>
                          </a>
                          (
                          <span className={isBuy ? "buy" : "sell"}>
                            {isBuy ? "+" : ""}
                            {utilities.formatPriceNumber(baseToken.amount)}
                          </span>
                          )
                        </div>
                      </div>

                      <div className="swap-date">
                        {moment(transaction.blockTimestamp).fromNow()} because
                        you follow {transaction.token}
                      </div>

                      <Collapse isOpen={isExpanded}>
                        <div className="expanded-details">
                          <p>
                            Block Timestamp:{" "}
                            {moment(transaction.blockTimestamp).format(
                              "YYYY-MM-DD HH:mm:ss"
                            )}
                          </p>
                          <p>
                            Wallet Address:{" "}
                            {utilities.shortAddress(transaction.walletAddress)}
                          </p>
                          <CopyToClipboard
                            valueToCopy={transaction.walletAddress}
                          >
                            <button>Copy Wallet</button>
                          </CopyToClipboard>
                        </div>
                      </Collapse>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      </div>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={
          <>
            {selectedHolder?.type === "whaleMovement" && <>🐋 Whale Details</>}
            {selectedHolder?.type === "tradeIdea" && (
              <>⚡️ Large Trader Details</>
            )}
            {selectedHolder?.type === "largeTrade" && (
              <>💸 Large Trader Details</>
            )}
            {selectedHolder?.type === "smartMoney" && (
              <>🔮 Smart Money Details</>
            )}
            {selectedHolder?.type === "savedWalletActivity" && (
              <>⭐️ Saved Wallet Details</>
            )}
          </>
        }
        loading={menuLoading}
        error={error}
        content={
          selectedHolder && (
            <>
              <p>
                <strong>Address:</strong> {selectedHolder.walletAddress}
              </p>
              <p>
                <strong>Transaction Hash:</strong>{" "}
                {selectedHolder.transactionHash}
              </p>
              <div className="swap-summary">
                {selectedHolder.sentence}
                <strong>
                  {selectedHolder.isBuy ? (
                    <span className="positive">bought</span>
                  ) : (
                    <span className="negative">sold</span>
                  )}{" "}
                  <span className="usd-amount">
                    {utilities.formatAsUSD(selectedHolder.totalValueUsd)}
                  </span>
                </strong>{" "}
                of{" "}
                <a
                  href={`https://moralis.com/chain/ethereum/token/price/${selectedHolder.baseToken.address}`}
                  target="_blank"
                >
                  {selectedHolder.baseToken.logo && (
                    <img
                      src={selectedHolder.baseToken.logo}
                      width="20"
                      alt={selectedHolder.baseToken.symbol}
                    />
                  )}
                  <strong>{selectedHolder.baseToken.symbol} </strong>
                </a>
                (
                <span className={selectedHolder.isBuy ? "buy" : "sell"}>
                  {selectedHolder.isBuy ? "+" : ""}
                  {utilities.formatPriceNumber(selectedHolder.baseToken.amount)}
                </span>
                )
              </div>
            </>
          )
        }
        loadedContent={
          walletData && (
            <div>
              <h5>
                <b>Portfolio</b>
              </h5>
              <ul className="mini-token-list">
                {walletData.tokenBalances.map((token, index) => (
                  <li key={`traders-portfolio-${index}`}>
                    <img src={token.logo} alt={token.symbol} width="20" />
                    <div>
                      <a
                        href={`https://moralis.com/chain/ethereum/token/price/${token.token_address}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {token.symbol}
                      </a>
                    </div>
                    <div className="token-balance">
                      {utilities.formatAsUSD(token.usd_value)} (
                      <span
                        className={`${
                          Number(token.usd_price_24hr_percent_change) > 0
                            ? `positive`
                            : `negative`
                        }`}
                      >
                        {Number(token.usd_price_24hr_percent_change).toFixed(2)}
                        %
                      </span>
                      )
                    </div>
                  </li>
                ))}
              </ul>

              <h5>
                <b>Recent Activity</b>
              </h5>

              <ul className="mini-history">
                {walletData.walletHistory.map((item, index) => (
                  <li key={`traders-history-${index}`} className="uniswap-item">
                    <div className="history-icon">
                      <TransactionImage transaction={item} chain={item.chain} />
                    </div>
                    <div className="tx-detail">
                      <div className="tx-category">
                        <SimpleCategory category={item.category} />
                      </div>
                      <div className="summary">{item.summary}</div>
                    </div>
                    <div className="date">
                      {moment(item.block_timestamp).fromNow()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        type="holders"
      />
    </div>
  );
};

export default TrendingFeed;
