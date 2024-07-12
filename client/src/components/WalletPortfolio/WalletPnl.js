import React, { useState, useEffect } from "react";
import { useData } from "../../DataContext";
import NavBar from "../Misc/NavBar";
import ChainDropDown from "../Misc/ChainDropDown";
import TokenLogo from "./TokenLogo";
import Loader from "../Misc/Loader";
import { UncontrolledTooltip } from "reactstrap";
import * as utilities from "../../utilities.js";
import { useNavigate, useParams } from "react-router-dom";
import useFetchWalletDetails from "../../hooks/useFetchWalletDetails"; // Adjust path as necessary

const WalletPnl = () => {
  const { walletAddress } = useParams();
  const fetchWalletDetails = useFetchWalletDetails(walletAddress);
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchPnl = async (chain, address) => {
    setLoading(true);
    setError(false);
    try {
      const tokensResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/pnl?chain=${
          chain ? chain : globalDataCache.selectedChain
        }&wallet=${address ? address : globalDataCache.walletAddress}`
      );
      if (!tokensResponse.ok) {
        throw new Error("Failed to fetch tokens");
      }
      const fetchedData = await tokensResponse.json();
      setLoading(false);
      setGlobalDataCache((prevData) => ({
        ...prevData,
        pnl: fetchedData,
        pnlLoaded: true,
      }));
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setLoading(false);
      setError(true);
      // Optionally handle errors such as updating UI or state
    }
    setLoading(false);
  };

  const handleTokenClick = (token) => {
    navigate(`/tokens/${token.token_address}`);
  };

  const handleDropdownChange = (selectedValue) => {
    setGlobalDataCache((prevData) => ({
      ...prevData,
      nftsLoaded: false,
      pnlLoaded: false,
      selectedChain: selectedValue,
    }));
    fetchPnl(selectedValue);
  };

  useEffect(() => {
    if (!globalDataCache.pnlLoaded) {
      console.log("FETCH!");
      if (
        !globalDataCache.profile ||
        globalDataCache.walletAddress !== walletAddress
      ) {
        console.log("No profile details, look up wallet details.");
        fetchWalletDetails()
          .then((data) => {
            console.log("Fetched profile! Now fetch tokens");
            fetchPnl(null, data.address);
          })
          .catch((error) => {
            console.error("Failed to fetch wallet details:", error);
            // Handle errors or update state to show error message
          });
      } else if (globalDataCache.profile && !globalDataCache.pnl) {
        console.log("Already got profile details, look up token details.");
        fetchPnl();
      }
    }
  }, []);

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  useEffect(() => {
    localStorage.setItem("selectedChain", globalDataCache.selectedChain);
  }, [globalDataCache.selectedChain]);

  return (
    <>
      <NavBar />
      <div id="token-page" class="pnl">
        {loading && <Loader />}

        {error && (
          <>
            <h2>Coming soon</h2>
          </>
        )}

        {globalDataCache.pnlLoaded && globalDataCache.profile && (
          <>
            <div className="page-header">
              <h2>Wallet Profitability</h2>
              <ChainDropDown
                onChange={handleDropdownChange}
                chains={globalDataCache.chains}
                selectedChain={globalDataCache.selectedChain}
              />
            </div>
          </>
        )}

        {!globalDataCache.pnl && globalDataCache.pnlLoaded && (
          <p>Unable to retrieve profitability</p>
        )}

        {globalDataCache.pnlLoaded && globalDataCache.pnl && (
          <>
            <h3 className="sub-header">Wallet Summary</h3>
            <div className="summary-section">
              <div className="row">
                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Realized PnL %</div>
                    <div
                      className={
                        Number(
                          globalDataCache.pnl.detail
                            .total_realized_profit_percentage
                        ) < 0
                          ? "big-value negative"
                          : "big-value positive"
                      }
                    >
                      {Number(
                        globalDataCache.pnl.detail
                          .total_realized_profit_percentage
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Realized PnL $</div>
                    <div
                      className={
                        Number(
                          globalDataCache.pnl.detail.total_realized_profit_usd
                        ) < 0
                          ? "big-value negative"
                          : "big-value positive"
                      }
                    >
                      $
                      {utilities.formatPriceNumber(
                        Number(
                          globalDataCache.pnl.detail.total_realized_profit_usd
                        ).toFixed(2)
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Total Trade Volume</div>
                    <div className="big-value">
                      $
                      {globalDataCache.pnl.detail.total_trade_volume
                        ? utilities.formatPriceNumber(
                            globalDataCache.pnl.detail.total_trade_volume
                          )
                        : 0}
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Total Trades</div>
                    <div className="big-value">
                      {globalDataCache.pnl.detail.total_count_of_trades}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="sub-header">Token PnL</h3>
            <ul className="token-list">
              <li className="header-row">
                <div>Token</div>
                <div></div>
                <div>Total Trades</div>
                <div>Realized PnL ($)</div>
                <div>Realized PnL (%)</div>
              </li>

              {globalDataCache.pnl.summary &&
                globalDataCache.pnl.summary
                  .filter((token) => token.realized_profit_usd !== "0")
                  .map((token) => (
                    <li
                      key={token.token_address}
                      onClick={() => handleTokenClick(token)}
                    >
                      <TokenLogo
                        tokenImage={token.logo}
                        tokenName={token.name}
                      />
                      <div>
                        <div className="token-name">
                          {token.name}

                          {token.possible_spam && (
                            <>
                              <svg
                                id={`tooltip-${token.address}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="#f7a600"
                                width="17"
                              >
                                <path
                                  d="M16.619,3H7.381C7.024,3,6.694,3.191,6.515,3.5l-4.618,8c-0.179,0.309-0.179,0.691,0,1l4.618,8 C6.694,20.809,7.024,21,7.381,21h9.238c0.357,0,0.687-0.191,0.866-0.5l4.618-8c0.179-0.309,0.179-0.691,0-1l-4.618-8 C17.306,3.191,16.976,3,16.619,3z M12,17L12,17c-0.552,0-1-0.448-1-1v0c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v0 C13,16.552,12.552,17,12,17z M12,13L12,13c-0.552,0-1-0.448-1-1V8c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v4 C13,12.552,12.552,13,12,13z"
                                  fill="#f7a600"
                                />
                              </svg>
                              <UncontrolledTooltip
                                target={`tooltip-${token.address}`}
                                placement="top"
                              >
                                Spam contract
                              </UncontrolledTooltip>
                            </>
                          )}

                          {token.verified_contract && (
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
                        <div className="token-symbol">{token.symbol}</div>
                      </div>
                      <div>{token.count_of_trades}</div>
                      <div
                        className={
                          Number(token.realized_profit_usd) < 0
                            ? "negative"
                            : "positive"
                        }
                      >
                        $
                        {utilities.formatPriceNumber(
                          Number(token.realized_profit_usd).toFixed(2)
                        )}
                      </div>
                      <div
                        className={
                          Number(token.realized_profit_usd) < 0
                            ? "negative"
                            : "positive"
                        }
                      >
                        {Number(token.realized_profit_percentage).toFixed(2)}%
                      </div>
                    </li>
                  ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default WalletPnl;
