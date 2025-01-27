import React, { useEffect, useState } from "react";
import { useData } from "../../DataContext";
import Skeleton from "../Misc/Skeleton";
import TokenLogo from "../WalletPortfolio/TokenLogo";
import Loader from "../Misc/Loader";
import TokenPriceChart from "./TokenPriceChart";
import ExternalLinkIcon from "../Misc/ExternalLinkIcon";
import moment from "moment";
import { UncontrolledTooltip } from "reactstrap";
import { Link } from "react-router-dom";
import * as utilities from "../../utilities.js";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
import classnames from "classnames";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import NavBar from "../Misc/NavBar";
import ProgressBar from "../Misc/ProgressBar";

const TokenDashboard = ({ topOwnersLoading, tokenPricesLoading }) => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(!globalDataCache);
  const [priceLoading, setPriceLoading] = useState();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const navigate = useNavigate();

  const goBack = () => {
    setGlobalDataCache((prevData) => ({
      ...prevData,
      initialTokenLoaded: false,
      token: null,
    }));
    navigate(-1);
  };

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const handleTokenClick = (token) => {
    navigate(`/tokens/${token.token_address}`);
  };

  const { tokenAddress } = useParams();

  const fetchToken = async (address) => {
    setLoading(true);
    setPriceLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // hasData = false;
        setGlobalDataCache((prevData) => ({
          ...prevData,
          initialTokenLoaded: true,
          token: data,
        }));
        fetchChartPrices(address);
        fetchTransfers(address);
        fetchTopOwners(address);
        fetchPNL(address);
      } else {
        setError(`Please provide a valid address.`);
      }
    } catch (error) {
      console.error("There was an error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartPrices = (address) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/token/${address}/prices`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          token: {
            ...prevData.token,
            tokenPrices: data.tokenPrices,
            tokenPriceStats: data.tokenPriceStats,
          },
        }));
        setPriceLoading(false);
      })
      .catch((error) => {
        setError(error);
        setPriceLoading(false);
      });
  };

  const fetchPNL = (address) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/token/${address}/pnl`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          token: {
            ...prevData.token,
            tokenPNL: data.tokenPNL,
          },
        }));
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchTopOwners = (address) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/token/${address}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          token: {
            ...prevData.token,
            tokenOwners: data.tokenOwners,
            topTokenOwners: data.topTokenOwners,
            totalBalance: data.totalBalance,
            totalUsd: data.totalUsd,
            totalPercentage: data.totalPercentage,
            commonTokens: data.commonTokens,
          },
        }));
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchTransfers = (address) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/token/${address}/transfers`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          token: {
            ...prevData.token,
            tokenTransfers: data.tokenTransfers,
          },
        }));
      })
      .catch((error) => {
        setError(error);
      });
  };

  useEffect(() => {}, [globalDataCache]);

  useEffect(() => {
    const shouldFetchTokenData =
      !globalDataCache.token ||
      globalDataCache.token.tokenAddress !== tokenAddress;
    if (shouldFetchTokenData) {
      fetchToken(tokenAddress);
    } else {
      console.log("Token data already available in cache.");
    }

    // Runs on unmount
    return () => {
      // setGlobalDataCache(prevData => ({
      //   ...prevData,
      //   initialTokenLoad:false,
      //   token: null
      // }));
    };
  }, []);

  return (
    <div>
      <>
        <NavBar />
      </>
      <div className="container overview token-dashboard">
        {(globalDataCache.walletAddress ||
          globalDataCache.marketDataLoaded) && (
          <button
            className="btn btn-sm btn-outline portfolio-back"
            onClick={goBack}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              fill="#edf2f4"
            >
              <path
                d="M 10 4.9296875 L 2.9296875 12 L 10 19.070312 L 11.5 17.570312 L 6.9296875 13 L 21 13 L 21 11 L 6.9296875 11 L 11.5 6.4296875 L 10 4.9296875 z"
                fill="#edf2f4"
              />
            </svg>{" "}
            Back
          </button>
        )}
        <div className="token-page page">
          {globalDataCache.initialTokenLoaded && (
            <div class="token-page-content">
              <div className="row">
                <div className="col-lg-4">
                  <div class="token-top">
                    <div class="image">
                      <div>
                        <img
                          src={globalDataCache.token.tokenMetadata.logo}
                          alt={`${globalDataCache.token.tokenMetadata.name} token`}
                        />
                      </div>
                    </div>
                    <div class="meta">
                      <div class="title">
                        {globalDataCache.token.tokenMetadata.name}

                        {globalDataCache.token.tokenMetadata
                          .verified_contract && (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              width="20"
                            >
                              <polygon
                                fill="#42a5f5"
                                points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"
                              />
                              <polygon
                                fill="#fff"
                                points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"
                              />
                            </svg>
                          </>
                        )}
                      </div>
                      <div className="symbol">
                        {globalDataCache.token.tokenMetadata.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="token-price">
                    $
                    {utilities.formatPriceNumber(
                      globalDataCache.token.tokenPrice.usdPrice
                    )}{" "}
                    <span
                      className={
                        globalDataCache.token.tokenPrice["24hrPercentChange"] &&
                        globalDataCache.token.tokenPrice["24hrPercentChange"] <
                          0
                          ? "negative"
                          : "positive"
                      }
                    >
                      {Number(
                        globalDataCache.token.tokenPrice["24hrPercentChange"]
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <div className="exchange-price">
                    as of block{" "}
                    {globalDataCache.token.tokenPrice.priceLastChangedAtBlock}{" "}
                    from {globalDataCache.token.tokenPrice.exchangeName}
                  </div>
                </div>

                <div className="col-lg-8">
                  <div className="row">
                    {globalDataCache.token.tokenMetadata.categories && (
                      <div className="col-lg-7">
                        <h5>Token Categories</h5>
                        <ul className="token-categories">
                          {globalDataCache.token.tokenMetadata.categories.map(
                            (item) => (
                              <li>{item}</li>
                            )
                          )}
                          {globalDataCache.token.tokenMetadata.categories
                            .length === 0 && <li>No categories</li>}
                        </ul>
                      </div>
                    )}

                    <div className="col-lg-5">
                      <h5>Token Links</h5>
                      <ul className="token-links">
                        <li>
                          <Link
                            to={`https://moralismoney.com/chain/ethereum/token/price/${globalDataCache.token.tokenAddress}`}
                            target="_blank"
                            className="link"
                          >
                            <img src="/images/icon.png" alt="moralis money" />{" "}
                            Moralis Money <ExternalLinkIcon width="14" />
                          </Link>
                        </li>

                        <li>
                          <Link
                            to={`https://etherscan.io/token/${globalDataCache.token.tokenAddress}`}
                            target="_blank"
                            className="link"
                          >
                            <img
                              className="etherscan"
                              src="/images/etherscan.svg"
                              alt="etherscan"
                            />{" "}
                            Etherscan <ExternalLinkIcon width="14" />
                          </Link>
                        </li>

                        {globalDataCache.token.tokenMetadata.links && (
                          <>
                            {globalDataCache.token.tokenMetadata.links
                              .website && (
                              <li>
                                <Link
                                  to={
                                    globalDataCache.token.tokenMetadata.links
                                      .website
                                  }
                                  target="_blank"
                                  className="link"
                                >
                                  Official Website{" "}
                                  <ExternalLinkIcon width="14" />
                                </Link>
                              </li>
                            )}

                            {globalDataCache.token.tokenMetadata.links
                              .twitter && (
                              <li>
                                <Link
                                  to={
                                    globalDataCache.token.tokenMetadata.links
                                      .twitter
                                  }
                                  target="_blank"
                                  className="link"
                                >
                                  Twitter <ExternalLinkIcon width="14" />
                                </Link>
                              </li>
                            )}

                            {globalDataCache.token.tokenMetadata.links
                              .discord && (
                              <li>
                                <Link
                                  to={
                                    globalDataCache.token.tokenMetadata.links
                                      .discord
                                  }
                                  target="_blank"
                                  className="link"
                                >
                                  Discord <ExternalLinkIcon width="14" />
                                </Link>
                              </li>
                            )}

                            {globalDataCache.token.tokenMetadata.links
                              .reddit && (
                              <li>
                                <Link
                                  to={
                                    globalDataCache.token.tokenMetadata.links
                                      .reddit
                                  }
                                  target="_blank"
                                  className="link"
                                >
                                  Reddit <ExternalLinkIcon width="14" />
                                </Link>
                              </li>
                            )}

                            {globalDataCache.token.tokenMetadata.links
                              .telegram && (
                              <li>
                                <Link
                                  to={
                                    globalDataCache.token.tokenMetadata.links
                                      .telegram
                                  }
                                  target="_blank"
                                  className="link"
                                >
                                  Telegram <ExternalLinkIcon width="14" />
                                </Link>
                              </li>
                            )}
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-lg-3">
                  <h5>Token Details</h5>
                  <ul className="table-list">
                    <li>
                      <div className="left">Total Supply</div>
                      <div className="right">
                        {
                          globalDataCache.token.tokenMetadata
                            .total_supply_formatted
                        }
                      </div>
                    </li>
                    <li>
                      <div className="left">Fully Diluted Valuation</div>
                      <div className="right">
                        ${globalDataCache.token.tokenMetadata.fdv}
                      </div>
                    </li>
                    <li>
                      <div className="left">Token Age</div>
                      <div className="right">
                        {moment().diff(
                          globalDataCache.token.tokenMetadata.created_at,
                          "days"
                        )}{" "}
                        days
                      </div>
                    </li>
                    <li>
                      <div className="left">Date Created</div>
                      <div className="right">
                        {moment(
                          globalDataCache.token.tokenMetadata.created_at
                        ).format("YYYY-MM-DD")}
                      </div>
                    </li>
                    <li>
                      <div className="left">Current Price</div>
                      <div className="right">
                        ${globalDataCache.token.tokenPrice.usdPrice}
                      </div>
                    </li>
                    <li>
                      <div className="left">Token Address</div>
                      <div className="right copy-container">
                        {utilities.shortAddress(
                          globalDataCache.token.tokenAddress
                        )}
                        <CopyToClipboard
                          valueToCopy={globalDataCache.token.tokenAddress}
                        >
                          <button></button>
                        </CopyToClipboard>
                      </div>
                    </li>
                    <li>
                      <div className="left">Name</div>
                      <div className="right">
                        {globalDataCache.token.tokenMetadata.name}
                      </div>
                    </li>
                    <li>
                      <div className="left">Symbol</div>
                      <div className="right">
                        {globalDataCache.token.tokenMetadata.symbol}
                      </div>
                    </li>
                    <li>
                      <div className="left">Contract Type</div>
                      <div className="right">ERC20</div>
                    </li>
                    <li>
                      <div className="left">Decimals</div>
                      <div className="right">
                        {globalDataCache.token.tokenMetadata.decimals}
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="col-lg-6">
                  <>
                    <h5>Token Price Movement</h5>
                    <div className="canvas">
                      {priceLoading ? (
                        <Loader />
                      ) : (
                        <TokenPriceChart
                          chartArray={globalDataCache.token.tokenPrices}
                          direction={
                            globalDataCache.token.tokenPriceStats.direction
                          }
                        />
                      )}
                    </div>
                  </>
                </div>

                <div className="col-lg-3">
                  <h5>Pair Details</h5>
                  <ul className="table-list">
                    <li>
                      <div className="left">Price USD</div>
                      <div className="right">
                        {utilities.formatAsUSD(
                          globalDataCache.token.tokenPrice.usdPrice
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="left">Price</div>
                      <div className="right">
                        {globalDataCache.token.tokenPrice?.nativePrice?.value /
                          Math.pow(10, 18)}
                      </div>
                    </li>
                    <li>
                      <div className="left">Pair Address</div>
                      <div className="right">
                        {utilities.shortAddress(
                          globalDataCache.token?.tokenPrice?.pairAddress
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="left">Total Liquidity</div>
                      <div className="right">
                        {utilities.formatAsUSD(
                          globalDataCache.token?.tokenPrice
                            ?.pairTotalLiquidityUsd
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="left">Exchange</div>
                      <div className="right">
                        {globalDataCache.token?.tokenPrice?.exchangeName}
                      </div>
                    </li>
                    <li>
                      <div className="left">Exchange Address</div>
                      <div className="right">
                        {utilities.shortAddress(
                          globalDataCache.token?.tokenPrice?.exchangeAddress
                        )}
                      </div>
                    </li>
                  </ul>

                  <h5>Liquidity</h5>
                  <ul className="liquidity-stats">
                    <li className="full">
                      <div className="value">
                        $
                        {utilities.abbreviateNumber(
                          globalDataCache.token?.tokenPrice
                            ?.pairTotalLiquidityUsd
                        )}
                      </div>
                      <div className="title">Total Liquidity</div>
                    </li>
                    {globalDataCache.token?.pairBalance && (
                      <li className="half">
                        <div className="pair-liquidity">
                          <div className="pair">
                            <div className="value">
                              $
                              {utilities.abbreviateNumber(
                                globalDataCache.token.pairBalance[1].usd_value
                              )}
                            </div>
                            <div className="title">
                              <img
                                src={globalDataCache.token.pairBalance[1].logo}
                                width="50"
                              />
                              {globalDataCache.token.pairBalance[1].symbol}
                            </div>
                            <div className="sub-title">
                              {Number(
                                globalDataCache.token.pairBalance[1]
                                  .balance_formatted
                              ).toFixed(2)}{" "}
                              {globalDataCache.token.pairBalance[1].symbol}
                            </div>
                          </div>

                          <div className="pair">
                            <div className="value">
                              $
                              {utilities.abbreviateNumber(
                                globalDataCache.token.pairBalance[0].usd_value
                              )}
                            </div>
                            <div className="title">
                              <img
                                src={globalDataCache.token.pairBalance[0].logo}
                                width="50"
                              />
                              {globalDataCache.token.pairBalance[0].symbol}
                            </div>
                            <div className="sub-title">
                              {Number(
                                globalDataCache.token.pairBalance[0]
                                  .balance_formatted
                              ).toFixed(2)}{" "}
                              {globalDataCache.token.pairBalance[0].symbol}
                            </div>
                          </div>
                        </div>
                      </li>
                    )}

                    <li className="full liquidity">
                      <div className="title">
                        {globalDataCache.token?.liquidityStatus
                          .liquidityLocked ? (
                          <div>✅</div>
                        ) : (
                          <div>❌</div>
                        )}
                        Locked Liquidity
                      </div>
                      {globalDataCache.token?.liquidityStatus
                        .liquidityLocked ? (
                        <>
                          <ProgressBar
                            value={
                              globalDataCache.token?.liquidityStatus
                                .amountLockedPercentage
                            }
                          />
                          <div className="sub-title">
                            {
                              globalDataCache.token?.liquidityStatus
                                .amountLockedPercentage
                            }
                            % of this liquidity pool is locked.
                          </div>
                        </>
                      ) : (
                        <>⚠️ No liquidity locks found!</>
                      )}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <h5>Token Analysis</h5>
                  <div>
                    <Nav tabs>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "1" })}
                          onClick={() => {
                            toggle("1");
                          }}
                        >
                          Token Transfers
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "2" })}
                          onClick={() => {
                            toggle("2");
                          }}
                        >
                          Token Holders
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "3" })}
                          onClick={() => {
                            toggle("3");
                          }}
                        >
                          Holder Insights
                        </NavLink>
                      </NavItem>

                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "4" })}
                          onClick={() => {
                            toggle("4");
                          }}
                        >
                          Top Traders
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "5" })}
                          onClick={() => {
                            toggle("5");
                          }}
                        >
                          Token Swaps
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "6" })}
                          onClick={() => {
                            toggle("6");
                          }}
                        >
                          Token Pairs
                        </NavLink>
                      </NavItem>
                      <NavItem>
                        <NavLink
                          className={classnames({ active: activeTab === "7" })}
                          onClick={() => {
                            toggle("7");
                          }}
                        >
                          Liquidity Providers
                        </NavLink>
                      </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                      <TabPane tabId="1">
                        <h2>Activity</h2>
                        <ul>
                          {globalDataCache.token.tokenTransfers &&
                            globalDataCache.token.tokenTransfers.map((item) => (
                              <li className="transfer-item">
                                <div className={`category transfer`}>
                                  <div className={`transfers`}>Transfer</div>
                                </div>

                                <div className="label">
                                  <div className="group">
                                    <div className="heading">Amount</div>
                                    <div className="value">
                                      {utilities.formatPriceNumber(
                                        Number(item.value_decimal).toFixed(2)
                                      )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">USD Value</div>
                                    <div className="value">
                                      $
                                      {utilities.formatPriceNumber(
                                        Number(
                                          Number(item.value_decimal) *
                                            globalDataCache.token.tokenPrice
                                              .usdPrice
                                        ).toFixed(2)
                                      )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">From</div>
                                    <div className="value">
                                      {item.from_address_label
                                        ? item.from_address_label
                                        : utilities.shortAddress(
                                            item.from_address
                                          )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">To</div>
                                    <div className="value">
                                      {item.to_address_label
                                        ? item.to_address_label
                                        : utilities.shortAddress(
                                            item.to_address
                                          )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Transaction</div>
                                    <div className="value copy-container">
                                      {utilities.shortAddress(
                                        item.transaction_hash
                                      )}
                                      <CopyToClipboard
                                        valueToCopy={item.transaction_hash}
                                      >
                                        <button></button>
                                      </CopyToClipboard>
                                    </div>
                                  </div>
                                </div>
                                <div className="timestamp">
                                  {moment(item.block_timestamp).fromNow()}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </TabPane>
                      <TabPane tabId="2">
                        <h2>Top Holders</h2>
                        <Table responsive>
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
                            {!globalDataCache.token.tokenOwners && <Loader />}
                            {globalDataCache.token.tokenOwners &&
                              globalDataCache.token.tokenOwners.map(
                                (owner, index) => (
                                  <tr>
                                    <th scope="row">{index + 1}</th>
                                    <td>
                                      <div className="owner-details">
                                        <div>
                                          {owner.entity_logo ? (
                                            <img
                                              src={owner.entity_logo}
                                              width="25"
                                            />
                                          ) : (
                                            <img
                                              src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${owner.owner_address}`}
                                              width="25"
                                            />
                                          )}
                                        </div>
                                        <div>
                                          <div className="right copy-container">
                                            {owner.entity
                                              ? owner.entity
                                              : owner.owner_address_label
                                              ? owner.owner_address_label
                                              : utilities.shortAddress(
                                                  owner.owner_address
                                                )}

                                            <CopyToClipboard
                                              valueToCopy={owner.owner_address}
                                            >
                                              <button></button>
                                            </CopyToClipboard>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {owner.is_contract
                                          ? "Contract"
                                          : "Wallet"}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {Number(
                                          owner.balance_formatted
                                        ).toLocaleString(undefined, {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 0,
                                        })}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {Number(
                                          owner.percentage_relative_to_total_supply
                                        ).toFixed(2)}
                                        %
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        $
                                        {Number(owner.usd_value).toLocaleString(
                                          undefined,
                                          {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                          }
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </Table>
                      </TabPane>
                      <TabPane tabId="3">
                        <h2>Holder Insights</h2>
                        {topOwnersLoading ||
                          (!globalDataCache.token.topTokenOwners && (
                            <Skeleton />
                          ))}

                        {!topOwnersLoading &&
                          globalDataCache.token.topTokenOwners && (
                            <>
                              <div className="row">
                                <div className="col-lg-6">
                                  <div className="holders-summary wallet-card">
                                    <div className="title">
                                      🐳 Whale Summary
                                    </div>
                                    <div>
                                      The top 10 holders of{" "}
                                      {globalDataCache.token.tokenMetadata.name}{" "}
                                      hold{" "}
                                      <span>
                                        {utilities.formatPriceNumber(
                                          globalDataCache.token.totalBalance
                                        )}
                                      </span>{" "}
                                      {
                                        globalDataCache.token.tokenMetadata
                                          .symbol
                                      }
                                    </div>
                                    <div>
                                      This represents{" "}
                                      <span>
                                        {globalDataCache.token.totalPercentage.toFixed(
                                          2
                                        )}
                                        %
                                      </span>{" "}
                                      of the Total Supply (
                                      {
                                        globalDataCache.token.tokenMetadata
                                          .total_supply_formatted
                                      }
                                      ), and is currently worth{" "}
                                      <span>
                                        $
                                        {utilities.formatPriceNumber(
                                          globalDataCache.token.totalUsd
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-lg-6">
                                  <div className="common-tokens wallet-card">
                                    <div className="title">
                                      💸 Common Tokens
                                    </div>
                                    <div>
                                      Common tokens that at least 2 of the 10
                                      ten holders also hold
                                    </div>
                                    <div className="token-balances-mini">
                                      {globalDataCache.token.commonTokens &&
                                        globalDataCache.token.commonTokens.map(
                                          (token, index) => (
                                            <>
                                              <UncontrolledTooltip
                                                target={`x-${token.tokenDetails.token_address}-${index}`}
                                                placement="top"
                                                className="popup"
                                              >
                                                <div className="token-popup">
                                                  <div className="token-title">
                                                    <TokenLogo
                                                      tokenImage={
                                                        token.tokenDetails.logo
                                                      }
                                                      tokenName={
                                                        token.tokenDetails.name
                                                      }
                                                    />
                                                    <div>
                                                      {token.tokenDetails.name}
                                                    </div>
                                                  </div>
                                                  <div className="popup-group">
                                                    <div className="heading">
                                                      Held By
                                                    </div>
                                                    <div className="value">
                                                      {token.count} out of 10
                                                    </div>
                                                  </div>
                                                </div>
                                              </UncontrolledTooltip>
                                              <div
                                                id={`x-${token.tokenDetails.token_address}-${index}`}
                                              >
                                                <TokenLogo
                                                  tokenImage={
                                                    token.tokenDetails.logo
                                                  }
                                                  tokenName={
                                                    token.tokenDetails.name
                                                  }
                                                />
                                              </div>
                                            </>
                                          )
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <Table responsive>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Owner Address</th>
                                    <th>
                                      {
                                        globalDataCache.token.tokenMetadata
                                          .symbol
                                      }{" "}
                                      Percentage Total Supply
                                    </th>
                                    <th>Top Tokens Held</th>
                                    <th>Total Net-worth</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {globalDataCache.token.topTokenOwners &&
                                    globalDataCache.token.topTokenOwners.map(
                                      (owner, index) => (
                                        <tr>
                                          <th scope="row">{index + 1}</th>
                                          <td>
                                            <div className="owner-details">
                                              <div>
                                                {owner.owner.entity_logo ? (
                                                  <img
                                                    src={
                                                      owner.owner.entity_logo
                                                    }
                                                    width="25"
                                                  />
                                                ) : (
                                                  <img
                                                    src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${owner.owner.owner_address}`}
                                                    width="25"
                                                  />
                                                )}
                                              </div>
                                              <div>
                                                <div className="right copy-container">
                                                  {owner.owner.entity
                                                    ? owner.owner.entity
                                                    : owner.owner
                                                        .owner_address_label
                                                    ? owner.owner
                                                        .owner_address_label
                                                    : utilities.shortAddress(
                                                        owner.owner
                                                          .owner_address
                                                      )}

                                                  <CopyToClipboard
                                                    valueToCopy={
                                                      owner.owner.owner_address
                                                    }
                                                  >
                                                    <button></button>
                                                  </CopyToClipboard>
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td>
                                            <div>
                                              {Number(
                                                owner.owner
                                                  .percentage_relative_to_total_supply
                                              ).toFixed(2)}
                                              %
                                            </div>
                                            <div>
                                              $
                                              {Number(
                                                owner.owner.usd_value
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                              })}
                                            </div>
                                          </td>
                                          <td>
                                            <div className="token-balances-mini">
                                              {owner.balanceData.map(
                                                (token, index) => (
                                                  <>
                                                    <UncontrolledTooltip
                                                      target={`a${owner.owner.owner_address}-token-${index}`}
                                                      placement="top"
                                                      className="popup"
                                                    >
                                                      <div className="token-popup">
                                                        <div className="token-title">
                                                          <TokenLogo
                                                            key={`${owner.owner_address} ${token.symbol}`}
                                                            tokenImage={
                                                              token.logo
                                                            }
                                                            tokenName={
                                                              token.name
                                                            }
                                                            onClick={() =>
                                                              handleTokenClick(
                                                                token
                                                              )
                                                            }
                                                          />
                                                          <div>
                                                            {token.name}
                                                          </div>
                                                        </div>
                                                        <div className="popup-group">
                                                          <div className="heading">
                                                            Current Price
                                                          </div>
                                                          <div className="value">
                                                            ${token.usd_price}
                                                          </div>
                                                        </div>
                                                        <div className="popup-group">
                                                          <div className="heading">
                                                            Amount Held
                                                          </div>
                                                          <div className="value">
                                                            {
                                                              token.balance_formatted
                                                            }
                                                          </div>
                                                        </div>
                                                        <div className="popup-group">
                                                          <div className="heading">
                                                            Current Value
                                                          </div>
                                                          <div className="value">
                                                            {token.usd_value}
                                                          </div>
                                                        </div>
                                                        <div className="popup-group">
                                                          <div className="heading">
                                                            Portfolio Percentage
                                                          </div>
                                                          <div className="value">
                                                            {
                                                              token.portfolio_percentage
                                                            }
                                                            %
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </UncontrolledTooltip>
                                                    <div
                                                      id={`a${owner.owner.owner_address}-token-${index}`}
                                                    >
                                                      <TokenLogo
                                                        tokenImage={token.logo}
                                                        tokenName={token.name}
                                                      />
                                                    </div>
                                                  </>
                                                )
                                              )}
                                            </div>
                                          </td>
                                          <td>
                                            {owner.networthData
                                              .total_networth_usd
                                              ? `$${utilities.formatPriceNumber(
                                                  owner.networthData
                                                    .total_networth_usd
                                                )}`
                                              : `$0`}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                </tbody>
                              </Table>
                            </>
                          )}
                      </TabPane>
                      <TabPane tabId="4">
                        <h2>Token PnL</h2>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Address</th>
                              <th>Count of Trades</th>
                              <th>Avg. Buy Price</th>
                              <th>Avg. Sell Price</th>
                              <th>Realized Profit %</th>
                              <th>Realized Profit $</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!globalDataCache.token.tokenPNL && <Loader />}
                            {globalDataCache.token.tokenPNL &&
                              globalDataCache.token.tokenPNL.map(
                                (wallet, index) => (
                                  <tr>
                                    <th scope="row">{index + 1}</th>
                                    <td>
                                      <div>{wallet.address}</div>
                                      {wallet.address_label && (
                                        <div>
                                          {wallet.address_label.replace(
                                            / \d+$/,
                                            ""
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <div>{wallet.count_of_trades}</div>
                                    </td>
                                    <td>
                                      <div>
                                        $
                                        {Number(
                                          wallet.avg_buy_price_usd
                                        ).toFixed(18)}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        $
                                        {utilities.formatPriceNumber(
                                          wallet.avg_sell_price_usd
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {utilities.formatPriceNumber(
                                          wallet.realized_profit_percentage
                                        )}
                                        %
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        $
                                        {utilities.formatPriceNumber(
                                          wallet.realized_profit_usd
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </Table>
                      </TabPane>
                      <TabPane tabId="5">
                        <h2>Coming soon</h2>
                      </TabPane>
                      <TabPane tabId="6">
                        <h2>Coming soon</h2>
                      </TabPane>

                      <TabPane tabId="7">
                        <h2>Liquidity Providers</h2>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Address</th>
                              <th>Address Type</th>
                              <th>Percentage (Liquidity Pool)</th>
                              <th>Amount (Tokens)</th>
                              <th>Amount (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {!globalDataCache.token.liquidityProviders && (
                              <Loader />
                            )}
                            {globalDataCache.token.liquidityProviders &&
                              globalDataCache.token.liquidityProviders.map(
                                (lp, index) => (
                                  <tr>
                                    <th scope="row">{index + 1}</th>
                                    <td>
                                      <div>
                                        {lp.owner_address}

                                        {lp.owner_address.indexOf(
                                          "0x00000000000000"
                                        ) > -1 ? (
                                          <span className="locked">Locked</span>
                                        ) : (
                                          <></>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <div>
                                        {lp.is_contract ? "Contract" : "Wallet"}
                                      </div>
                                    </td>
                                    <td>
                                      <ProgressBar
                                        value={Number(
                                          lp.percentage_relative_to_total_supply
                                        ).toFixed(0)}
                                      />
                                      <div className="lp-percentage">
                                        {Number(
                                          lp.percentage_relative_to_total_supply
                                        ).toFixed(10)}
                                        %
                                      </div>
                                    </td>
                                    <td>{lp.balance_formatted}</td>
                                    <td>
                                      $
                                      {Number(
                                        (globalDataCache.token?.tokenPrice
                                          ?.pairTotalLiquidityUsd *
                                          lp.percentage_relative_to_total_supply) /
                                          100
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </Table>
                      </TabPane>
                    </TabContent>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {loading && <Skeleton />}

        {!globalDataCache.token && <Skeleton />}

        {error && <div className="text-red-500">{error.message}</div>}
      </div>
    </div>
  );
};

export default TokenDashboard;
