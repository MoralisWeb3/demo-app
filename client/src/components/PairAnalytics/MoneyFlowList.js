import React, { useState } from "react";
import { useData } from "../../DataContext";
import * as utilities from "../../utilities.js";

function MoneyFlow({ moneyFlows }) {
  const [excludeWETH, setExcludeWETH] = useState(false);
  const [sortBy, setSortBy] = useState("traderCount"); // Default sort by traderCount
  const { globalDataCache, setGlobalDataCache } = useData();

  const toggleExcludeWETH = () => {
    setExcludeWETH(!excludeWETH);
  };

  const toggleSortOrder = () => {
    setSortBy(sortBy === "traderCount" ? "totalValueUsd" : "traderCount");
  };

  // Filtered tokens
  const filteredSoldPrior = excludeWETH
    ? moneyFlows.soldPrior.filter((token) => token.symbol !== "WETH")
    : moneyFlows.soldPrior;

  const filteredBoughtAfter = excludeWETH
    ? moneyFlows.boughtAfter.filter((token) => token.symbol !== "WETH")
    : moneyFlows.boughtAfter;

  // Calculate max values for scaling bar widths
  const maxTraderCountOut = Math.max(
    ...filteredSoldPrior.map((token) => token.traderCount)
  );
  const maxTraderCountIn = Math.max(
    ...filteredBoughtAfter.map((token) => token.traderCount)
  );

  const maxTotalValueOut = Math.max(
    ...filteredSoldPrior.map((token) => token.totalValueUsd)
  );
  const maxTotalValueIn = Math.max(
    ...filteredBoughtAfter.map((token) => token.totalValueUsd)
  );

  const getBarWidth = (value, maxValue) => {
    return `${Math.min((value / maxValue) * 100, 100)}%`;
  };

  return (
    <div className="container">
      <button className="btn btn-primary me-3" onClick={toggleExcludeWETH}>
        {excludeWETH ? "Include WETH" : "Exclude WETH"}
      </button>
      <button className="btn btn-secondary" onClick={toggleSortOrder}>
        Sort by {sortBy === "traderCount" ? "USD Value" : "Trader Count"}
      </button>

      <div className="row">
        {/* Tokens Rotated Out */}
        <div className="col-lg-6">
          <div className="wallet-card">
            <div className="flow">
              <div className="flow-direction">CURRENT IN-FLOWS</div>
              <div className="flow-container">
                <div class="chevron-container">
                  <div class="chevron"></div>
                  <div class="chevron"></div>
                  <div class="chevron"></div>
                </div>
                <img src={globalDataCache.pairStats.tokenLogo} />
              </div>
              <p>
                Tokens that traders are currently selling before buying into{" "}
                {globalDataCache.pairStats.tokenSymbol}
              </p>
            </div>

            <ul className="list-unstyled">
              {filteredSoldPrior
                .sort((a, b) =>
                  sortBy === "traderCount"
                    ? b.traderCount - a.traderCount
                    : b.totalValueUsd - a.totalValueUsd
                )
                .slice(0, 10) // Limit to top 10
                .map((token) => (
                  <li
                    key={token.tokenAddress}
                    className="flow-item mb-3 d-flex align-items-center"
                  >
                    <img
                      src={token.logo || "https://via.placeholder.com/30"}
                      alt={token.symbol}
                      width="30"
                      height="30"
                      className="me-3"
                    />
                    <div className="flex-grow-1">
                      <strong>
                        <a
                          href={`https://moralis.com/chain/ethereum/token/price/${token.tokenAddress}`}
                          target="_blank"
                        >
                          {token.symbol}
                        </a>
                      </strong>
                      <div className="traders">
                        {token.traderCount} traders - $
                        {parseFloat(token.totalValueUsd).toLocaleString()}(
                        {utilities.formatAsUSD(token.totalProportionUsd)},{" "}
                        {Number(token.percentage).toFixed(0)}%)
                      </div>
                      <div
                        className="bar"
                        style={{
                          width:
                            sortBy === "traderCount"
                              ? getBarWidth(
                                  token.traderCount,
                                  maxTraderCountOut
                                )
                              : getBarWidth(
                                  token.totalValueUsd,
                                  maxTotalValueOut
                                ),
                          height: "8px",
                          backgroundColor: "#28a745",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Tokens Rotated Into */}
        <div className="col-lg-6">
          <div className="wallet-card">
            <div className="flow">
              <div className="flow-direction">CURRENT OUT-FLOWS</div>
              <div className="flow-container">
                <img src={globalDataCache.pairStats.tokenLogo} />
                <div class="chevron-container out">
                  <div class="chevron"></div>
                  <div class="chevron"></div>
                  <div class="chevron"></div>
                </div>
              </div>
              <p>
                Tokens that traders are buying into after selling{" "}
                {globalDataCache.pairStats.tokenSymbol}
              </p>
            </div>

            <ul className="list-unstyled">
              {filteredBoughtAfter
                .sort((a, b) =>
                  sortBy === "traderCount"
                    ? b.traderCount - a.traderCount
                    : b.totalValueUsd - a.totalValueUsd
                )
                .slice(0, 10) // Limit to top 10
                .map((token) => (
                  <li
                    key={token.tokenAddress}
                    className="flow-item mb-3 d-flex align-items-center"
                  >
                    <img
                      src={token.logo || "https://via.placeholder.com/30"}
                      alt={token.symbol}
                      width="30"
                      height="30"
                      className="me-3"
                    />
                    <div className="flex-grow-1">
                      <strong>
                        <a
                          href={`https://moralis.com/chain/ethereum/token/price/${token.tokenAddress}`}
                          target="_blank"
                        >
                          {token.symbol}
                        </a>
                      </strong>
                      <div className="traders">
                        {token.traderCount} traders - $
                        {parseFloat(token.totalValueUsd).toLocaleString()}
                      </div>
                      <div
                        className="bar"
                        style={{
                          width:
                            sortBy === "traderCount"
                              ? getBarWidth(token.traderCount, maxTraderCountIn)
                              : getBarWidth(
                                  token.totalValueUsd,
                                  maxTotalValueIn
                                ),
                          height: "8px",
                          backgroundColor: "#e64c4c",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoneyFlow;
