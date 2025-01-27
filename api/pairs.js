import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/chain/:chain/pairs/:address", async function (req, res, next) {
  try {
    let pairAddress = req.params.address;
    let chain = req.params.chain;

    let getPairStatsURL = `${baseURL}/pairs/${pairAddress}/stats?chain=${chain}`;

    if (chain === "solana") {
      getPairStatsURL = `https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/stats`;
    }

    const pairStatsPromise = fetch(getPairStatsURL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": API_KEY,
      },
    });

    const [pairStatsResponse] = await Promise.all([pairStatsPromise]);

    if (!pairStatsResponse.ok) {
      console.log("Get pair stats failed");
      const message = await pairStatsResponse.json();
      console.log(pairStatsResponse.statusText);
      return res.status(500).json(message);
    }

    let pairStats = await pairStatsResponse.json();

    console.log(pairStats);

    let tokenMetadataUrl = `${baseURL}/erc20/metadata?addresses=${pairStats.tokenAddress}&chain=${chain}`;

    if (chain === "solana") {
      tokenMetadataUrl = `https://solana-gateway.moralis.io/token/mainnet/${pairStats.tokenAddress}/metadata`;
    }

    console.log(tokenMetadataUrl);

    const metadataPromise = fetch(tokenMetadataUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": API_KEY,
      },
    });

    const [metadataResponse] = await Promise.all([metadataPromise]);

    if (!metadataResponse.ok) {
      console.log("Get token metadata failed");
      const message = await metadataResponse.json();
      console.log(metadataResponse.statusText);
      return res.status(500).json(message);
    }

    // const tokenOwners = await ownersResponse.json();
    const tokenMetadata = await metadataResponse.json();

    if (chain === "solana") {
      pairStats.tokenMetadata = tokenMetadata;
    } else {
      pairStats.tokenMetadata = tokenMetadata[0];
    }

    return res.status(200).json(pairStats);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/api/chain/:chain/pairs/:address/ohlc",
  async function (req, res, next) {
    try {
      let pairAddress = req.params.address;
      let chain = req.params.chain;

      const timeframe = "1h";
      const currency = "usd";
      const to_date = new Date();
      const from_date = new Date();
      const limit = 200;
      from_date.setDate(to_date.getDate() - 6);

      let getCandlesticksURL = `${baseURL}/pairs/${pairAddress}/ohlcv/detailed?chain=${chain}&timeframe=${timeframe}&currency=${currency}&fromDate=${from_date}&toDate=${to_date}&limit=${limit}`;

      if (chain === "solana") {
        getCandlesticksURL = `https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/ohlcv?timeframe=${timeframe}&currency=${currency}&fromDate=${from_date}&toDate=${to_date}&limit=${limit}`;
      }

      const pairOHLCPromise = fetch(getCandlesticksURL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      });

      const [pairOHLCResponse] = await Promise.all([pairOHLCPromise]);

      if (!pairOHLCResponse.ok) {
        console.log("OHLC failed");
        const message = await pairOHLCResponse.json();
        console.log(pairOHLCResponse.statusText);
        return res.status(500).json(message);
      }

      const pairOHLC = await pairOHLCResponse.json();

      return res.status(200).json(pairOHLC);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/chain/:chain/pairs/:address/swaps",
  async function (req, res, next) {
    try {
      let pairAddress = req.params.address;
      let chain = req.params.chain;
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(pairAddress);

      let swapsURL = `${baseURL}/pairs/${pairAddress}/swaps?chain=${chain}`;

      if (chain === "solana") {
        swapsURL = `https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/swaps`;
      }

      const get_swaps = await fetch(swapsURL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      });

      if (!get_swaps.ok) {
        console.log("Error fetching getPairStats");
        console.log(get_swaps);
        console.log(get_swaps.statusText);
        // const message = await get_swaps.json();
        // throw new Error(message);

        return res.status(200).json({ swaps: null });
      }

      let swaps = await get_swaps.json();

      const updatedTrades = swaps.result.map((swap) => ({
        ...swap,
        blockExplorerUrl: `${utilities.getChainExplorerUrl(chain)}/tx/${
          swap.transactionHash
        }`,
      }));

      swaps.result = updatedTrades;
      return res.status(200).json(swaps);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/api/wallet/swaps", async function (req, res, next) {
  const walletAddress = req.query.wallet;
  const chain = req.query.chain;
  try {
    const response = await fetch(
      `${baseURL}/wallets/${walletAddress}/swaps?chain=${chain}`,
      {
        method: "get",
        headers: { accept: "application/json", "X-API-Key": `${API_KEY}` },
      }
    );

    const swaps = await response.json();

    return res.status(200).json(swaps.result);
  } catch (error) {
    console.error("Error making API calls:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get(
  "/api/chain/:chain/pairs/:pairAddress/snipers",
  async function (req, res, next) {
    try {
      const { pairAddress, chain } = req.params;
      let url = `${baseURL}/pairs/${pairAddress}/snipers?chain=${chain}&blocksAfterCreation=200`;
      if (chain === "solana") {
        url = `https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/snipers?blocksAfterCreation=500`;
      }
      const response = await fetch(url, {
        method: "get",
        headers: { accept: "application/json", "X-API-Key": `${API_KEY}` },
      });

      const snipers = await response.json();

      return res.status(200).json(snipers);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/chain/:chain/pairs/:pairAddress/money-flows",
  async (req, res) => {
    const { pairAddress, chain } = req.params;

    if (chain === "solana") {
      return res.status(200).json([]);
    }
    try {
      // Step 1: Fetch the last hour of swaps for the pair
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      const pairSwapsResponse = await fetch(
        `${baseURL}/pairs/${pairAddress}/swaps?chain=${chain}&fromDate=${oneHourAgo}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (!pairSwapsResponse.ok) {
        throw new Error("Failed to fetch pair swaps");
      }

      const pairSwapsData = await pairSwapsResponse.json();
      const pairSwaps = pairSwapsData.result;

      // Step 2: Group by wallet and identify PEPE transactions
      const walletsToFetch = new Map();

      pairSwaps.forEach((tx) => {
        const walletAddress = tx.walletAddress.toLowerCase();
        const isSell = tx.transactionType === "sell";
        const isBuy = tx.transactionType === "buy";

        if (!walletsToFetch.has(walletAddress)) {
          walletsToFetch.set(walletAddress, []);
        }

        walletsToFetch.get(walletAddress).push({
          transactionType: tx.transactionType,
          blockTimestamp: tx.blockTimestamp,
          totalValueUsd: Math.abs(parseFloat(tx.totalValueUsd || 0)),
        });
      });

      // Step 3: Filter to most recent transactions per wallet
      walletsToFetch.forEach((transactions, walletAddress) => {
        transactions.sort(
          (a, b) => new Date(b.blockTimestamp) - new Date(a.blockTimestamp)
        );
        const mostRecentType = transactions[0].transactionType;
        const firstOccurrence = transactions.find(
          (tx) => tx.transactionType === mostRecentType
        );

        walletsToFetch.set(walletAddress, firstOccurrence);
      });

      // Step 4: Fetch wallet swaps in parallel
      const walletSwapFetchParams = [];
      const timeWindowMs = 60 * 60 * 1000; // 1 hour in milliseconds

      walletsToFetch.forEach(
        ({ transactionType, blockTimestamp }, walletAddress) => {
          const txTimestamp = new Date(blockTimestamp).getTime();
          if (transactionType === "sell") {
            walletSwapFetchParams.push({
              walletAddress,
              fromDate: new Date(txTimestamp).toISOString(),
              toDate: new Date(txTimestamp + timeWindowMs).toISOString(),
              type: "boughtAfter",
            });
          } else if (transactionType === "buy") {
            walletSwapFetchParams.push({
              walletAddress,
              fromDate: new Date(txTimestamp - timeWindowMs).toISOString(),
              toDate: new Date(txTimestamp).toISOString(),
              type: "soldPrior",
            });
          }
        }
      );

      const fetchWalletSwaps = async ({ walletAddress, fromDate, toDate }) => {
        const walletSwapsResponse = await fetch(
          `${baseURL}/wallets/${walletAddress}/swaps?chain=${chain}&fromDate=${fromDate}&toDate=${toDate}`,
          {
            headers: {
              "x-api-key": API_KEY,
            },
          }
        );
        if (!walletSwapsResponse.ok) {
          throw new Error(`Failed to fetch swaps for wallet: ${walletAddress}`);
        }

        const walletSwapsData = await walletSwapsResponse.json();
        return walletSwapsData.result;
      };

      const walletSwapPromises = walletSwapFetchParams.map(
        async (fetchParams) => {
          try {
            const swaps = await fetchWalletSwaps(fetchParams);
            return { ...fetchParams, swaps };
          } catch (error) {
            console.error(
              `Error fetching swaps for wallet: ${fetchParams.walletAddress}`,
              error
            );
            return { ...fetchParams, swaps: [] };
          }
        }
      );

      const walletSwapsResults = await Promise.all(walletSwapPromises);

      // Step 5: Analyze token flows
      const soldPrior = {};
      const boughtAfter = {};

      walletSwapsResults.forEach(({ swaps, type, walletAddress }) => {
        const pepeTransaction = walletsToFetch.get(walletAddress);
        if (!pepeTransaction) return;

        const pepeBuyValueUsd = pepeTransaction.totalValueUsd;

        swaps.forEach((swap) => {
          if (type === "boughtAfter") {
            const boughtToken = swap.bought;
            if (
              !boughtToken ||
              boughtToken.address.toLowerCase() === pairAddress.toLowerCase()
            ) {
              return; // Skip invalid or self-loop tokens
            }

            const boughtUsdAmount = Math.abs(
              parseFloat(boughtToken.usdAmount || 0)
            );

            if (!boughtAfter[boughtToken.address]) {
              boughtAfter[boughtToken.address] = {
                tokenAddress: boughtToken.address,
                symbol: boughtToken.symbol,
                logo: boughtToken.logo,
                traderCount: 0,
                totalAmount: 0,
                totalValueUsd: 0,
                totalProportionUsd: 0,
                percentage: 0,
              };
            }

            boughtAfter[boughtToken.address].traderCount += 1;
            boughtAfter[boughtToken.address].totalAmount += parseFloat(
              boughtToken.amount || 0
            );
            boughtAfter[boughtToken.address].totalValueUsd += boughtUsdAmount;
            boughtAfter[boughtToken.address].totalProportionUsd +=
              boughtUsdAmount;

            boughtAfter[boughtToken.address].percentage =
              (boughtAfter[boughtToken.address].totalProportionUsd /
                boughtAfter[boughtToken.address].totalValueUsd) *
              100;
          } else if (type === "soldPrior") {
            const soldToken = swap.sold;
            if (
              !soldToken ||
              soldToken.address.toLowerCase() === pairAddress.toLowerCase()
            ) {
              return; // Skip invalid or self-loop tokens
            }

            const soldUsdAmount = Math.abs(
              parseFloat(soldToken.usdAmount || 0)
            );
            const proportionalValueUsd = Math.min(
              soldUsdAmount,
              pepeBuyValueUsd
            );

            if (!soldPrior[soldToken.address]) {
              soldPrior[soldToken.address] = {
                tokenAddress: soldToken.address,
                symbol: soldToken.symbol,
                logo: soldToken.logo,
                traderCount: 0,
                totalAmount: 0,
                totalValueUsd: 0,
                totalProportionUsd: 0,
                percentage: 0,
              };
            }

            soldPrior[soldToken.address].traderCount += 1;
            soldPrior[soldToken.address].totalAmount += Math.abs(
              parseFloat(soldToken.amount || 0)
            );
            soldPrior[soldToken.address].totalValueUsd += soldUsdAmount;
            soldPrior[soldToken.address].totalProportionUsd +=
              proportionalValueUsd;

            soldPrior[soldToken.address].percentage =
              (soldPrior[soldToken.address].totalProportionUsd /
                soldPrior[soldToken.address].totalValueUsd) *
              100;
          }
        });
      });

      // Step 6: Sort results
      const sortedBoughtAfter = Object.values(boughtAfter).sort(
        (a, b) => b.traderCount - a.traderCount
      );
      const sortedSoldPrior = Object.values(soldPrior).sort(
        (a, b) => b.traderCount - a.traderCount
      );

      res.json({ boughtAfter: sortedBoughtAfter, soldPrior: sortedSoldPrior });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "An error occurred during the analysis." });
    }
  }
);

export default router;
