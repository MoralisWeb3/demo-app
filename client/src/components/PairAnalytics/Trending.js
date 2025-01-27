import React, { useState, useEffect } from "react";
import { Collapse } from "reactstrap";
import moment from "moment";
import * as utilities from "../../utilities.js";
import "../TrendingFeed/Trending.css"; // Reuse the same CSS you already have
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const Trending = ({ trendingData }) => {
  const [filter, setFilter] = useState("all");
  const [expandedItem, setExpandedItem] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState([]); // Track new transaction IDs
  const { globalDataCache, setGlobalDataCache } = useData();

  const [trendingWallet, setSelectedHolder] = useState(null); // Store the clicked holder
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors

  const handleRowClick = (holder, sentence, category, baseTokenSummary) => {
    holder.sentence = sentence;
    holder.category = category;
    holder.baseTokenSummary = baseTokenSummary;
    setSelectedHolder(holder); // Store the clicked holder
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(holder.walletAddress); // Fetch additional wallet data
  };

  // Fetch wallet information
  const fetchWalletData = async (walletAddress) => {
    setLoading(true);
    setError(null);
    setWalletData(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/${walletAddress}/token/${globalDataCache.pairStats.tokenAddress}/top-holder?chain=${globalDataCache.selectedChain}`
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
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Highlighted IDs:", highlightedIds);
  }, [highlightedIds]);

  const [processedIds, setProcessedIds] = useState([]); // Tracks all processed transactions

  useEffect(() => {
    if (trendingData?.length) {
      // Extract transaction hashes from the current feed
      const currentIds = trendingData.map((tx) => tx.transactionHash);

      // Identify new transactions that haven't been processed
      const newIds = currentIds.filter((id) => !processedIds.includes(id));

      if (newIds.length > 0) {
        setHighlightedIds(newIds); // Highlight only the new transactions
        setProcessedIds((prev) => [...prev, ...newIds]); // Add new transactions to processed list
      }
    }
  }, [trendingData]);

  useEffect(() => {
    if (highlightedIds.length > 0) {
      const elements = document.querySelectorAll(".highlight");
      elements.forEach((el) => {
        el.classList.remove("highlight");
        void el.offsetWidth; // Trigger reflow to restart the animation
        el.classList.add("highlight");
      });

      const timeout = setTimeout(() => setHighlightedIds([]), 3000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedIds]);

  // Toggle expanded item
  const toggleExpandItem = (transactionHash) => {
    setExpandedItem((prev) =>
      prev === transactionHash ? null : transactionHash
    );
  };

  // Filter logic for transactions
  const filterTransactions = (transactions) => {
    if (filter === "largeTrade") {
      return transactions.filter((tx) => tx.type === "largeTrade");
    } else if (filter === "smartMoney") {
      return transactions.filter((tx) => tx.type === "smartMoney");
    } else if (filter === "whaleMovement") {
      return transactions.filter((tx) => tx.type === "whaleMovement");
    }
    return transactions; // Default: show all
  };

  return (
    <div className="trending-tab">
      {/* Filter Buttons */}
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
          💸 Large Trades
        </button>
        <button
          className={`btn ${filter === "whaleMovement" ? "active" : ""}`}
          onClick={() => setFilter("whaleMovement")}
        >
          🐋 Whale Movements
        </button>
        <button
          className={`btn ${filter === "smartMoney" ? "active" : ""}`}
          onClick={() => setFilter("smartMoney")}
        >
          🔮 Smart Money
        </button>
      </div>

      {/* Timeline */}
      <ul className="timeline">
        {trendingData &&
          filterTransactions(trendingData).map((transaction, index) => {
            const isBuy = transaction.transactionType === "buy";
            const baseToken = isBuy ? transaction.bought : transaction.sold;
            const isExpanded = expandedItem === transaction.transactionHash;

            const { sentence, category, baseTokenSummary } =
              utilities.getTransactionSummary(
                transaction,
                isBuy,
                baseToken,
                globalDataCache?.pairStats?.tokenSymbol
              );

            const isNew = highlightedIds.includes(transaction.transactionHash);

            return (
              <li
                onClick={() =>
                  handleRowClick(
                    transaction,
                    sentence,
                    category,
                    baseTokenSummary
                  )
                }
                key={`trending-${transaction.transactionHash}-${
                  highlightedIds.includes(transaction.transactionHash)
                    ? "highlighted"
                    : ""
                }`}
                className={`feed-item swap-item ${isBuy ? "buy" : "sell"} ${
                  isNew ? "highlight" : ""
                }`}
              >
                <div className="tx-type">
                  <div className={`icon ${transaction.type}`}>
                    {transaction.type === "whaleMovement" && <>🐋</>}
                    {transaction.type === "largeTrade" && <>💸</>}
                    {transaction.type === "smartMoney" && <>🔮</>}
                  </div>
                  <div>
                    <div className="category">{category}</div>
                  </div>
                </div>

                <div className="swap-line">
                  <div
                    className="swap-summary"
                    dangerouslySetInnerHTML={{
                      __html: `${sentence}${baseTokenSummary}`,
                    }}
                  />
                </div>

                <div className="swap-date">
                  {moment(transaction.blockTimestamp).fromNow()}
                </div>

                <Collapse isOpen={isExpanded}>
                  <div className="expanded-details">
                    <p>
                      Transaction Hash: {transaction.transactionHash}{" "}
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            transaction.transactionHash
                          )
                        }
                        className="copy-btn"
                      >
                        Copy
                      </button>
                    </p>
                    <p>
                      Wallet:{" "}
                      {utilities.shortAddress(transaction.walletAddress)}
                    </p>
                    <p>
                      Timestamp:{" "}
                      {moment(transaction.blockTimestamp).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}
                    </p>
                  </div>
                </Collapse>
              </li>
            );
          })}
      </ul>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={`🔍 ${trendingWallet?.category} Details`}
        loading={loading}
        error={error}
        content={
          trendingWallet && (
            <>
              <p>
                <strong>Address:</strong> {trendingWallet.walletAddress}
              </p>
              <p>
                <div
                  className="swap-summary"
                  dangerouslySetInnerHTML={{
                    __html: `${trendingWallet.sentence}${trendingWallet.baseTokenSummary}`,
                  }}
                />
              </p>
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
                  <li key={`trending-portfolio-${index}`}>
                    <img src={token.logo} alt={token.symbol} width="20" />
                    <div>{token.symbol}</div>
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
                  <li
                    key={`trending-history-${index}`}
                    className="uniswap-item"
                  >
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

export default Trending;
