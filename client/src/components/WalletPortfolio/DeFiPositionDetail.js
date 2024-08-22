import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import NavBar from "../Misc/NavBar";
import { useData } from "../../DataContext";
import TokenLogo from "./TokenLogo";
import ExternalLinkIcon from "../Misc/ExternalLinkIcon";
import Skeleton from "../Misc/Skeleton";
import * as utilities from "../../utilities.js";

function DeFiPosition() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let { id } = useParams(); // Access the protocolId from URL
  let navigate = useNavigate();

  const goBack = () => {
    navigate(-1); // Navigates one step back in the browser history
  };

  useEffect(() => {
    // Check for the cache item
    if (!protocol) {
      navigate(`/wallet-viewer/defi`);
    }
  }, [navigate]);

  useEffect(() => {}, [globalDataCache]);

  useEffect(() => {
    const shouldFetchPosition = !globalDataCache.defiPosition.positionDetail;
    if (shouldFetchPosition) {
      fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/defi/positions/${globalDataCache.defiPosition.protocol.protocol_id}?chain=${globalDataCache.selectedChain}&wallet=${globalDataCache.walletAddress}`
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch data");
          return response.json();
        })
        .then((fetchedData) => {
          setGlobalDataCache((prevData) => ({
            ...prevData,
            defiPosition: {
              ...prevData.defiPosition,
              positionDetail: fetchedData.positionDetail,
            },
          }));
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    } else {
      // Optionally, log or handle the case where the data is already loaded
      console.log("DeFi position data already available in cache.");
    }
  }, [globalDataCache.defiPosition, setGlobalDataCache]);

  let protocol = null;
  if (globalDataCache.defiPosition && globalDataCache.defiPosition.protocol) {
    protocol = globalDataCache.defiPosition.protocol;
  }
  // Fetch data based on id or use it as needed
  return (
    <div id="defi-page" className="detailed">
      <>
        <NavBar />
      </>

      <div className="container">
        {protocol && (
          <>
            <button className="btn btn-sm btn-primary" onClick={goBack}>
              Back to DeFi Positions
            </button>
            <div className="wallet-card" key={protocol.name_name}>
              <div className="protocol-details">
                <img
                  src={protocol.protocol_logo}
                  alt={protocol.protocol_name}
                />
                <div className="protocol-title">
                  {protocol.protocol_name}{" "}
                  {protocol.total_usd_value
                    ? `- $${utilities.formatPriceNumber(
                        protocol.total_usd_value
                      )}`
                    : null}
                  {protocol.total_unclaimed_value_usd && (
                    <spam className="rewards-available">
                      +$
                      {utilities.formatPriceNumber(
                        protocol.total_unclaimed_value_usd
                      )}{" "}
                      Unclaimed Rewards
                    </spam>
                  )}
                  <div className="position-count">
                    {protocol.positions} positions
                  </div>
                  {protocol?.account_data.health_factor && (
                    <div className="health-factor">
                      <span class="health dot"></span>
                      Health Factor:{" "}
                      {protocol?.account_data.health_factor
                        ? protocol?.account_data.health_factor > 10
                          ? "> 10"
                          : protocol?.account_data.health_factor
                        : `n/a`}
                    </div>
                  )}
                </div>

                <Link to={protocol.protocol_url} target="_blank">
                  <button className="btn btn-outline icon btn-sm">
                    Manage Positions <ExternalLinkIcon width="15" />
                  </button>
                </Link>
              </div>

              {globalDataCache.defiPosition.positionDetail && (
                <ul className="defi-list">
                  {globalDataCache.defiPosition.positionDetail.positions.map(
                    (position, index) => (
                      <div className="detailed-position">
                        <div className="position-detail" key={index}>
                          <>
                            <h5>
                              Position Summary - $
                              {Number(position.balance_usd).toFixed(2)}
                            </h5>
                            <li className="header-row">
                              <div>Token</div>
                              <div></div>
                              <div>Token Balances</div>
                              <div>Position Type</div>
                              <div>Position Value</div>
                            </li>

                            <li key={index}>
                              <>
                                <>
                                  <div>
                                    {position.tokens.map((token, index) => (
                                      <>
                                        <TokenLogo
                                          tokenImage={token.logo}
                                          tokenName={token.name}
                                        />
                                      </>
                                    ))}
                                  </div>

                                  <div>
                                    {position.tokens.map((token, index) => (
                                      <>
                                        <div>
                                          {token.name} ({token.token_type})
                                        </div>
                                      </>
                                    ))}
                                  </div>

                                  <div>
                                    {position.tokens.map((token, index) => (
                                      <>
                                        <div>
                                          {Number(
                                            token.balance_formatted
                                          ).toFixed(4)}{" "}
                                          {token.usd_value > 0
                                            ? `($${Number(
                                                token.usd_value
                                              ).toFixed(2)})`
                                            : ""}
                                        </div>
                                      </>
                                    ))}
                                  </div>

                                  <div>
                                    {position.tokens.map((token, index) => (
                                      <>
                                        <div>{position.label}</div>
                                      </>
                                    ))}
                                  </div>

                                  <div>
                                    {position.tokens.map((token, index) => (
                                      <>
                                        <div>
                                          $
                                          {utilities.formatPriceNumber(
                                            Number(token.usd_value)
                                          )}
                                        </div>
                                      </>
                                    ))}
                                  </div>
                                </>
                              </>
                            </li>
                          </>
                        </div>

                        <div className="extra-detail">
                          <h5>Detail</h5>

                          <li key={index}>
                            <>
                              {position.position_details.nft_metadata && (
                                <div className="row">
                                  <p>
                                    <b>
                                      {
                                        position.position_details.nft_metadata
                                          .name
                                      }
                                    </b>
                                  </p>
                                  <p>
                                    {
                                      position.position_details.nft_metadata
                                        .description
                                    }
                                  </p>
                                  <div className="col">
                                    <img
                                      src={
                                        position.position_details.nft_metadata
                                          .image
                                      }
                                    />
                                  </div>
                                  <div className="col">
                                    <ul className="table-list">
                                      <li>
                                        <div className="left">Fee Tier</div>
                                        <div className="right">
                                          {position.position_details.fee_tier}
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Reserves</div>
                                        <div className="right">
                                          {
                                            position.position_details
                                              .reserves[0]
                                          }
                                          ,{" "}
                                          {
                                            position.position_details
                                              .reserves[1]
                                          }
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Liquidity</div>
                                        <div className="right">
                                          {position.position_details.liquidity}
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Lower Price</div>
                                        <div className="right">
                                          {
                                            position.position_details
                                              .price_lower
                                          }{" "}
                                          {
                                            position.position_details
                                              .price_label
                                          }
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Upper Price</div>
                                        <div className="right">
                                          {
                                            position.position_details
                                              .price_upper
                                          }{" "}
                                          {
                                            position.position_details
                                              .price_label
                                          }
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">
                                          Current Price
                                        </div>
                                        <div className="right">
                                          {
                                            position.position_details
                                              .current_price
                                          }{" "}
                                          {
                                            position.position_details
                                              .price_label
                                          }
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">In Range</div>
                                        <div className="right">
                                          {position.position_details.is_in_range
                                            ? "Yes"
                                            : "No"}
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Pool Address</div>
                                        <div className="right">
                                          {utilities.shortAddress(
                                            position.position_details
                                              .pool_address
                                          )}
                                        </div>
                                      </li>
                                      <li>
                                        <div className="left">Position Key</div>
                                        <div className="right">
                                          {
                                            position.position_details
                                              .position_key
                                          }
                                        </div>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              )}

                              {position.position_details.share_of_pool && (
                                <ul className="table-list">
                                  <li>
                                    <div className="left">Share of Pool</div>
                                    <div className="right">
                                      {position.position_details.share_of_pool}
                                    </div>
                                  </li>
                                  <li>
                                    <div className="left">token0 liquidity</div>
                                    <div className="right">
                                      {position.position_details.reserve0}
                                    </div>
                                  </li>
                                  <li>
                                    <div className="left">token1 liquidity</div>
                                    <div className="right">
                                      {position.position_details.reserve1}
                                    </div>
                                  </li>
                                  <li>
                                    <div className="left">Pair Address</div>
                                    <div className="right">
                                      {position.position_details.pair}
                                    </div>
                                  </li>
                                  <li>
                                    <div className="left">Factory Address</div>
                                    <div className="right">
                                      {position.position_details.factory}
                                    </div>
                                  </li>
                                </ul>
                              )}

                              {!position.position_details.fee_tier &&
                                !position.position_details.share_of_pool && (
                                  <ul className="table-list">
                                    <li>
                                      <div className="left">
                                        Annual Percentage Yield (APY){" "}
                                      </div>
                                      <div className="right">
                                        {position.position_details.apy
                                          ? `${parseFloat(
                                              position.position_details.apy
                                            ).toFixed(4)}%`
                                          : `0%`}
                                      </div>
                                    </li>
                                    <li>
                                      <div className="left">Debt</div>
                                      <div className="right">
                                        {position.position_details.isDebt
                                          ? "Yes"
                                          : "No"}
                                      </div>
                                    </li>
                                    <li>
                                      <div className="left">Variable Debt</div>
                                      <div className="right">
                                        {position.position_details
                                          .isVariableDebt
                                          ? "Yes"
                                          : "No"}
                                      </div>
                                    </li>
                                    <li>
                                      <div className="left">Stable Debt</div>
                                      <div className="right">
                                        {position.position_details.isStableDebt
                                          ? "Yes"
                                          : "No"}
                                      </div>
                                    </li>
                                    <li>
                                      <div className="left">
                                        Rewards Available
                                      </div>
                                      <div className="right">
                                        {protocol.total_unclaimed_value_usd
                                          ? "Yes"
                                          : "No"}
                                      </div>
                                    </li>
                                  </ul>
                                )}
                            </>
                          </li>
                        </div>
                      </div>
                    )
                  )}
                </ul>
              )}

              {!globalDataCache.defiPosition ||
                (!globalDataCache.defiPosition.positionDetail && <Skeleton />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeFiPosition;
