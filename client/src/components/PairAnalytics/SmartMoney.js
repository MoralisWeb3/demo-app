import React, { useState } from "react";
import { Table, Collapse, Spinner } from "reactstrap";
import moment from "moment";
import * as utilities from "../../utilities.js";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const SmartMoney = ({ transactions }) => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [expandedRow, setExpandedRow] = useState(null); // Track which row is expanded
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors
  const [selectedHolder, setSelectedHolder] = useState(null); // Store the clicked holder
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state

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

  const handleRowClick = (transaction, sentence, summary) => {
    transaction.sentence = sentence;
    transaction.summary = summary;
    setSelectedHolder(transaction); // Store the clicked holder
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(transaction.walletAddress); // Fetch additional wallet data
  };

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Transaction</th>
            <th>USD Value</th>
            <th>Link</th>
            <th>Filter</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => {
            const isBuy = transaction.transactionType === "buy";
            const baseToken = isBuy ? transaction.bought : transaction.sold;

            // Use the reusable utility function
            const { sentence, baseTokenSummary } =
              utilities.getTransactionSummary(
                transaction,
                isBuy,
                baseToken,
                globalDataCache?.pairStats?.tokenSymbol
              );

            return (
              <React.Fragment key={`smart-list-${transaction.walletAddress}`}>
                <tr
                  key={`smart-row-${transaction.walletAddress}`}
                  className="primary-row"
                  onClick={() =>
                    handleRowClick(transaction, sentence, baseTokenSummary)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td className="timestamp">
                    {moment(transaction.blockTimestamp).fromNow()} <br />
                  </td>
                  <td>{isBuy ? "Buy" : "Sell"}</td>
                  <td
                    dangerouslySetInnerHTML={{
                      __html: `${sentence} ${baseTokenSummary}`,
                    }}
                  />
                  <td>{utilities.formatAsUSD(transaction.totalValueUsd)}</td>
                  <td>
                    <a
                      href={`https://etherscan.io/tx/${transaction.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tx
                    </a>
                  </td>
                  <td>Filter</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={"🔮 Smart Money Details"}
        loading={loading}
        error={error}
        content={
          selectedHolder && (
            <>
              <p>
                <strong>Address:</strong> {selectedHolder.walletAddress}
              </p>
              <div
                dangerouslySetInnerHTML={{
                  __html: `${selectedHolder.sentence} ${selectedHolder.summary}`,
                }}
              />
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
                  <li key={`smart-portfolio-${index}`}>
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
                  <li key={`smart-history-${index}`} className="uniswap-item">
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
    </>
  );
};

export default SmartMoney;
