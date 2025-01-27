import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import { ethers } from "ethers";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

const tokens = [
  {
    symbol: "PEPE",
    address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    pair: "0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f",
  },
  {
    symbol: "SPX6900",
    address: "0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C",
    pair: "0x52c77b0cb827afbad022e6d6caf2c44452edbc39",
  },
  {
    symbol: "DOGE",
    address: "0x1121AcC14c63f3C872BFcA497d10926A6098AAc5",
    pair: "0x308c6fbd6a14881af333649f17f2fde9cd75e2a6",
  },
  {
    symbol: "MOG",
    address: "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a",
    pair: "0xc2eab7d33d3cb97692ecb231a5d0e4a649cb539d",
  },
  {
    symbol: "GOAT",
    address: "0x666f5aeB760DA6D66e5346eb53898270dfcff366",
    pair: "0x0afa28f97125f33ac5694a51f9c0554da1026d1e",
  },
  {
    symbol: "BITCOIN",
    address: "0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9",
    pair: "0x0c30062368eefb96bf3ade1218e685306b8e89fa",
  },
];

const savedWallets = [
  {
    name: "FLOKI #1 Top Trader",
    address: "0x7fe747cbda55e7b6461347988acef323d0f847cb",
  },
  {
    name: "PEPE Whale Trader",
    address: "0x25cd302e37a69d70a6ef645daea5a7de38c66e2a",
  },
];

