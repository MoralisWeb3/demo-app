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
import moment from "moment";
import "./Wallet.css";

function WalletSwaps() {
  const { walletAddress } = useParams();
  const fetchWalletDetails = useFetchWalletDetails(walletAddress);
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchSwaps = async (address) => {
    setLoading(true);
    try {
      const tokensResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/wallet/swaps?wallet=${
          address ? address : globalDataCache.walletAddress
        }`
      );
      if (!tokensResponse.ok) {
        throw new Error("Failed to fetch approvals");
      }
      const fetchedData = await tokensResponse.json();
      setGlobalDataCache((prevData) => ({
        ...prevData,
        swaps: fetchedData,
        swapsLoaded: true,
      }));
    } catch (error) {
      console.error("Error fetching approvals:", error);
      // Optionally handle errors such as updating UI or state
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!globalDataCache.swapsLoaded) {
      console.log("FETCH!");
      if (
        !globalDataCache.profile ||
        globalDataCache.walletAddress !== walletAddress
      ) {
        console.log("No profile details, look up wallet details.");
        fetchWalletDetails()
          .then((data) => {
            console.log("Fetched profile! Now fetch tokens");
            fetchSwaps(data.address);
          })
          .catch((error) => {
            console.error("Failed to fetch wallet details:", error);
            // Handle errors or update state to show error message
          });
      } else if (globalDataCache.profile && !globalDataCache.approvals) {
        console.log("Already got profile details, look up approvals details.");
        fetchSwaps();
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
        {(!globalDataCache.swaps || loading) && <Loader />}

        {globalDataCache.swapsLoaded && (
          <>
            <div className="page-header">
              <h2>Swap Transactions ({globalDataCache.swaps.length})</h2>
            </div>

            <ul className="swap-events">
              {globalDataCache.swaps.map((transaction, index) => {
                // Parse the pairLabel to separate base and quote tokens
                const [baseTokenLabel, quoteTokenLabel] =
                  transaction.pairLabel.split("/");

                const isBuy = transaction.transactionType === "buy";
                const baseToken = isBuy ? transaction.bought : transaction.sold;
                const quoteToken = isBuy
                  ? transaction.sold
                  : transaction.bought;

                // Adjust to make sure we always refer to the base/quote pair correctly
                const baseTokenSymbol = baseTokenLabel;
                const quoteTokenSymbol = quoteTokenLabel;

                return (
                  <li
                    className={isBuy ? "swap-item buy" : "swap-item sell"}
                    key={index}
                    style={{ marginBottom: "20px" }}
                  >
                    <div className="swap-type">{isBuy ? "Buy" : "Sell"}</div>

                    <div className="swap-summary">
                      {isBuy ? "Bought" : "Sold"}{" "}
                      {utilities.formatPriceNumber(baseToken.amount)}{" "}
                      <img src={baseToken.logo} width="20" />
                      {baseToken.symbol} (
                      <span className="usd-amount">
                        {utilities.formatAsUSD(transaction.totalValueUsd)}
                      </span>
                      )
                    </div>
                    <p>{transaction.pairLabel}</p>
                    <p>
                      {isBuy ? "Buy" : "Sell"} price: ${baseToken.usdPrice}
                    </p>
                    <p>
                      Swapped for{" "}
                      <span className="swapped-for">
                        {quoteToken.amount} {quoteToken.symbol}
                      </span>
                    </p>
                    <p>
                      {moment(transaction.blockTimestamp).fromNow()} via{" "}
                      <img src={transaction.exchangeLogo} width="20" />{" "}
                      {transaction.exchangeName}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

export default WalletSwaps;
