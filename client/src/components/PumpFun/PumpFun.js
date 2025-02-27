import React, { useState, useEffect, useRef } from "react"; // Added useRef
import * as utilities from "../../utilities.js";
import { useData } from "../../DataContext";
import Loader from "../Misc/Loader";
import moment from "moment";
import "./PumpFun.css";

function PumpFun() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(true);
  const prevNewTokensRef = useRef([]); // To track previous new tokens
  const [newTokenIds, setNewTokenIds] = useState(new Set()); // To track which tokens should wobble

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/pumpfun`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch tokens");
        }
        const data = await response.json();

        // Check for new tokens compared to previous fetch
        const prevTokenAddresses = new Set(
          prevNewTokensRef.current.map((t) => t.tokenAddress)
        );
        const currentNewTokens = data.new || [];
        const newTokens = currentNewTokens.filter(
          (token) => !prevTokenAddresses.has(token.tokenAddress)
        );

        // Update the set of tokens that should wobble
        if (newTokens.length > 0) {
          setNewTokenIds(new Set(newTokens.map((t) => t.tokenAddress)));
          // Clear the highlight after animation duration (0.6s)
          setTimeout(() => setNewTokenIds(new Set()), 600);
        }

        // Update previous tokens reference
        prevNewTokensRef.current = currentNewTokens;

        setGlobalDataCache((prevData) => ({
          ...prevData,
          pumpFun: data,
        }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setLoading(false);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 2000);
    return () => clearInterval(interval);
  }, [setGlobalDataCache]);

  if (loading) {
    return (
      <div className="container">
        <h1>PumpFun Tokens</h1>
        <Loader />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>PumpFun Tokens</h1>
      {globalDataCache.pumpFun && (
        <div className="token-dashboard">
          <div className="column">
            <h2>✨New Tokens</h2>
            {globalDataCache.pumpFun.new.map((token) => (
              <TokenCard
                key={token.tokenAddress}
                token={token}
                type="new"
                shouldWobble={newTokenIds.has(token.tokenAddress)}
              />
            ))}
          </div>
          <div className="column">
            <h2>🔥Bonding Tokens</h2>
            {globalDataCache.pumpFun.bonding.map((token) => (
              <TokenCard
                key={token.tokenAddress}
                token={token}
                type="bonding"
              />
            ))}
          </div>
          <div className="column">
            <h2>🚀Graduated Tokens</h2>
            {globalDataCache.pumpFun.graduated.map((token) => (
              <TokenCard
                key={token.tokenAddress}
                token={token}
                type="graduated"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TokenCard = ({ token, type, shouldWobble = false }) => {
  return (
    <div className={`token-card ${shouldWobble ? "highlight" : ""}`}>
      <h3>
        {token.name} ({token.symbol})
      </h3>
      <p>
        Address: {token.tokenAddress.slice(0, 6)}...
        {token.tokenAddress.slice(-4)}
      </p>
      <p>Price: ${token.priceUsd}</p>
      <p>Liquidity: ${parseFloat(token.liquidity).toLocaleString()}</p>
      <p>FDV: ${parseFloat(token.fullyDilutedValuation).toLocaleString()}</p>
      {type === "bonding" && (
        <p>Progress: {token.bondingCurveProgress.toFixed(2)}%</p>
      )}
      {type === "new" && <p>Created: {moment(token.createdAt).fromNow()}</p>}
      {type === "graduated" && (
        <p>Graduated: {moment(token.graduatedAt).fromNow()}</p>
      )}
    </div>
  );
};

export default PumpFun;