router.get("/api/trending-feed", async function (req, res, next) {
  try {
    const fromDateOHLC = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString(); // 24 hours ago
    const usdValue = 5000;

    const fetchWithErrorHandling = async (
      url,
      tokenSymbol = "",
      endpointType = ""
    ) => {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Error fetching ${endpointType} for ${
              tokenSymbol || "unknown token"
            }: ${response.status} ${response.statusText}`
          );
        }
        return await response.json();
      } catch (error) {
        console.error(
          `Failed to fetch URL: ${url} for ${endpointType} (${
            tokenSymbol || "unknown token"
          })`,
          error
        );
        return { result: [] };
      }
    };

    // Step 1: Prepare Token and Wallet Requests
    const tokenRequests = tokens.flatMap((token) => [
      `${baseURL}/erc20/${token.address}/swaps?limit=10`,
      `${baseURL}/erc20/${token.address}/owners`,
      `${baseURL}/erc20/${token.address}/top-gainers`,
      `${baseURL}/pairs/${
        token.pair
      }/ohlcv?timeframe=1h&currency=usd&fromDate=${fromDateOHLC}&toDate=${new Date().toISOString()}`,
      `${baseURL}/erc20/${token.address}/price?include=percent_change`,
    ]);

    const savedWalletUrls = savedWallets.map(
      (address) => `${baseURL}/wallets/${address.address}/swaps?limit=10`
    );

    // Step 2: Fetch All Data in Parallel
    const [tokenResponses, savedWalletResponses] = await Promise.all([
      Promise.all(
        tokenRequests.map((url, index) =>
          fetchWithErrorHandling(
            url,
            tokens[Math.floor(index / 5)]?.symbol,
            index % 5 === 0
              ? "swaps"
              : index % 5 === 1
              ? "owners"
              : index % 5 === 2
              ? "top-gainers"
              : index % 5 === 3
              ? "ohlcv"
              : "price"
          )
        )
      ),
      Promise.all(savedWalletUrls.map((url) => fetchWithErrorHandling(url))),
    ]);

    // Step 3: Process Token Data
    const tokenData = tokens.map((token, index) => {
      const swaps = tokenResponses[index * 5]?.result || [];
      const owners = tokenResponses[index * 5 + 1]?.result || [];
      const topGainers = tokenResponses[index * 5 + 2]?.result || [];
      const ohlcv = tokenResponses[index * 5 + 3]?.result || [];
      const priceResponse = tokenResponses[index * 5 + 4] || {};

      const price = {
        usdPrice: priceResponse.usdPrice || null,
        percentChange24h: priceResponse["24hrPercentChange"] || null,
        tokenName: priceResponse.tokenName || null,
        tokenSymbol: priceResponse.tokenSymbol || null,
        tokenLogo: priceResponse.tokenLogo || null,
      };

      return {
        ...token,
        swaps,
        owners,
        topGainers,
        ohlcv,
        price,
      };
    });

    // Step 4: Label Transactions
    const labeledTransactions = new Map();

    const labelTransaction = (tx, type, tokenSymbol) => {
      const hash = tx.transactionHash;
      const existing = labeledTransactions.get(hash);

      const typePriority = {
        largeTrade: 1,
        smartMoney: 2,
        whaleMovement: 3,
        savedWalletActivity: 4,
      };

      if (!existing || typePriority[type] < typePriority[existing.type]) {
        labeledTransactions.set(hash, { ...tx, type, token: tokenSymbol });
      }
    };

    // Step 4a: Large Trades
    tokenData.forEach((token) => {
      const tokenAddress = token.address.toLowerCase();
      token.swaps.forEach((tx) => {
        const baseToken = tx.baseToken?.toLowerCase();
        const quoteToken = tx.quoteToken?.toLowerCase();
        // Only label as "largeTrade" if the token matches
        if (
          tx.totalValueUsd > usdValue &&
          (baseToken === tokenAddress || quoteToken === tokenAddress)
        ) {
          labelTransaction(tx, "largeTrade", token.symbol);
        }
      });
    });

    // Step 4b: Smart Money
    const traderUrls = tokenData.flatMap((token) =>
      token.topGainers
        .slice(0, 8)
        .map((trader) => `${baseURL}/wallets/${trader.address}/swaps?limit=5`)
    );
    const traderSwaps = await Promise.all(
      traderUrls.map((url) => fetchWithErrorHandling(url))
    );

    traderSwaps.forEach((response, index) => {
      const trades = response.result || [];
      const token = tokenData[Math.floor(index / 8)];
      trades.forEach((tx) => labelTransaction(tx, "smartMoney", token.symbol));
    });

    // Step 4c: Whale Movements
    const holderUrls = tokenData.flatMap((token) =>
      token.owners
        .slice(0, 2)
        .map(
          (holder) => `${baseURL}/wallets/${holder.owner_address}/swaps?limit=5`
        )
    );
    const holderSwaps = await Promise.all(
      holderUrls.map((url) => fetchWithErrorHandling(url))
    );

    holderSwaps.forEach((response, index) => {
      const trades = response.result || [];
      const token = tokenData[Math.floor(index / 2)];
      trades.forEach((tx) =>
        labelTransaction(tx, "whaleMovement", token.symbol)
      );
    });

    // Step 4d: Saved Wallet Activity
    savedWalletResponses.forEach((response, index) => {
      const trades = response.result || [];
      const walletAddress = savedWallets[index].address;

      trades.forEach((trade) =>
        labelTransaction(trade, "savedWalletActivity", walletAddress)
      );
    });

    // Step 5: Convert Map to Array and Sort
    const sortedTransactions = Array.from(labeledTransactions.values()).sort(
      (a, b) => new Date(b.blockTimestamp) - new Date(a.blockTimestamp)
    );

    return res.status(200).json({
      sortedTransactions,
      tokenPrices: tokenData.map(({ symbol, price }) => ({ symbol, price })),
      tokenData,
      savedWallets,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/market-data", async function (req, res, next) {
  try {
    const urls = [
      `${baseURL}/market-data/global/market-cap`,
      `${baseURL}/market-data/global/volume`,
      `${baseURL}/market-data/erc20s/top-tokens`,
      `${baseURL}/market-data/nfts/top-collections`,
      `${baseURL}/market-data/nfts/hottest-collections`,
    ];

    const fetchPromises = urls.map((url) =>
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }).then((response) => response.json())
    );

    const [market_cap, trading_volume, top_tokens, nft_market_cap, nft_volume] =
      await Promise.all(fetchPromises);

    return res.status(200).json({
      market_cap,
      trading_volume,
      top_tokens,
      nft_market_cap,
      nft_volume,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/market-data/movers", async function (req, res, next) {
  try {
    const urls = [`${baseURL}/market-data/erc20s/top-movers`];

    const fetchPromises = urls.map((url) =>
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }).then((response) => response.json())
    );

    const [top_movers] = await Promise.all(fetchPromises);

    return res.status(200).json({
      top_movers,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/market-data/top-erc20", async function (req, res, next) {
  try {
    const urls = [`${baseURL}/market-data/erc20s/top-tokens`];

    const fetchPromises = urls.map((url) =>
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }).then((response) => response.json())
    );

    const [top_tokens] = await Promise.all(fetchPromises);

    top_tokens = top_tokens ? top_tokens : [];

    return res.status(200).json({
      top_tokens,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/api/wallet", async function (req, res, next) {
  try {
    let address = req.body.walletAddress;
    let ens;
    let unstoppable;

    if (!address) {
      throw new Error("Missing wallet address.");
    }

    let promises = [];
    let isENSAddress = address.indexOf(".eth") > -1;

    if (isENSAddress) {
      promises.push(
        fetch(`${baseURL}/resolve/ens/${address}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        })
      );
    } else {
      promises.push(
        fetch(`${baseURL}/resolve/${address}/reverse`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        })
      );
    }

    promises.push(
      fetch(`${baseURL}/resolve/${address}/domain`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      })
    );

    const [ensOrReverseResponse, udResponse] = await Promise.all(promises);

    if (isENSAddress) {
      let domain = await ensOrReverseResponse.json();
      address = domain.address;
      ens = req.body.address;
    } else {
      let ens_domain = await ensOrReverseResponse.json();
      ens = ens_domain.address;
    }

    let ud_domain = await udResponse.json();
    unstoppable = ud_domain.name;

    // Fetching wallet chains and balance in parallel
    const queryString = utilities.chains
      .map((chain) => `chains=${chain.chain}`)
      .join("&");
    const walletChainsPromise = fetch(
      `${baseURL}/wallets/${address}/chains?${queryString}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const balancePromise = fetch(
      `${baseURL}/${address}/balance?chain=${req.chain}`,
      {
        method: "get",
        headers: {
          accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [response, get_balance] = await Promise.all([
      walletChainsPromise,
      balancePromise,
    ]);

    if (!response.ok) {
      throw new Error(`Error fetching chains: ${response.statusText}`);
    }
    const active_chains = await response.json();
    const balance = await get_balance.json();

    const activeChains = active_chains.active_chains
      .map((chain) => `chains=${chain.chain}`)
      .join("&");
    const fetch_networth = await fetch(
      `${baseURL}/wallets/${address}/net-worth?${activeChains}&exclude_spam=true&exclude_unverified_contracts=true`,
      {
        method: "get",
        headers: { accept: "application/json", "X-API-Key": `${API_KEY}` },
      }
    );

    let networth = 0;
    if (!fetch_networth.ok) {
      console.log(`Error fetching net-worth: ${fetch_networth.statusText}`);
    }

    networth = await fetch_networth.json();

    let networthDataLabels = [];
    let networthDatasets = [];

    if (networth.chains && networth.chains.length > 0) {
      networth.chains.forEach(function (item) {
        networthDataLabels.push(item.chain);
        networthDatasets.push(Number(item.networth_usd));
      });
    }

    let isWhale = false;
    let earlyAdopter = false;
    let multiChainer = false;
    let speculator = false;
    let isFresh = false;

    //100 eth
    if (
      ethers.formatEther(balance.balance) >
      ethers.formatEther(`100000000000000000000`)
    )
      isWhale = true;

    let wallet_chains = [];
    let earlyAdopterDate = new Date("2016-01-01");

    for (const chain of active_chains.active_chains) {
      if (chain.first_transaction) {
        wallet_chains.push(chain);

        if (chain.first_transaction) {
          if (
            new Date(chain.first_transaction.block_timestamp) < earlyAdopterDate
          )
            earlyAdopter = true;
        }
      }
    }
    const one_day_ago = moment().subtract(1, "days");
    let firstSeenDate = utilities.findEarliestAndLatestTimestamps(
      active_chains.active_chains
    ).earliest;
    let lastSeenDate = utilities.findEarliestAndLatestTimestamps(
      active_chains.active_chains
    ).latest;

    wallet_chains.forEach((item) => {
      item.label = utilities.getChainName(item.chain);
      if (
        new Date(item.first_transaction.block_timestamp) <
        new Date(firstSeenDate.block_timestamp)
      ) {
        firstSeenDate = item.first_transaction.block_timestamp;
      }
      if (
        new Date(item.last_transaction.block_timestamp) >
        new Date(lastSeenDate.block_timestamp)
      ) {
        lastSeenDate = item.last_transaction.block_timestamp;
      }
    });

    let walletAge = utilities.calcAge(firstSeenDate);

    if (new Date(firstSeenDate) > new Date(one_day_ago)) isFresh = true;

    if (wallet_chains.length > 1) multiChainer = true;

    return res.status(200).json({
      address,
      networth: networth.total_networth_usd,
      networthDataLabels,
      networthDatasets,
      active_chains: wallet_chains,
      walletAge,
      firstSeenDate,
      lastSeenDate,
      ens,
      unstoppable,
      isWhale,
      earlyAdopter,
      multiChainer,
      speculator,
      balance: balance.balance,
      moment,
      isFresh,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/wallet/profile", async function (req, res, next) {
  try {
    const address = req.query.wallet;
    const chain = req.chain ? req.chain : "eth";

    const statsPromise = fetch(
      `${baseURL}/wallets/${address}/stats?chain=${chain}`,
      {
        method: "get",
        headers: { accept: "application/json", "X-API-Key": API_KEY },
      }
    );

    const tokensPromise = fetch(
      `${baseURL}/wallets/${address}/tokens?exclude_spam=true&exclude_unverified_contracts=true&chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    // Initialize chart data for the last 90 days
    let chart_data = [];
    // Start from today
    let currentDate = new Date();

    for (let i = 0; i < 90; i++) {
      let formattedDate = currentDate.toISOString().split("T")[0];
      chart_data.push({ x: formattedDate, y: 0 });

      // Subtract a day for the next iteration
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const days = moment().subtract(90, "days").format("YYYY-MM-DD");
    let cursor = null;
    let all_txs = [];

    // Fetch transactions within the last 90 days
    do {
      const response = await fetch(
        `${baseURL}/${address}?${cursor ? `cursor=${cursor}&` : ""}` +
          new URLSearchParams({
            from_date: days,
            chain: chain,
          }),
        {
          method: "get",
          headers: { accept: "application/json", "X-API-Key": `${API_KEY}` },
        }
      );

      const txs = await response.json();
      cursor = txs.cursor;

      if (txs.result) {
        for (let item of txs.result) {
          all_txs.push(item);
        }
      }
    } while (cursor !== "" && cursor !== null);

    // Process transaction data for chart
    if (all_txs.length > 0) {
      all_txs.forEach(function (data) {
        let blockDate = data.block_timestamp.split("T")[0];
        // Find the corresponding date in the chartArray
        let chartItem = chart_data.find((item) => item.x === blockDate);

        if (chartItem) {
          chartItem.y += 1;
        }
      });
    }

    let chartArray = utilities.generateWeekArray(9);

    utilities.updateChartArrayByWeek(chartArray, all_txs);
    chartArray = chartArray.reverse();

    // Resolve promises for wallet stats, tokens, and net worth
    const [statsResponse, tokensResponse] = await Promise.all([
      statsPromise,
      tokensPromise,
    ]);
    const stats = await statsResponse.json();
    const tokens = await tokensResponse.json();

    let collector = false;
    if (Number(stats.nfts) > 20) {
      collector = true;
    }

    // Construct and return the response
    return res.status(200).json({
      addressOccurrences: utilities.findAddressOccurrences(all_txs, address),
      chartArray,
      stats,
      tokens: tokens.result,
      collector,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
