import express from "express";
import fetch from "node-fetch";
const API_KEY = process.env.API_KEY;
const baseURL = "https://web3-api-elias.aws-prod-api-1.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/wallet/defi", async function (req, res, next) {
  try {
    const address = req.query.wallet;
    const chain = req.query.chain ? req.query.chain : "eth";

    // Define both fetch requests as promises
    const protocolsPromise = fetch(
      `${baseURL}/wallets/${address}/defi/summary?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const positionsPromise = fetch(
      `${baseURL}/wallets/${address}/defi/positions?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    // Use Promise.all to wait for all promises to resolve
    const [protocolsResponse, positionsResponse] = await Promise.all([
      protocolsPromise,
      positionsPromise,
    ]);

    // Check if protocolsResponse is ok
    if (!protocolsResponse.ok) {
      const message = await protocolsResponse.json();
      return res.status(500).json(message);
    }

    // Check if positionsResponse is ok
    if (!positionsResponse.ok) {
      const message = await positionsResponse.json();
      return res.status(500).json(message);
    }

    const protocolSummary = await protocolsResponse.json();
    const defiPositions = await positionsResponse.json();

    let uniswapRewards = 0;
    let uniswapValue = 0;
    let totalUsdValue = 0; // Ensure this is defined if you're using it

    if (
      protocolSummary &&
      protocolSummary.protocols &&
      protocolSummary.protocols.length > 0
    ) {
      for (const protocol of protocolSummary.protocols) {
        if (protocol.protocol_name === "uniswap-v3") {
          uniswapRewards = protocol.unclaimed_total_value_usd;
          uniswapValue = protocol.total_value_usd;
          totalUsdValue += protocol.total_value_usd;
        }
      }
    }

    // Respond with the combined data
    return res.status(200).json({
      protocols: protocolSummary,
      uniswapRewards,
      uniswapValue,
      defiPositions,
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/api/wallet/defi/positions/:protocolId",
  async function (req, res, next) {
    try {
      const address = req.query.wallet;
      const chain = req.query.chain ? req.query.chain : "eth";
      const protocolId = req.params.protocolId;

      const get_positions = await fetch(
        `${baseURL}/wallets/${address}/defi/${protocolId}/positions?chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }
      );

      if (!get_positions.ok) {
        console.log(get_positions.statusText);
        const message = await get_positions.json();
        throw new Error(message);
      }

      let defiPosition = await get_positions.json();

      // Respond with the combined data
      return res.status(200).json({
        positionDetail: defiPosition,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
