import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useParams } from "react-router-dom";
import TokenDashboard from "./TokenDashboard";
import NavBar from "../Misc/NavBar";
import Skeleton from "../Misc/Skeleton";
import WalletForm from "../WalletPortfolio/WalletForm";
import TokenLogo from "../WalletPortfolio/TokenLogo";
import { useNavigate } from "react-router-dom";
import Loader from "../Misc/Loader";
import { useData } from "../../DataContext";
import "../../custom.scss";
import { debounce } from "lodash";

function TokenViewer() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topOwnersLoading, setTopOwnersLoading] = useState(false);
  const [tokenPricesLoading, setTokenPricesLoading] = useState(false);
  const [moversLoading, setMoversLoading] = useState(false);
  let hasData = false;
  const { tokenAddress } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const debouncedSubmit = debounce(() => {
      if (tokenAddress) {
        console.log("TOKEN CHANGED!");
        fetchToken(tokenAddress);
      }
    }, 300); // Adjust the delay as needed

    debouncedSubmit();

    // Cleanup the debounce function on component unmount or when tokenAddress changes
    return () => debouncedSubmit.cancel();
  }, [tokenAddress]);

  const handleWalletSubmit = async (address) => {
    navigate(`/tokens/${address}`);
  };

  const handleTokenClick = (token) => {
    navigate(`/tokens/${token.contract_address}`);
  };

  const fetchToken = async (address) => {
    setLoading(true);
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
        hasData = false;
        setGlobalDataCache((prevData) => ({
          ...prevData,
          token: data,
        }));
        navigate(`/tokens/${address}`);
        fetchChartPrices(address);
        fetchTopOwners(address);
      } else {
        setError(`Please provide a valid address.`);
      }
    } catch (error) {
      console.error("There was an error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopOwners = (address) => {
    setTopOwnersLoading(true);
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
            topTokenOwners: data.topTokenOwners,
            totalBalance: data.totalBalance,
            totalUsd: data.totalUsd,
            totalPercentage: data.totalPercentage,
            commonTokens: data.commonTokens,
          },
        }));
        setTopOwnersLoading(false);
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchChartPrices = (address) => {
    setTokenPricesLoading(true);
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
        setTokenPricesLoading(false);
      })
      .catch((error) => {
        setError(error);
      });
  };

  const fetchTopMarketCap = () => {
    setMoversLoading(true);
    setError(null);
    setGlobalDataCache((prevData) => ({
      ...prevData,
      topTokensLoaded: false,
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/market-data/top-erc20`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch data");
        return response.json();
      })
      .then((fetchedData) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          topTokensLoaded: true,
          marketCap: fetchedData.top_tokens,
        }));
        setMoversLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setMoversLoading(false);
      });
  };

  useEffect(() => {
    if (!globalDataCache.topTokensLoaded) {
      setMoversLoading(true);
      fetchTopMarketCap();
    }
  }, []);

  return (
    <>
      {globalDataCache.token ? (
        <>
          <NavBar />
          <div className="container">
            <Routes>
              <Route
                path="/"
                element={
                  <TokenDashboard
                    topOwnersLoading={topOwnersLoading}
                    tokenPricesLoading={tokenPricesLoading}
                  />
                }
              />
            </Routes>
          </div>
        </>
      ) : (
        <>
          <div className="container text-center">
            <h1>
              🔍 <br />
              Token Viewer
            </h1>
            <div id="wallet-container">
              {loading ? (
                <>
                  <Loader />
                </>
              ) : (
                <>
                  <p>Explore token insights, prices, top holders and more 🔥</p>
                  <WalletForm
                    onSubmit={handleWalletSubmit}
                    loading={loading}
                    placeholder={"Enter a token address"}
                    buttonText={"Search"}
                  />
                  {error && <div className="text-red-500 mt-2">{error}</div>}

                  <p className="divider">Or select a token below</p>

                  <div className="row">
                    <div className="col-md-8 offset-md-2">
                      <div className="wallet-card">
                        <ul className="token-list market-data wider-col-1">
                          <li className="header-row">
                            <div>Token</div>
                            <div></div>
                            <div>Price</div>
                            <div>24h %</div>
                            <div>Market Cap</div>
                          </li>
                          {moversLoading && <Skeleton />}
                          {error && <div className="text-red-500">{error}</div>}
                          {/* Assuming globalDataCache.tokensData is an array */}

                          {globalDataCache.marketCap &&
                            globalDataCache.marketCap
                              .slice(0, 50)
                              .map((token) => (
                                <li
                                  key={token.token_symbol}
                                  onClick={() => handleTokenClick(token)}
                                >
                                  <TokenLogo
                                    tokenImage={token.token_logo}
                                    tokenName={token.token_name}
                                  />
                                  <div>
                                    <div className="token-name">
                                      {token.token_name}
                                    </div>
                                    <div className="token-symbol">
                                      {token.token_symbol}
                                    </div>
                                  </div>
                                  <div className="token-price">
                                    {token.price_usd &&
                                      `${Number(
                                        Number(token.price_usd).toFixed(2)
                                      ).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                      })}`}
                                  </div>
                                  <div
                                    className={
                                      token.price_24h_percent_change < 0
                                        ? "negative"
                                        : "positive"
                                    }
                                  >
                                    {Number(
                                      token.price_24h_percent_change
                                    ).toFixed(2)}
                                    %
                                  </div>
                                  <div className="">
                                    {Number(
                                      token.market_cap_usd
                                    ).toLocaleString("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    })}
                                  </div>
                                </li>
                              ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default TokenViewer;
