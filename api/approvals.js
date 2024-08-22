import express from "express";
import fetch from "node-fetch";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

function checkIfExceedsMax(valueFormatted) {
  const valueNumber = parseFloat(valueFormatted);
  return valueNumber > 1e18;
}

router.get("/api/wallet/approvals", async function (req, res, next) {
  const address = req.query.wallet;
  const queryString = utilities.chains
    .map((chain) => `chains=${chain.chain}`)
    .join("&");
  try {
    // Step 1: Fetch active chains
    const chainsResponse = await fetch(
      `${baseURL}/wallets/${address}/chains?${queryString}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );
    const chainsData = await chainsResponse.json();

    console.log(chainsData);

    // Step 2: Parallel fetch approvals for each active chain
    const approvalsPromises = chainsData.active_chains.map((chain) =>
      fetch(`${baseURL}/wallets/${address}/approvals?chain=${chain.chain}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }).then((res) => res.json())
    );

    const approvalsResponses = await Promise.all(approvalsPromises);

    // Step 3: Initialize aggregation objects
    const aggregatedData = {
      totalApprovals: 0,
      totalActiveApprovals: 0,
      totalActiveChains: 0,
      totalUsdAtRisk: 0,
      chains: [],
      approvals: [],
    };

    function formatUsdAtRisk(usdAtRisk) {
      const parsedUsdAtRisk = parseFloat(usdAtRisk);
      return parsedUsdAtRisk.toFixed(2); // Rounds to 2 decimal places
    }

    // Step 4: Process each chain's approvals
    approvalsResponses.forEach((approvalData, index) => {
      const chain = chainsData.active_chains[index].chain;
      let chainTotalApprovals = 0;
      let chainTotalActiveApprovals = 0;
      let chainTotalUsdAtRisk = 0;

      if (approvalData.result.length > 0) {
        approvalData.result.forEach((approval) => {
          chainTotalApprovals++;
          aggregatedData.totalApprovals++;

          if (approval.token.current_balance !== null) {
            chainTotalActiveApprovals++;
            aggregatedData.totalActiveApprovals++;
          }

          if (approval.token.usd_at_risk !== null) {
            const usdAtRiskFormatted = formatUsdAtRisk(
              approval.token.usd_at_risk
            );
            const usdAtRiskValue = parseFloat(usdAtRiskFormatted);
            chainTotalUsdAtRisk += usdAtRiskValue;
            aggregatedData.totalUsdAtRisk += usdAtRiskValue;
          }

          const exceedsMax = checkIfExceedsMax(approval.value_formatted);

          aggregatedData.approvals.push({
            chain,
            infinity: exceedsMax,
            ...approval,
          });
        });
      }

      if (chainTotalActiveApprovals > 0) {
        aggregatedData.totalActiveChains++;
      }

      // Append chain-specific aggregation to the chains array
      aggregatedData.chains.push({
        chain,
        totalApprovals: chainTotalApprovals,
        totalActiveApprovals: chainTotalActiveApprovals,
        totalUsdAtRisk: chainTotalUsdAtRisk,
      });
    });

    aggregatedData.approvals.sort((a, b) => {
      // Parse usd_at_risk as float or assign -Infinity if null
      const usdAtRiskA =
        a.token.usd_at_risk !== null
          ? parseFloat(a.token.usd_at_risk)
          : -Infinity;
      const usdAtRiskB =
        b.token.usd_at_risk !== null
          ? parseFloat(b.token.usd_at_risk)
          : -Infinity;

      // Sort in descending order
      return usdAtRiskB - usdAtRiskA;
    });

    // Step 5: Return aggregated data as JSON
    res.json(aggregatedData);
  } catch (e) {
    next(e);
  }
});

export default router;
