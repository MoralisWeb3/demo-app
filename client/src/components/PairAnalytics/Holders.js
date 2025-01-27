import React, { useState } from "react";
import { Table } from "reactstrap";
import * as utilities from "../../utilities.js";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component
import "./PairDashboard.css"; // Import your CSS for styling
import moment from "moment";
import TransactionImage from "../WalletPortfolio/TransactionImage";
import SimpleCategory from "../WalletPortfolio/SimpleCategory";

const Holders = ({ holders }) => {
  const { globalDataCache } = useData();
  const [selectedHolder, setSelectedHolder] = useState(null); // Store the clicked holder
  const [walletData, setWalletData] = useState(null); // Store fetched wallet data
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors
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

  const handleRowClick = (holder) => {
    setSelectedHolder(holder); // Store the clicked holder
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(holder.owner_address); // Fetch additional wallet data
  };

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>Owner Address</th>
            <th>Address Type</th>
            <th>Balance</th>
            <th>Percentage Total Supply</th>
            <th>USD Value</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((owner, index) => (
            <tr
              key={owner.owner_address}
              className="primary-row"
              onClick={() => handleRowClick(owner)}
              style={{ cursor: "pointer" }}
            >
              <th scope="row">{index + 1}</th>
              <td>
                <div className="owner-details">
                  <div>
                    {owner.entity_logo ? (
                      <img src={owner.entity_logo} width="25" alt="Logo" />
                    ) : (
                      <img
                        className="profile-icon"
                        src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${owner.owner_address}`}
                        width="25"
                        alt="Avatar"
                      />
                    )}
                  </div>
                  <div>
                    <div className="right copy-container">
                      {owner.entity && (
                        <div className="entity-label">
                          <div className="address-label">
                            {owner.owner_address_label}
                          </div>
                          <div className="entity">{owner.entity}</div>
                        </div>
                      )}
                      {!owner.entity && owner.owner_address_label && (
                        <>{owner.owner_address_label}</>
                      )}
                      {!owner.entity && !owner.owner_address_label && (
                        <>{utilities.shortAddress(owner.owner_address)}</>
                      )}
                      <CopyToClipboard valueToCopy={owner.owner_address}>
                        <button></button>
                      </CopyToClipboard>
                    </div>
                  </div>
                </div>
              </td>
              <td>{owner.is_contract ? "Contract" : "Wallet"}</td>
              <td>
                {Number(owner.balance_formatted).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
              <td>
                {Number(owner.percentage_relative_to_total_supply).toFixed(2)}%
              </td>
              <td>
                $
                {Number(owner.usd_value).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={"💎 Holder Details"}
        loading={loading}
        error={error}
        content={
          selectedHolder && (
            <>
              <p>
                <strong>Address:</strong> {selectedHolder.owner_address}
              </p>
              <p>
                <strong>Balance:</strong> {selectedHolder.balance_formatted}
              </p>
              <p>
                <strong>Percentage of Total Supply:</strong>{" "}
                {selectedHolder.percentage_relative_to_total_supply.toFixed(2)}%
              </p>
              <p>
                <strong>USD Value:</strong> ${selectedHolder.usd_value}
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
                  <li key={index}>
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
                  <li key={index} className="uniswap-item">
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

export default Holders;
