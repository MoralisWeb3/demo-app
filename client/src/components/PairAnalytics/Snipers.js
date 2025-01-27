import React, { useState, useEffect } from "react";
import { Table, Button, Collapse, Popover, PopoverBody } from "reactstrap";
import moment from "moment";
import * as utilities from "../../utilities.js";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const Transactions = ({ snipers }) => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [sniper, setSelectedHolder] = useState(null); // Store the clicked holder
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors

  const handleRowClick = (holder) => {
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

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>Status</th>
            <th>Wallet</th>
            <th>Blocks After</th>
            <th>Bought</th>
            <th>Sold</th>
            <th>PnL</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {snipers.map((sniper, index) => (
            <tr
              key={`sniper-list-${sniper.walletAddress}`}
              className="primary-row"
              onClick={() => handleRowClick(sniper)}
              style={{ cursor: "pointer" }}
            >
              <th>{index + 1}</th>
              <td>
                {sniper.currentBalance === sniper.totalTokensSniped
                  ? "💎 Held All"
                  : sniper.currentBalance === 0
                  ? "💀 Sold All"
                  : "⚠️ Sold Some"}
              </td>
              <td>{utilities.shortAddress(sniper.walletAddress)}</td>
              <td>
                {sniper.snipedTransactions[0].blocksAfterCreation === 0
                  ? "0 - Same Block"
                  : `${sniper.snipedTransactions[0].blocksAfterCreation} blocks after`}
              </td>
              <td className="negative">
                {utilities.formatPriceNumber(sniper.totalTokensSniped)} <br />{" "}
                {utilities.formatAsUSD(sniper.totalSnipedUsd)}
              </td>
              <td className={Number(sniper.totalSoldUsd) > 0 ? `positive` : ""}>
                {utilities.formatPriceNumber(sniper.totalTokensSold)} <br />{" "}
                {utilities.formatAsUSD(sniper.totalSoldUsd)}
              </td>
              <td
                className={
                  Number(sniper.realizedProfitUsd) > 0
                    ? `positive`
                    : Number(sniper.realizedProfitUsd) < 0
                    ? `negative`
                    : ""
                }
              >
                {utilities.formatAsUSD(sniper.realizedProfitUsd)}
              </td>
              <td>
                {utilities.formatPriceNumber(sniper.currentBalance)}
                <br />
                {utilities.formatAsUSD(sniper.currentBalanceUsdValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={"🎯 Sniper Details"}
        loading={loading}
        error={error}
        content={
          sniper && (
            <>
              <p>
                <strong>Address:</strong> {sniper.walletAddress}
              </p>
              <p>
                {sniper.currentBalance === sniper.totalTokensSniped
                  ? "💎 Held All"
                  : sniper.currentBalance === 0
                  ? "💀 Sold All"
                  : "⚠️ Sold Some"}
              </p>
              <p>
                <td>{utilities.shortAddress(sniper.walletAddress)}</td>
                <td>
                  {sniper.snipedTransactions[0].blocksAfterCreation === 0
                    ? "0 - Same Block"
                    : `${sniper.snipedTransactions[0].blocksAfterCreation} blocks after`}
                </td>
                <td className="negative">
                  {utilities.formatPriceNumber(sniper.totalTokensSniped)} <br />{" "}
                  {utilities.formatAsUSD(sniper.totalSnipedUsd)}
                </td>
                <td
                  className={Number(sniper.totalSoldUsd) > 0 ? `positive` : ""}
                >
                  {utilities.formatPriceNumber(sniper.totalTokensSold)} <br />{" "}
                  {utilities.formatAsUSD(sniper.totalSoldUsd)}
                </td>
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
                  <li key={`snipers-portfolio-${index}`}>
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
                  <li key={`snipers-history-${index}`} className="uniswap-item">
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

export default Transactions;
