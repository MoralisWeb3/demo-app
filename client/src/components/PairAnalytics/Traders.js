import React, { useState, useEffect } from "react";
import { Table, Button } from "reactstrap";
import moment from "moment";
import CopyToClipboard from "../Misc/CopyToClipboard";
import * as utilities from "../../utilities.js";
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const Traders = ({ traders }) => {
  const { globalDataCache } = useData();
  const [selectedHolder, setSelectedHolder] = useState(null); // Store the clicked holder
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors

  const handleRowClick = (holder) => {
    setSelectedHolder(holder); // Store the clicked holder
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(holder.address); // Fetch additional wallet data
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
            <th>Address</th>
            <th>Count of Trades</th>
            <th>Avg. Buy Price</th>
            <th>Avg. Sell Price</th>
            <th>Realized Profit %</th>
            <th>Realized Profit $</th>
            <th>Unrealized Profit %</th>
            <th>Unrealized Profit $</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {traders.map((trader, index) => (
            <React.Fragment key={`traders-${trader.address}`}>
              <tr
                key={`trader-row-${trader.address}`}
                className="primary-row"
                onClick={() => handleRowClick(trader)}
                style={{ cursor: "pointer" }}
              >
                <td>{index + 1}</td>
                <td className="flex-center">
                  <img
                    className="profile-icon"
                    src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${trader.address}`}
                    width="25"
                    alt="profile-icon"
                  />
                  {utilities.shortAddress(trader.address)}
                  <CopyToClipboard valueToCopy={trader.address} />
                </td>
                <td>{trader.count_of_trades}</td>
                <td>
                  {utilities.formatAsUSD(Number(trader.avg_buy_price_usd))}
                </td>
                <td>{utilities.formatAsUSD(trader.avg_sell_price_usd)}</td>
                <td className="positive buy">
                  <strong>
                    {utilities.formatPriceNumber(
                      trader.realized_profit_percentage
                    )}
                    %
                  </strong>
                </td>
                <td className="positive buy">
                  <strong>
                    {utilities.formatAsUSD(trader.realized_profit_usd)}
                  </strong>
                </td>
                <td>-</td>
                <td>-</td>
                <td>
                  <Button color="primary" size="sm">
                    Filter
                  </Button>
                </td>
              </tr>
              <tr>
                <td colSpan="10" className="p-0"></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </Table>

      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={"🏆 Top Trader Details"}
        loading={loading}
        error={error}
        content={
          selectedHolder && (
            <>
              <p>
                <strong>Address:</strong> {selectedHolder.address}
              </p>
              <p>
                <b>Trades:</b> {selectedHolder.count_of_trades}
              </p>
              <p>
                <b>Avg. Buy Price:</b>{" "}
                {utilities.formatAsUSD(
                  Number(selectedHolder.avg_buy_price_usd)
                )}
              </p>
              <p>
                <b>Avg. Sell Price:</b>{" "}
                {utilities.formatAsUSD(selectedHolder.avg_sell_price_usd)}
              </p>
              <p>
                <b>Tokens Bought:</b> {selectedHolder.total_tokens_bought}
              </p>
              <p>
                <b>Tokens Sold:</b> {selectedHolder.total_tokens_sold}
              </p>
              <p>
                <strong>Realized Profit:</strong>{" "}
                {selectedHolder.realized_profit_usd}
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
    </>
  );
};

export default Traders;
