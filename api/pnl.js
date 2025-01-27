import express from "express";
import fetch from "node-fetch";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/token/:tokenAddress/pnl", async function (req, res, next) {
  try {
    let tokenAddress = req.params.tokenAddress;
    const chain = req.query.chain || "base";

    const pnlPromise = fetch(
      `${baseURL}/erc20/${tokenAddress}/top-gainers?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [pnlResponse] = await Promise.all([pnlPromise]);

    if (!pnlResponse.ok) {
      console.log(pnlResponse);
      const message = await pnlResponse.json();
      return res.status(500).json(message);
    }

    const tokenPNL = await pnlResponse.json();

    return res.status(200).json({
      tokenPNL: tokenPNL.result.sort(
        (a, b) =>
          parseFloat(b.realized_profit_usd) - parseFloat(a.realized_profit_usd)
      ),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/wallet/pnl", async function (req, res, next) {
  try {
    const address = req.query.wallet;
    const chain = req.query.chain ? req.query.chain : "eth";

    const pnlSummaryPromise = fetch(
      `${baseURL}/wallets/${address}/profitability?chain=${chain}&days=all`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const pnlPromise = fetch(
      `${baseURL}/wallets/${address}/profitability/summary?chain=${chain}&days=all`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    // Use Promise.all to wait for all promises to resolve
    const [pnlSummaryResponse, pnlResponse] = await Promise.all([
      pnlSummaryPromise,
      pnlPromise,
    ]);

    // Check if protocolsResponse is ok
    if (!pnlSummaryResponse.ok) {
      const message = await pnlSummaryResponse.json();
      return res.status(500).json(message);
    }

    // Check if positionsResponse is ok
    if (!pnlResponse.ok) {
      const message = await pnlResponse.json();
      return res.status(500).json(message);
    }

    const pnlSummary = await pnlSummaryResponse.json();
    const pnl = await pnlResponse.json();

    return res.status(200).json({
      summary: pnlSummary.result,
      detail: pnl,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
