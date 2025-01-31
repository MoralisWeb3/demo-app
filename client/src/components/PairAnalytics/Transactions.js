import React, { useState, useEffect } from "react";
import { Table, Button, Popover, PopoverBody } from "reactstrap";
import moment from "moment";
import ExpandedRow from "./ExpandedRow";
import CopyToClipboard from "../Misc/CopyToClipboard";
import * as utilities from "../../utilities.js";
import { useData } from "../../DataContext";
import SideDrawer from "./SideDrawer"; // Import the reusable SideDrawer component

const Transactions = ({
  pairLabel,
  transactions = [],
  lastTransactions = [],
  filterByWallet,
  resetFilter,
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(null);
  const [walletData, setWalletData] = useState({});
  const { globalDataCache, setGlobalDataCache } = useData();
  const [baseToken, quoteToken] = pairLabel.split("/");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Track side menu state
  const [loading, setLoading] = useState(false); // Track loading state for API calls
  const [error, setError] = useState(null); // Track errors

  const openSidebar = (tx) => {
    setSelectedTx(tx); // Store the clicked holder
    setGlobalDataCache((prev) => ({
      ...prev,
      walletData: null,
    }));
    setIsMenuOpen(true); // Open the sidebar
    fetchWalletData(tx.walletAddress); // Fetch additional wallet data
  };

  const fetchWalletData = async (walletAddress) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/${walletAddress}/token/${globalDataCache.pairStats.tokenAddress}?chain=${globalDataCache.selectedChain}`
      );
      const walletStats = await response.json();
      const tokenPrice = parseFloat(
        globalDataCache?.pairStats?.currentUsdPrice || 0
      );
      const unrealizedPnl = walletStats.tokenBalance
        ? Number(walletStats?.tokenBalance) * tokenPrice
        : 0;

      setGlobalDataCache((prev) => ({
        ...prev,
        walletData: {
          ethBalance: walletStats?.tokenBalances[0]?.balance_formatted || 0,
          tokenBalance: walletStats?.tokenBalance || 0,
          tokenBalances: walletStats.tokenBalances,
          swaps: walletStats?.swaps || [],
          realizedPnl: walletStats?.pnl?.realized_profit_usd || 0,
          realizedPnlPercentage:
            walletStats?.pnl?.realized_profit_percentage || 0,
          avgBuyPrice: walletStats?.pnl?.avg_buy_price_usd || 0,
          avgSellPrice: walletStats?.pnl?.avg_sell_price_usd || 0,
          buyTransactions: walletStats.swapsSummary.buyTransactions,
          sellTransactions: walletStats.swapsSummary.sellTransactions,
          buyVolume: walletStats.swapsSummary.buyVolume,
          sellVolume: walletStats.swapsSummary.sellVolume,
          unrealizedPnl,
        },
      }));

      setWalletData((prev) => ({
        ...prev,
        [walletAddress]: {
          ethBalance: walletStats?.tokenBalances[0]?.balance_formatted || 0,
          tokenBalance: walletStats?.tokenBalance || 0,
          tokenBalances: walletStats.tokenBalances,
          swaps: walletStats?.swaps || [],
          realizedPnl: walletStats?.pnl?.realized_profit_usd || 0,
          realizedPnlPercentage:
            walletStats?.pnl?.realized_profit_percentage || 0,
          avgBuyPrice: walletStats?.pnl?.avg_buy_price_usd || 0,
          avgSellPrice: walletStats?.pnl?.avg_sell_price_usd || 0,
          buyTransactions: walletStats.swapsSummary.buyTransactions,
          sellTransactions: walletStats.swapsSummary.sellTransactions,
          buyVolume: walletStats.swapsSummary.buyVolume,
          sellVolume: walletStats.swapsSummary.sellVolume,
          unrealizedPnl,
        },
      }));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  const toggleRowExpansion = (uniqueKey) => {
    setExpandedRow(expandedRow === uniqueKey ? null : uniqueKey); // Toggle the specific row

    // Extract walletAddress from the unique key
    const walletAddress = uniqueKey.split("_")[1];

    if (!walletData[walletAddress]) {
      fetchWalletData(walletAddress); // Fetch wallet data if not already loaded
    }
  };

  const togglePopover = (walletAddress) => {
    fetchWalletData(walletAddress);
    setPopoverOpen(popoverOpen === walletAddress ? null : walletAddress);
  };

  const handleFilterByWallet = async (walletAddress) => {
    setGlobalDataCache((prev) => ({
      ...prev,
      transactionsFiltered: true,
      filteredWallet: walletAddress,
    }));
    await filterByWallet(walletAddress);
  };

  const handleResetFilter = () => {
    resetFilter();
    setGlobalDataCache((prev) => ({
      ...prev,
      transactionsFiltered: false,
      filteredWallet: null,
    }));
  };

  const walletCounts = transactions.reduce((acc, tx) => {
    acc[tx.walletAddress] = (acc[tx.walletAddress] || 0) + 1;
    return acc;
  }, {});

  const contentRenderer = (walletDetails) => (
    <>
      <div className="row">
        {/* Left column: PnL stats */}
        <div className="col-lg-4">
          <div className="wallet-card secondary-row">
            <h6>
              <b>PnL Details</b>
            </h6>
            <ul className="stats-list">
              <li>
                <strong>ETH Balance:</strong>{" "}
                {utilities.formatPriceNumber(walletDetails.ethBalance)}
              </li>
              <li>
                <strong>Token Balance:</strong>{" "}
                {utilities.formatPriceNumber(walletDetails.tokenBalance)}
              </li>
              <li>
                <strong>Realized PnL:</strong>{" "}
                {utilities.formatAsUSD(walletDetails.realizedPnl)} (
                {Number(walletDetails.realizedPnlPercentage).toFixed(2)}%)
              </li>
              <li>
                <strong>Unrealized PnL:</strong>{" "}
                {utilities.formatAsUSD(walletDetails.unrealizedPnl)}
              </li>
              <li>
                <strong>Avg Buy Price:</strong>{" "}
                {utilities.formatAsUSD(walletDetails.avgBuyPrice)}
              </li>
              <li>
                <strong>Avg Sell Price:</strong>{" "}
                {utilities.formatAsUSD(walletDetails.avgSellPrice)}
              </li>
            </ul>
          </div>
        </div>

        {/* Middle column: Portfolio */}
        <div className="col-lg-4">
          <div className="wallet-card secondary-row">
            <h6>
              <b>Portfolio</b>
            </h6>
            <ul className="mini-token-list">
              {walletDetails.tokenBalances.map((token, index) => (
                <li key={index}>
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
                      {Number(token.usd_price_24hr_percent_change).toFixed(2)}%
                    </span>
                    )
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column: Activity stats */}
        <div className="col-lg-4">
          <div className="wallet-card secondary-row">
            <h6>
              <b>7d Activity</b>
            </h6>
            <div className="row">
              <div className="col-lg-3 border-right">
                <div className="stat-totals">
                  <div className="stat-total">
                    <div>Swaps</div>
                    <div className="value">
                      {walletDetails.buyTransactions +
                        walletDetails.sellTransactions}
                    </div>
                  </div>
                  <div className="stat-total">
                    <div>Volume</div>
                    <div className="value">
                      $
                      {utilities.abbreviateNumber(
                        walletDetails.buyVolume + walletDetails.sellVolume
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-9">
                <div className="stat-group">
                  <div className="stat-titles">
                    <div>
                      Buys
                      <div className="value">
                        {walletDetails.buyTransactions}
                      </div>
                    </div>
                    <div className="right">
                      Sells
                      <div className="value">
                        {walletDetails.sellTransactions}
                      </div>
                    </div>
                  </div>
                  <div className="stat-bar">
                    {(() => {
                      const totalTransactions =
                        walletDetails.buyTransactions +
                        walletDetails.sellTransactions;
                      const buyPercentage =
                        totalTransactions > 0
                          ? (walletDetails.buyTransactions /
                              totalTransactions) *
                            100
                          : 0;
                      const sellPercentage = 100 - buyPercentage;

                      return (
                        <>
                          <div
                            className="bar green"
                            style={{ width: `${buyPercentage}%` }}
                          ></div>
                          <div
                            className="bar red"
                            style={{ width: `${sellPercentage}%` }}
                          ></div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="stat-group">
                  <div className="stat-titles">
                    <div>
                      Buy Volume
                      <div className="value">
                        {utilities.abbreviateNumber(walletDetails.buyVolume)}
                      </div>
                    </div>
                    <div className="right">
                      Sell Volume
                      <div className="value">
                        {utilities.abbreviateNumber(walletDetails.sellVolume)}
                      </div>
                    </div>
                  </div>
                  <div className="stat-bar">
                    {(() => {
                      const totalVolume =
                        walletDetails.buyVolume + walletDetails.sellVolume;
                      const buyPercentage =
                        totalVolume > 0
                          ? (walletDetails.buyVolume / totalVolume) * 100
                          : 0;
                      const sellPercentage = 100 - buyPercentage;

                      return (
                        <>
                          <div
                            className="bar green"
                            style={{ width: `${buyPercentage}%` }}
                          ></div>
                          <div
                            className="bar red"
                            style={{ width: `${sellPercentage}%` }}
                          ></div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h6>
          <b>Recent Trades</b>
        </h6>
        {walletDetails.swaps && (
          <ul className="swap-events">
            {walletDetails.swaps.map((transaction, index) => {
              // Parse the pairLabel to separate base and quote tokens
              const [baseTokenLabel, quoteTokenLabel] =
                transaction.pairLabel.split("/");

              const isBuy = transaction.transactionType === "buy";
              const baseToken = isBuy ? transaction.bought : transaction.sold;
              const quoteToken = isBuy ? transaction.sold : transaction.bought;

              return (
                <li
                  className={isBuy ? "swap-item buy" : "swap-item sell"}
                  key={index}
                >
                  <div className="swap-line">
                    {/* Swap type */}
                    <div className="swap-type">{isBuy ? "Buy" : "Sell"}</div>

                    {/* Swap summary */}
                    <div className="swap-summary">
                      {isBuy ? "Bought" : "Sold"}{" "}
                      <span className={isBuy ? "positive" : "negative"}>
                        {utilities.formatPriceNumber(baseToken.amount)}{" "}
                      </span>
                      <a
                        href={`https://moralis.com/chain/ethereum/token/price/${baseToken.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={baseToken.logo}
                          alt={baseToken.symbol}
                          width="20"
                        />
                        {baseToken.symbol}{" "}
                      </a>{" "}
                      (
                      <span className="usd-amount">
                        {utilities.formatAsUSD(transaction.totalValueUsd)}
                      </span>
                      )
                    </div>

                    {/* For what value */}
                    <div>
                      for{" "}
                      <span className="swapped-for">
                        {utilities.formatPriceNumber(quoteToken.amount)}{" "}
                        {quoteToken.symbol}
                      </span>
                    </div>

                    {/* Date and exchange */}
                    <div className="swap-date">
                      {moment(transaction.blockTimestamp).fromNow()} via{" "}
                      <img
                        src={transaction.exchangeLogo}
                        alt={transaction.exchangeName}
                        width="20"
                      />{" "}
                      {transaction.exchangeName}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );

  return (
    <>
      {globalDataCache.transactionsFiltered && (
        <div className="filter-info">
          <p>
            Filtering by wallet:{" "}
            {utilities.shortAddress(globalDataCache.filteredWallet)}
          </p>
          <Button color="secondary" onClick={handleResetFilter}>
            Reset Filter
          </Button>
        </div>
      )}

      <Table>
        <thead>
          <tr>
            <th>Date</th>
            <th className="text-center">Type</th>
            <th>Position</th>
            <th className="text-right">USD</th>
            <th className="text-right">{baseToken}</th>
            <th className="text-right">{quoteToken}</th>
            <th className="text-right">Price</th>
            <th className="text-center">Maker</th>
            <th>Filter</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const uniqueKey = `${tx.transactionHash}_${tx.walletAddress}`; // Create a unique key for each row
            const isExpanded = expandedRow === uniqueKey; // Check if this row is expanded

            const isNewTransaction = lastTransactions.some(
              (newTx) => newTx.transactionHash === tx.transactionHash
            );
            const isRepeatedWallet = walletCounts[tx.walletAddress] > 1;
            const tradeSizeLabel = utilities.getTradeSizeLabel(
              tx.totalValueUsd
            );

            return (
              <React.Fragment key={tx.transactionHash}>
                <tr
                  key={`tx-row-${tx.transactionHash}`}
                  onClick={() => openSidebar(tx)}
                  style={{ cursor: "pointer" }}
                  className={`transaction-row primary-row ${
                    tx.transactionType
                  } ${
                    lastTransactions.some(
                      (newTx) => newTx.transactionHash === tx.transactionHash
                    )
                      ? "new-transaction"
                      : ""
                  }`}
                >
                  <td>{moment(tx.blockTimestamp).fromNow()}</td>
                  <td className="text-center">
                    {tx.transactionType === "buy" ? "Buy" : "Sell"}
                  </td>
                  <td>
                    {" "}
                    {tx.subCategory === "newPosition" && <>✨ New Position</>}
                    {tx.subCategory === "accumulation" && <>📶 Accumulation</>}
                    {tx.subCategory === "partialSell" && <>📉 Partial Sell</>}
                    {tx.subCategory === "sellAll" && <>🚨 Sold All</>}
                  </td>
                  <td className="text-right">
                    {utilities.formatAsUSD(tx.totalValueUsd)} {tradeSizeLabel}
                  </td>
                  <td className="text-right">
                    {utilities.formatPriceNumber(tx.baseTokenAmount)}
                  </td>
                  <td className="text-right">
                    {utilities.formatPriceNumber(tx.quoteTokenAmount)}
                  </td>
                  <td className="text-right">
                    {utilities.formatAsUSD(tx.baseTokenPriceUsd)}
                  </td>
                  <td className="wallet-address">
                    <div
                      id={`maker-${tx.walletAddress}`}
                      className="copy-container"
                    >
                      <div
                        className="address"
                        onMouseEnter={() => togglePopover(tx.walletAddress)}
                        onMouseLeave={() => setPopoverOpen(null)}
                      >
                        {utilities.shortAddress(tx.walletAddress)}
                      </div>
                      <CopyToClipboard valueToCopy={tx.walletAddress}>
                        <button></button>
                      </CopyToClipboard>
                      <button
                        onClick={() => toggleRowExpansion(uniqueKey)} // Pass the unique key
                      >
                        🔽
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation(); // Prevent the click from propagating to the parent <tr>
                          openSidebar(tx);
                        }}
                      >
                        👁
                      </button>
                      {tx.subCategory === "newPosition" &&
                        Number(tx.totalValueUsd) < 1 && <div>⚠️</div>}
                      <div className="repeat">
                        {isRepeatedWallet ? `🧐` : " "}
                      </div>
                    </div>

                    {popoverOpen === tx.walletAddress && (
                      <Popover
                        target={`maker-${tx.walletAddress}`}
                        isOpen={popoverOpen === tx.walletAddress}
                        placement="left"
                      >
                        <PopoverBody>
                          {walletData[tx.walletAddress] ? (
                            <div>
                              <p>
                                <strong>ETH Balance:</strong>{" "}
                                {walletData[tx.walletAddress].ethBalance}
                              </p>
                              <p>
                                <strong>{baseToken} Balance:</strong>{" "}
                                {walletData[tx.walletAddress].tokenBalance}
                              </p>
                              <p>
                                <strong>Unrealized PnL:</strong>{" "}
                                {utilities.formatAsUSD(
                                  walletData[tx.walletAddress].unrealizedPnl
                                )}
                              </p>
                            </div>
                          ) : (
                            <div>Loading...</div>
                          )}
                        </PopoverBody>
                      </Popover>
                    )}
                  </td>
                  <td>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterByWallet(tx.walletAddress);
                      }}
                    >
                      Filter
                    </Button>
                  </td>
                </tr>
                <tr className="secondary-row">
                  <td className="p-0" colSpan="9">
                    <ExpandedRow
                      isOpen={isExpanded}
                      address={tx.walletAddress}
                      fetchWalletInfo={fetchWalletData}
                      walletData={walletData}
                      contentRenderer={contentRenderer}
                    />
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={`🔍 Transaction Details`}
        loading={loading}
        error={error}
        content={
          <>
            <p>
              <b>Maker Address:</b> {selectedTx?.walletAddress}
            </p>
            <p>
              <b>Transcation Hash:</b> {selectedTx?.transactionHash}
            </p>
            <p>
              <b>Type:</b>{" "}
              {selectedTx?.transactionType === "buy" ? "Buy" : "Sell"},{" "}
              {selectedTx?.subCategory === "newPosition" && (
                <>✨ New Position</>
              )}
              {selectedTx?.subCategory === "accumulation" && (
                <>📶 Accumulation</>
              )}
              {selectedTx?.subCategory === "partialSell" && (
                <>📉 Partial Sell</>
              )}
              {selectedTx?.subCategory === "sellAll" && <>🚨 Sold All</>}
            </p>
            <p>
              <b>Timestamp:</b> {selectedTx?.blockTimestamp}
            </p>
            <p>
              <b>Block Number:</b> {selectedTx?.blockNumber}
            </p>
            <p>
              <b>Base Token:</b>{" "}
              {utilities.formatPriceNumber(
                selectedTx?.baseTokenAmount ? selectedTx?.baseTokenAmount : 0
              )}{" "}
              @{" "}
              {utilities.formatAsUSD(
                selectedTx?.baseTokenPriceUsd
                  ? selectedTx?.baseTokenPriceUsd
                  : 0
              )}
            </p>
            <p>
              <b>Total Value:</b>{" "}
              {utilities.formatAsUSD(
                selectedTx?.totalValueUsd ? selectedTx?.totalValueUsd : 0
              )}
            </p>
          </>
        }
        loadedContent={
          globalDataCache.walletData && (
            <>
              <h5>Maker Portfolio</h5>
              <ul className="mini-token-list">
                {globalDataCache.walletData.tokenBalances.map(
                  (token, index) => (
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
                          {Number(token.usd_price_24hr_percent_change).toFixed(
                            2
                          )}
                          %
                        </span>
                        )
                      </div>
                    </li>
                  )
                )}
              </ul>

              <h5>Maker PnL</h5>

              <ul className="stats-list">
                <li>
                  <div>ETH Balance: </div>
                  <div>
                    {utilities.formatPriceNumber(
                      globalDataCache.walletData.ethBalance
                    )}
                  </div>
                </li>
                <li>
                  <div>Token Balance: </div>
                  <div>
                    {utilities.formatPriceNumber(
                      globalDataCache.walletData.tokenBalance
                    )}
                  </div>
                </li>
                <li>
                  <div>Realized PnL: </div>
                  <div>
                    {utilities.formatAsUSD(
                      globalDataCache.walletData.realizedPnl
                    )}{" "}
                    (
                    {Number(
                      globalDataCache.walletData.realizedPnlPercentage
                    ).toFixed(2)}
                    %)
                  </div>
                </li>
                <li>
                  <div>Unrealized PnL: </div>
                  <div>
                    {utilities.formatAsUSD(
                      globalDataCache.walletData.unrealizedPnl
                    )}
                  </div>
                </li>
                <li>
                  <div>Avg Buy Price: </div>
                  <div>
                    {utilities.formatAsUSD(
                      globalDataCache.walletData.avgBuyPrice
                    )}
                  </div>
                </li>
                <li>
                  <div>Avg Sell Price: </div>
                  <div>
                    {utilities.formatAsUSD(
                      globalDataCache.walletData.avgSellPrice
                    )}
                  </div>
                </li>
              </ul>

              <h5>Maker Recent Activity</h5>

              {globalDataCache.walletData.swaps && (
                <ul className="swap-events">
                  {globalDataCache.walletData.swaps.map(
                    (transaction, index) => {
                      // Parse the pairLabel to separate base and quote tokens
                      const [baseTokenLabel, quoteTokenLabel] =
                        transaction.pairLabel.split("/");

                      const isBuy = transaction.transactionType === "buy";
                      const baseToken = isBuy
                        ? transaction.bought
                        : transaction.sold;
                      const quoteToken = isBuy
                        ? transaction.sold
                        : transaction.bought;

                      return (
                        <li
                          className={isBuy ? "swap-item buy" : "swap-item sell"}
                          key={index}
                        >
                          <div className="swap-line">
                            {/* Swap type */}
                            <div className="swap-type">
                              {isBuy ? "Buy" : "Sell"}
                            </div>

                            {/* Swap summary */}
                            <div className="swap-summary">
                              {isBuy ? "Bought" : "Sold"}{" "}
                              <span className={isBuy ? "positive" : "negative"}>
                                {utilities.formatPriceNumber(baseToken.amount)}{" "}
                              </span>
                              <a
                                href={`https://moralis.com/chain/ethereum/token/price/${baseToken.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={baseToken.logo}
                                  alt={baseToken.symbol}
                                  width="20"
                                />
                                {baseToken.symbol}{" "}
                              </a>{" "}
                              (
                              <span className="usd-amount">
                                {utilities.formatAsUSD(
                                  transaction.totalValueUsd
                                )}
                              </span>
                              )
                            </div>

                            {/* For what value */}
                            <div>
                              for{" "}
                              <span className="swapped-for">
                                {utilities.formatPriceNumber(quoteToken.amount)}{" "}
                                {quoteToken.symbol}
                              </span>
                            </div>

                            {/* Date and exchange */}
                            <div className="swap-date">
                              {moment(transaction.blockTimestamp).fromNow()} via{" "}
                              <img
                                src={transaction.exchangeLogo}
                                alt={transaction.exchangeName}
                                width="20"
                              />{" "}
                              {transaction.exchangeName}
                            </div>
                          </div>
                        </li>
                      );
                    }
                  )}
                </ul>
              )}
            </>
          )
        }
        type="tx"
      />
    </>
  );
};

export default Transactions;
