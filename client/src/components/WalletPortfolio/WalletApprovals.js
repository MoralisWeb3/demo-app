import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetchWalletDetails from "../../hooks/useFetchWalletDetails";
import { DataContext, useData } from "../../DataContext";
import { UncontrolledTooltip } from "reactstrap";
import Skeleton from "../Misc/Skeleton";
import NavBar from "../Misc/NavBar";
import * as utilities from "../../utilities.js";
import ChainDropDown from "../Misc/ChainDropDown";
import TokenLogo from "./TokenLogo";
import Loader from "../Misc/Loader";

function WalletApprovals() {
  const { walletAddress } = useParams();
  const fetchWalletDetails = useFetchWalletDetails(walletAddress);
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchApprovals = async (address) => {
    setLoading(true);
    try {
      const tokensResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/approvals?wallet=${
          address ? address : globalDataCache.walletAddress
        }`
      );
      if (!tokensResponse.ok) {
        throw new Error("Failed to fetch approvals");
      }
      const fetchedData = await tokensResponse.json();
      setGlobalDataCache((prevData) => ({
        ...prevData,
        approvals: fetchedData,
        approvalsLoaded: true,
      }));
    } catch (error) {
      console.error("Error fetching approvals:", error);
      // Optionally handle errors such as updating UI or state
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!globalDataCache.approvalsLoaded) {
      console.log("FETCH!");
      if (
        !globalDataCache.profile ||
        globalDataCache.walletAddress !== walletAddress
      ) {
        console.log("No profile details, look up wallet details.");
        fetchWalletDetails()
          .then((data) => {
            console.log("Fetched profile! Now fetch tokens");
            fetchApprovals(data.address);
          })
          .catch((error) => {
            console.error("Failed to fetch wallet details:", error);
            // Handle errors or update state to show error message
          });
      } else if (globalDataCache.profile && !globalDataCache.approvals) {
        console.log("Already got profile details, look up approvals details.");
        fetchApprovals();
      }
    }
  }, []);

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  return (
    <>
      <NavBar />
      <div id="token-page" class="approvals">
        {(!globalDataCache.approvals || loading) && <Loader />}

        {globalDataCache.approvalsLoaded && (
          <>
            <div className="page-header">
              <h2>
                Token Approvals{" "}
                {globalDataCache.approvals && (
                  <span>({globalDataCache?.approvals.totalApprovals})</span>
                )}
              </h2>
            </div>

            <div className="summary-section">
              <div className="row">
                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Total Approvals</div>
                    <div className="big-value">
                      {globalDataCache.approvals.totalApprovals}
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">Active Chains</div>
                    <div className="big-value">
                      {globalDataCache.approvals.totalActiveChains}
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">At Risk Approvals</div>
                    <div className="big-value">
                      {globalDataCache.approvals.totalActiveApprovals}
                    </div>
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="wallet-card">
                    <div className="heading">USD At Risk</div>
                    <div className="big-value">
                      $
                      {utilities.formatPriceNumber(
                        globalDataCache.approvals.totalUsdAtRisk
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul className="token-list approvals">
              <li className="header-row">
                <div>Token</div>
                <div></div>
                <div>Chain</div>
                <div>Amount Approved</div>
                <div>Current Balance</div>
                <div>USD At Risk</div>
                <div>Spender</div>
                <div>Date Approved</div>
              </li>
              {loading && <Skeleton />}

              {/* Assuming globalDataCache.tokensData is an array */}
              {!loading &&
                globalDataCache.approvals &&
                globalDataCache.approvals.length === 0 && (
                  <p>No approvals found for this wallet</p>
                )}
              {globalDataCache.approvals &&
                globalDataCache.approvals.approvals.map((token) => (
                  <li key={token.token.address}>
                    <TokenLogo
                      tokenImage={token.token.logo}
                      tokenName={token.token.name}
                    />
                    <div>
                      <div className="token-name">{token.token.name}</div>
                      <div className="token-symbol">{token.token.symbol}</div>
                    </div>
                    <div>
                      <img src={`/images/${token.chain}-icon.png`}></img>
                    </div>
                    <div className="token-price">
                      {token.infinity ? `Infinity` : token.value_formatted}
                    </div>
                    <div className="token-balance">
                      {Number(token.token.current_balance_formatted).toFixed(3)}
                    </div>
                    <div className="token-value">
                      <div className="price">
                        ${Number(token.token.usd_at_risk).toFixed(2)}
                      </div>
                    </div>
                    <div className="token-value">
                      {token.spender.address_label
                        ? token.spender.address_label
                        : utilities.shortAddress(token.spender.address)}
                    </div>
                    <div>{token.block_timestamp}</div>
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

export default WalletApprovals;
