import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.post("/api/token", async function (req, res, next) {
  try {
    let tokenAddress = req.body.address;
    let chain = req.query.chain ? req.query.chain : "eth";

    const get_metadata = await fetch(
      `${baseURL}/erc20/metadata?addresses=${tokenAddress}&chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      }
    );

    if (!get_metadata.ok) {
      console.log(get_metadata.statusText);
      const message = await get_metadata.json();
      throw new Error(message);
    }

    let tokenMetadata = await get_metadata.json();

    const pricePromise = fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price?include=percent_change&chain=${chain}&exchange=uniswapv2`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const blockPromise = fetch(
      `https://deep-index.moralis.io/api/v2.2/block/${tokenMetadata[0].block_number}?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [priceResponse, blockResponse] = await Promise.all([
      pricePromise,
      blockPromise,
    ]);

    if (!blockResponse.ok) {
      const message = await blockResponse.json();
      console.log(blockResponse.statusText);
      return res.status(500).json(message);
    }

    // const tokenOwners = await ownersResponse.json();
    const tokenPrice = await priceResponse.json();
    const blockCreated = await blockResponse.json();

    if (tokenMetadata[0].total_supply_formatted) {
      if (tokenPrice.usdPrice) {
        tokenMetadata[0].fdv =
          Number(tokenMetadata[0].total_supply_formatted) *
          Number(tokenPrice.usdPrice);
        tokenMetadata[0].fdv = Number(tokenMetadata[0].fdv).toLocaleString(
          undefined,
          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        );
      }

      tokenMetadata[0].total_supply_formatted = Number(
        tokenMetadata[0].total_supply_formatted
      ).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }

    if (!tokenPrice.usdPrice) {
      tokenPrice.usdPrice = 0;
      tokenPrice.usdPriceFormatted = "0";
      tokenPrice["24hrPercentChange"] = "0";
    }

    const pairMetadata = fetch(
      `${baseURL}/erc20/metadata?chain=${chain}&addresses=${tokenPrice.pairAddress}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const lpHolders = fetch(
      `${baseURL}/erc20/${tokenPrice.pairAddress}/owners?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const pairBalances = fetch(
      `${baseURL}/wallets/${tokenPrice.pairAddress}/tokens?chain=${chain}&token_addresses=0x4200000000000000000000000000000000000006&token_addresses=${tokenAddress}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [pairMetadataResponse, lpResponse, pairBalanceResponse] =
      await Promise.all([pairMetadata, lpHolders, pairBalances]);

    if (!pairMetadataResponse.ok) {
      console.log(pairMetadataResponse.statusText);
      throw new Error(pairMetadataResponse.statusText);
    }

    if (!lpResponse.ok) {
      console.log(lpResponse.statusText);
      throw new Error(lpResponse.statusText);
    }

    if (!pairBalanceResponse.ok) {
      console.log(pairBalanceResponse.statusText);
      throw new Error(pairBalanceResponse.statusText);
    }

    const liquidityStatus = utilities.checkLiquidityLocked(lpHolders.result);

    return res.status(200).json({
      tokenAddress,
      tokenMetadata: tokenMetadata[0],
      tokenPrice,
      blockCreated,
      pairMetadata,
      liquidityProviders: lpHolders.result,
      pairBalance: pairBalances.result,
      liquidityStatus,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/token/:tokenAddress", async function (req, res, next) {
  try {
    let tokenAddress = req.params.tokenAddress;
    const chain = req.query.chain || "eth";
    const ownersPromise = fetch(
      `${baseURL}/erc20/${tokenAddress}/owners?limit=50&chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [ownersResponse] = await Promise.all([ownersPromise]);

    if (!ownersResponse.ok) {
      console.log(ownersResponse);
      const message = await ownersResponse.json();
      return res.status(500).json(message);
    }

    const tokenOwners = await ownersResponse.json();

    let topTenHolders = [];
    if (tokenOwners && tokenOwners.result && tokenOwners.result.length > 0) {
      topTenHolders = tokenOwners.result.slice(0, 10);
    }

    let totalBalance = topTenHolders.reduce(
      (acc, holder) => acc + Number(holder.balance_formatted),
      0
    );
    let totalUsd = topTenHolders.reduce(
      (acc, holder) => acc + Number(holder.usd_value),
      0
    );
    let totalPercentage = topTenHolders.reduce(
      (acc, holder) => acc + holder.percentage_relative_to_total_supply,
      0
    );

    const results = await Promise.all(
      topTenHolders.map((owner) => fetchDataForOwner(owner, tokenAddress))
    );

    let tokenOccurrences = results.reduce((acc, holder) => {
      holder.balanceData.forEach((token) => {
        const address = token.token_address;
        if (!acc[address]) {
          acc[address] = { count: 0, tokenDetails: token };
        }
        acc[address].count += 1;
      });
      return acc;
    }, {});

    // Filtering tokens held by at least three holders
    let commonTokens = Object.values(tokenOccurrences)
      .filter((item) => item.count >= 3)
      .map((item) => {
        // Extracting necessary token details
        return item;
      });

    return res.status(200).json({
      tokenOwners: tokenOwners.result,
      topTokenOwners: results,
      totalBalance,
      totalUsd,
      totalPercentage,
      commonTokens,
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/api/token/:tokenAddress/transfers",
  async function (req, res, next) {
    try {
      const chain = req.query.chain || "eth";
      let tokenAddress = req.params.tokenAddress;

      const transfersPromise = fetch(
        `${baseURL}/erc20/${tokenAddress}/transfers?limit=50&chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      const [transfersResponse] = await Promise.all([transfersPromise]);

      if (!transfersResponse.ok) {
        console.log(transfersResponse);
        const message = await transfersResponse.json();
        return res.status(500).json(message);
      }

      const tokenTransfers = await transfersResponse.json();

      return res.status(200).json({
        tokenTransfers: tokenTransfers.result,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/api/token/:tokenAddress/prices", async function (req, res, next) {
  try {
    const tokenAddress = req.params.tokenAddress;
    const chain = req.query.chain || "eth";

    // Initial setup to get the latest block (kept simple for readability)
    const latestBlockResponse = await fetch(
      `${baseURL}/latestBlockNumber/0x1`,
      {
        method: "GET",
        headers: { Accept: "application/json", "X-API-Key": API_KEY },
      }
    );

    if (!latestBlockResponse.ok) {
      console.log(responseBalance.statusText);
      throw new Error("Unable to fetch latest block");
    }
    const latest_block = await latestBlockResponse.json();

    // Prepare dates for the last 30 days including today
    const dates = Array.from({ length: 60 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date.toISOString();
    });

    // Fetch blocks for each date in parallel
    const blockPromises = dates.map((dateString) =>
      fetch(`${baseURL}/dateToBlock?chain=${chain}&date=${dateString}`, {
        method: "GET",
        headers: { Accept: "application/json", "X-API-Key": API_KEY },
      }).then((res) => res.json())
    );
    const blocks = await Promise.all(blockPromises);

    // Now fetch prices for each block in parallel
    const pricePromises = blocks.map((block) =>
      fetch(
        `${baseURL}/erc20/${tokenAddress}/price?chain=${chain}&to_block=${block.block}`,
        {
          method: "GET",
          headers: { Accept: "application/json", "X-API-Key": API_KEY },
        }
      ).then((res) => res.json())
    );
    const prices = await Promise.all(pricePromises);

    // Combine blocks and prices into price_blocks array
    const price_blocks = blocks.map((block, i) => ({
      x: dates[i],
      y: prices[i]?.usdPriceFormatted, // Assuming prices array returns an object with a usdPrice property
      block: block.block,
    }));

    const lastPrice = Number(price_blocks.at(0)?.y);
    const firstPrice = Number(price_blocks.at(-1)?.y);
    const threshold = 0.0001;

    let direction = firstPrice <= lastPrice ? "up" : "down";

    let percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    if (Math.abs(percentageChange) < threshold) {
      percentageChange = 0;
    }
    percentageChange = percentageChange.toFixed(2);

    let usdChange = lastPrice - firstPrice;
    usdChange = utilities.formatPrice(usdChange);

    price_blocks.reverse();

    return res.status(200).json({
      tokenPrices: price_blocks,
      tokenPriceStats: {
        percentageChange,
        usdChange,
        direction,
      },
    });
  } catch (e) {
    next(e);
  }
});

async function fetchDataForOwner(owner, tokenAddress) {
  let balanceData = [];
  let networthData = 0;
  let tokenPNL = 0;

  if (owner.owner_address.indexOf("0x00000000000000000000000000000") > -1) {
    return { owner, balanceData, networthData };
  }

  try {
    const balanceResponse = await fetch(
      `${baseURL}/wallets/${owner.owner_address}/tokens?exclude_spam=true&exclude_unverified_contracts=true&limit=11`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    if (balanceResponse.ok) {
      let balances = await balanceResponse.json();
      balanceData = balances.result.filter(
        (item) =>
          item.token_address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      );
    } else {
      console.log(`Failed to fetch balances for owner: ${owner.owner_address}`);
      console.log(balanceResponse.statusText);
      const message = await response.json();
      balanceData = [];
    }
  } catch (error) {
    console.error(
      `Error fetching balances for owner: ${owner.owner_address}`,
      error
    );
  }

  try {
    const networthResponse = await fetch(
      `${baseURL}/wallets/${owner.owner_address}/net-worth?exclude_spam=true&exclude_unverified_contracts=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    // Process networthResponse only if OK, otherwise keep networthData as 0
    if (networthResponse.ok) {
      networthData = await networthResponse.json();
    } else {
      console.log(`Failed to fetch networth for owner: ${owner.owner_address}`);
      console.log(networthResponse.statusText);
      networthData = "0";
    }
  } catch (error) {
    console.error(
      `Error fetching networth for owner: ${owner.owner_address}`,
      error
    );
  }

  try {
    const walletTokenPNL = await fetch(
      `${baseURL}/wallets/${owner.owner_address}/profitability?token_addresses=${tokenAddress}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    // Process walletTokenPNL only if OK, otherwise keep tokenPNL as 0
    if (walletTokenPNL.ok) {
      const rawTokenPNL = await walletTokenPNL.json();
      tokenPNL = rawTokenPNL.result;
    } else {
      console.log(`Failed to fetch PNL for owner: ${owner.owner_address}`);
      console.log(walletTokenPNL.statusText);
      tokenPNL = "0";
    }
  } catch (error) {
    console.error(
      `Error fetching networth for owner: ${owner.owner_address}`,
      error
    );
  }

  return { owner, balanceData, networthData, tokenPNL };
}

router.get("/api/wallet/tokens", async function (req, res, next) {
  try {
    const address = req.query.wallet;
    const chain =
      req.query.chain && req.query.chain !== "undefined"
        ? req.query.chain
        : "eth";
    const response = await fetch(
      `${baseURL}/wallets/${address}/tokens?chain=${chain}&exclude_spam=true&exclude_unverified_contracts=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.log(response.statusText);
      const message = await response.json();
      if (
        message &&
        message.message ===
          "Cannot fetch token balances as wallet contains over 2000 tokens. Please contact support for further assistance."
      )
        return res.status(200).json({ verified_tokens: [], unsupported: true });
    }
    const data = await response.json();

    let verified_tokens = [];
    let spam_tokens = [];

    const foundChain = utilities.chains.find((item) => item.chain === chain);
    for (const token of data.result) {
      verified_tokens.push(token);
    }

    return res.status(200).json({
      verified_tokens,
      spam_tokens,
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/api/token/:address/early-holders",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.address;
      const chain = req.query.chain || "eth";

      // Step 1: Call the verbose transaction history endpoint
      const verboseResponse = await fetch(
        `${baseURL}/${tokenAddress}/verbose?order=asc&limit=50&chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      if (!verboseResponse.ok) {
        const message = await verboseResponse.json();
        return res.status(500).json({ error: message });
      }

      const verboseData = await verboseResponse.json();
      const transactions = verboseData.result;

      // Step 2: Look for `enableTrading` event in logs
      let enableTradingBlock = null;
      for (const tx of transactions) {
        for (const log of tx.logs) {
          if (
            log.decoded_event &&
            log.decoded_event.label === "enableTrading"
          ) {
            enableTradingBlock = tx.block_number;
            break;
          }
        }
        if (enableTradingBlock) break;
      }

      if (!enableTradingBlock) {
        return res
          .status(404)
          .json({ message: "enableTrading event not found" });
      }

      // Step 3: Call the transfers endpoint with `to_block`
      let transfers = [];
      let cursor = null;

      do {
        const transferResponse = await fetch(
          `${baseURL}/erc20/${tokenAddress}/transfers?order=asc&to_block=${enableTradingBlock}&chain=${chain}${
            cursor ? `&cursor=${cursor}` : ""
          }`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": API_KEY,
            },
          }
        );

        if (!transferResponse.ok) {
          const message = await transferResponse.json();
          return res.status(500).json({ error: message });
        }

        const transferData = await transferResponse.json();

        // Step 4: Check if transfers are found
        if (transferData.result.length === 0) {
          return res.status(404).json({ message: "No transfers found" });
        }

        transfers = transfers.concat(transferData.result);
        cursor = transferData.cursor;
      } while (cursor); // Paginate if cursor exists

      // Step 5: Extract all `to_address` from transfers
      const toAddresses = transfers.map((transfer) => transfer.to_address);

      return res.status(200).json({
        message: "Transfers found",
        toAddresses: [...new Set(toAddresses)], // Return unique addresses
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/token/:address/trading-status",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.address;
      const chain = req.query.chain || "eth";

      // Step 1: Fetch token metadata to get the creation block number
      const metadataResponse = await fetch(
        `${baseURL}/erc20/metadata?chain=${chain}&addresses=${tokenAddress}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      if (!metadataResponse.ok) {
        const message = await metadataResponse.json();
        return res.status(500).json({ error: message });
      }

      const metadata = await metadataResponse.json();
      const tokenCreationBlock = metadata[0]?.block_number || null;

      if (!tokenCreationBlock) {
        return res
          .status(500)
          .json({ error: "Unable to retrieve token creation block number" });
      }

      // Step 2: Call the verbose transaction history endpoint
      const verboseResponse = await fetch(
        `${baseURL}/${tokenAddress}/verbose?order=asc&limit=300&chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      if (!verboseResponse.ok) {
        const message = await verboseResponse.json();
        return res.status(500).json({ error: message });
      }

      const verboseData = await verboseResponse.json();
      const transactions = verboseData.result;

      // Initialize results
      let pairCreated = false;
      let tradingEnabled = false;
      let approvalFound = false;
      let pairCreatedBlock = null;
      let enableTradingBlock = null;
      let approvalBlock = null;

      // Step 3: Look for PairCreated, Mint, Sync (V2) and PoolCreated, Initialize (V3)
      for (const tx of transactions) {
        for (const log of tx.logs) {
          // Check for PairCreated (V2) or PoolCreated (V3)
          if (
            (log.decoded_event && log.decoded_event.label === "PairCreated") ||
            (log.decoded_event && log.decoded_event.label === "PoolCreated")
          ) {
            pairCreated = true;
            pairCreatedBlock = tx.block_number;
          }

          // Check for Mint or Sync events (liquidity added)
          if (
            log.decoded_event &&
            (log.decoded_event.label === "Mint" ||
              log.decoded_event.label === "Sync")
          ) {
            tradingEnabled = true;
            enableTradingBlock = tx.block_number;
          }

          // Check for Approval event for Disperse app
          if (
            log.decoded_event &&
            log.decoded_event.label === "Approval" &&
            log.decoded_event.params.some(
              (param) =>
                param.name === "spender" &&
                param.value.toLowerCase() ===
                  "0xd152f549545093347a162dce210e7293f1452150".toLowerCase()
            )
          ) {
            approvalFound = true;
            approvalBlock = tx.block_number;
          }
        }

        // Check for enableTrading() or equivalent
        if (tx.decoded_call && tx.decoded_call.label === "enableTrading") {
          tradingEnabled = true;
          enableTradingBlock = tx.block_number;
        }
      }

      // Step 4: Fetch token transfers between token creation and pair creation blocks (Pre-PairCreated)
      let transferCountPrePairCreated = 0;
      let tokenTransfersPrePairCreated = [];

      if (pairCreatedBlock) {
        const transfersPrePairResponse = await fetch(
          `${baseURL}/erc20/${tokenAddress}/transfers?order=asc&chain=${chain}&limit=300&from_block=${tokenCreationBlock}&to_block=${
            pairCreatedBlock - 1
          }`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": API_KEY,
            },
          }
        );

        if (transfersPrePairResponse.ok) {
          const transferData = await transfersPrePairResponse.json();
          transferCountPrePairCreated = transferData.result.length;
          tokenTransfersPrePairCreated = transferData.result;
        }
      }

      // Step 5: Fetch token transfers between pair creation and trading enabled blocks (Pre-TradingStart)
      let transferCountPreTradingStart = 0;
      let tokenTransfersPreTradingStart = [];

      if (enableTradingBlock && pairCreatedBlock) {
        const transfersPreTradingResponse = await fetch(
          `${baseURL}/erc20/${tokenAddress}/transfers?order=asc&chain=${chain}&limit=300&from_block=${pairCreatedBlock}&to_block=${
            enableTradingBlock - 1
          }`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": API_KEY,
            },
          }
        );

        if (transfersPreTradingResponse.ok) {
          const transferData = await transfersPreTradingResponse.json();
          transferCountPreTradingStart = transferData.result.length;
          tokenTransfersPreTradingStart = transferData.result;
        }
      }

      // Step 6: Return the final results
      return res.status(200).json({
        tokenCreated: `Created token at block number ${tokenCreationBlock}`,
        pairCreated: pairCreated
          ? `Created pair at block number ${pairCreatedBlock}`
          : "Unable to detect create pair event",
        tradingEnabled: tradingEnabled
          ? `Enabled trading at block number ${enableTradingBlock}`
          : "Unable to detect enabled trading event",
        approvalFound: approvalFound
          ? `Approved Disperse app at block number ${approvalBlock}`
          : "Unable to detect Disperse app interaction",
        tokenTransferCountPrePairCreated: transferCountPrePairCreated,
        tokenTransfersPrePairCreated: tokenTransfersPrePairCreated,
        tokenTransferCountPreTradingStart: transferCountPreTradingStart,
        tokenTransfersPreTradingStart: tokenTransfersPreTradingStart,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/token/:tokenAddress/holders-analysis",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.tokenAddress;
      const chain = req.query.chain || "eth";
      const pairCreatedBlock = parseInt(req.query.pairCreatedBlock, 10);

      // Step 1: Fetch the deployer address
      const deployerResponse = await fetch(
        `https://0x1-contract-api.aws-prod-api-usecases-1-vpn.moralis.io/contract?contractAddress=${tokenAddress}&forceRead=false`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      const deployerData = await deployerResponse.json();
      const deployerAddress =
        deployerData.blockNumber > 0 ? deployerData.deployerAddress : null;

      // Step 2: Fetch token metadata
      const metadataResponse = await fetch(
        `${baseURL}/erc20/metadata?addresses=${tokenAddress}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );
      const metadataData = await metadataResponse.json();
      const tokenMetadata = metadataData[0] || {};
      const tokenCreatedBlock = parseInt(tokenMetadata.block_number || "0", 10);
      const totalSupply = parseFloat(
        tokenMetadata.total_supply_formatted || "0"
      );

      // Step 3: Fetch token transfers
      const transfersResponse = await fetch(
        `${baseURL}/erc20/${tokenAddress}/transfers?chain=${chain}&limit=300&order=asc`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );
      if (!transfersResponse.ok) {
        const message = await transfersResponse.json();
        return res.status(500).json({ error: message });
      }
      const transfersData = await transfersResponse.json();
      const transfers = transfersData.result || [];

      // Step 4: Analyze transfers and classify wallets
      const walletData = {};
      const walletLabelCounts = {
        creator: 0,
        team: 0,
        insider: 0,
        sniper: 0,
        early_trader: 0,
        regular_trader: 0,
      };
      const holderCategoryCounts = {
        held: 0,
        accumulated: 0,
        sell_partial: 0,
        sold_all: 0,
      };

      let walletCount = 0;

      // Step 5: Classify each address and limit to 100 wallets
      for (const transfer of transfers) {
        if (walletCount >= 100) break; // Stop processing if we reach 100 wallets

        const {
          from_address,
          to_address,
          block_number,
          value_decimal,
          transaction_hash,
        } = transfer;
        const blockNumber = parseInt(block_number, 10);

        // Skip if this address is already processed
        if (walletData[to_address]) continue;

        // Initialize wallet data
        walletData[to_address] = {
          address: to_address,
          amount_acquired: parseFloat(value_decimal),
          block_acquired: blockNumber,
          timestamp_acquired: transfer.block_timestamp,
          transaction_hash, // Include the transaction hash
          blocks_acquired_after_token_creation: blockNumber - tokenCreatedBlock,
          blocks_acquired_after_pair_creation: blockNumber - pairCreatedBlock,
          is_contract: null, // To be determined later
          contract_label: null,
          current_balance: 0,
          wallet_label: null,
          holder_category: null,
        };

        walletCount++;
      }

      // Step 6: Assign wallet labels
      for (const address of Object.keys(walletData)) {
        const wallet = walletData[address];
        const blockNumber = wallet.block_acquired;
        let labelAssigned = false;

        if (address === deployerAddress) {
          wallet.wallet_label = "creator";
          labelAssigned = true;
        } else if (
          transfers.some(
            (transfer) =>
              transfer.from_address === deployerAddress &&
              transfer.to_address === address
          )
        ) {
          wallet.wallet_label = "team";
          labelAssigned = true;
        } else if (blockNumber < pairCreatedBlock) {
          wallet.wallet_label = "insider";
          labelAssigned = true;
        } else if (
          blockNumber === pairCreatedBlock ||
          blockNumber === pairCreatedBlock + 1
        ) {
          wallet.wallet_label = "sniper";
          labelAssigned = true;
        } else if (
          blockNumber > pairCreatedBlock + 1 &&
          blockNumber <= pairCreatedBlock + 5
        ) {
          wallet.wallet_label = "early_trader";
          labelAssigned = true;
        } else if (blockNumber > pairCreatedBlock + 5) {
          wallet.wallet_label = "regular_trader";
          labelAssigned = true;
        }

        if (labelAssigned) {
          walletLabelCounts[wallet.wallet_label]++;
        }
      }

      // Step 7: Check if addresses are contracts using the provided endpoint
      const contractChecks = Object.keys(walletData).map(async (address) => {
        try {
          const contractCheckRes = await fetch(
            `https://0x1-contract-api.aws-prod-api-usecases-1-vpn.moralis.io/contract?contractAddress=${address}&forceRead=false`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
            }
          );
          const contractCheckData = await contractCheckRes.json();

          // Determine if the address is a contract
          const isContract =
            contractCheckData.blockNumber && contractCheckData.blockNumber > 0;
          walletData[address].is_contract = isContract;
        } catch (error) {
          console.error(
            `Error checking if address ${address} is a contract:`,
            error
          );
          walletData[address].is_contract = null; // Set to null in case of an error
        }
      });

      await Promise.all(contractChecks);

      // Step 8: Fetch current balances and determine holder categories
      const balanceChecks = Object.keys(walletData).map(async (address) => {
        if (!walletData[address].is_contract) {
          const balanceRes = await fetch(
            `${baseURL}/wallets/${address}/tokens?token_addresses=${tokenAddress}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "X-API-Key": API_KEY,
              },
            }
          );
          const balanceData = await balanceRes.json();
          const balanceItem = balanceData.result && balanceData.result[0];
          walletData[address].current_balance = balanceItem
            ? parseFloat(balanceItem.balance_formatted)
            : 0;
        }

        // Step 9: Determine holder category
        const acquired = walletData[address].amount_acquired;
        const current = walletData[address].current_balance;

        if (current === acquired) {
          walletData[address].holder_category = "held";
          holderCategoryCounts.held++;
        } else if (current > acquired) {
          walletData[address].holder_category = "accumulated";
          holderCategoryCounts.accumulated++;
        } else if (current > 0.01) {
          walletData[address].holder_category = "sell_partial";
          holderCategoryCounts.sell_partial++;
        } else {
          walletData[address].holder_category = "sold_all";
          holderCategoryCounts.sold_all++;
        }
      });

      await Promise.all(balanceChecks);

      // Step 10: Calculate summary statistics
      let first100HoldersSupply = 0;
      let first100HoldersCurrentBalance = 0;

      const addresses = Object.values(walletData);
      addresses.forEach((addr) => {
        first100HoldersSupply += addr.amount_acquired;
        first100HoldersCurrentBalance += addr.current_balance;
      });

      const first100HoldersSupplyPercent =
        (first100HoldersSupply / totalSupply) * 100;
      const first100HoldersCurrentSupplyPercent =
        (first100HoldersCurrentBalance / totalSupply) * 100;

      // Step 11: Prepare the summary response
      const summary = {
        token_address: tokenAddress,
        token_created_block: tokenCreatedBlock,
        pair_created_block: pairCreatedBlock,
        first_100_holders_supply: first100HoldersSupply,
        first_100_holders_supply_percent: first100HoldersSupplyPercent,
        first_100_holders_current_balance: first100HoldersCurrentBalance,
        first_100_holders_current_supply_percent:
          first100HoldersCurrentSupplyPercent,
        contracts: addresses.filter((addr) => addr.is_contract).length,
        wallets: addresses.filter((addr) => !addr.is_contract).length,
        wallet_labels: walletLabelCounts,
        holder_categories: holderCategoryCounts,
        addresses,
      };

      return res.status(200).json(summary);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/chain/:chain/tokens/:address/trending",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.address;
      const chain = req.query.chain || "eth";
      const usdValue = 5000;

      if (!tokenAddress) {
        return res.status(400).json({ error: "tokenAddress is required" });
      }

      const fetchWithErrorHandling = async (url, endpointType = "") => {
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
              `Error fetching ${endpointType}: ${response.status} ${response.statusText}`
            );
          }
          return await response.json();
        } catch (error) {
          console.error(
            `Failed to fetch URL: ${url} for ${endpointType}`,
            error
          );
          return { result: [] };
        }
      };

      // URLs for token-specific data
      const urls = [
        `${baseURL}/erc20/${tokenAddress}/swaps?limit=100&chain=${chain}`,
        `${baseURL}/erc20/${tokenAddress}/owners?chain=${chain}`,
        `${baseURL}/erc20/${tokenAddress}/top-gainers?chain=${chain}`,
      ];

      // Fetch all data in parallel
      const [swapsResponse, ownersResponse, topGainersResponse] =
        await Promise.all(
          urls.map((url, index) =>
            fetchWithErrorHandling(
              url,
              index === 0 ? "swaps" : index === 1 ? "owners" : "top-gainers"
            )
          )
        );

      // Extract data
      const swaps = swapsResponse?.result || [];
      const owners = ownersResponse?.result || [];
      const topGainers = topGainersResponse?.result || [];

      // Label transactions
      const labeledTransactions = new Map();

      const labelTransaction = (tx, type) => {
        const hash = tx.transactionHash;
        if (!labeledTransactions.has(hash)) {
          labeledTransactions.set(hash, { ...tx, type });
        }
      };

      // Step 1: Large Trades
      swaps.forEach((tx) => {
        const baseToken = tx.baseToken?.toLowerCase();
        const quoteToken = tx.quoteToken?.toLowerCase();
        if (
          tx.totalValueUsd > usdValue &&
          (baseToken === tokenAddress.toLowerCase() ||
            quoteToken === tokenAddress.toLowerCase())
        ) {
          labelTransaction(tx, "largeTrade");
        }
      });

      // Step 2: Smart Money
      const traderUrls = topGainers
        .slice(0, 20)
        .map(
          (trader) =>
            `${baseURL}/wallets/${trader.address}/swaps?limit=5&chain=${chain}`
        );
      const traderSwaps = await Promise.all(
        traderUrls.map((url) => fetchWithErrorHandling(url, "smartMoney"))
      );

      traderSwaps.forEach((response) => {
        const trades = response.result || [];
        trades.forEach((tx) => labelTransaction(tx, "smartMoney"));
      });

      // Step 3: Whale Movements
      const holderUrls = owners
        .filter(
          (holder) => !holder.owner_address.includes("0x000000000000000000000")
        ) // Filter out unwanted addresses
        .slice(0, 20)
        .map(
          (holder) =>
            `${baseURL}/wallets/${holder.owner_address}/swaps?limit=5&chain=${chain}`
        );

      const holderSwaps = await Promise.all(
        holderUrls.map((url) => fetchWithErrorHandling(url, "whaleMovement"))
      );

      holderSwaps.forEach((response) => {
        const trades = response.result || [];
        trades.forEach((tx) => labelTransaction(tx, "whaleMovement"));
      });

      // Convert Map to Array and Sort
      const sortedTransactions = Array.from(labeledTransactions.values()).sort(
        (a, b) => new Date(b.blockTimestamp) - new Date(a.blockTimestamp)
      );

      return res.status(200).json({
        sortedTransactions,
        tokenDetails: tokenAddress,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/chain/:chain/tokens/:address/holders",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.address;
      const chain = req.params.chain;

      if (chain === "solana") {
        return res.status(200).json([]);
      }

      if (!tokenAddress) {
        return res.status(400).json({ error: "tokenAddress is required" });
      }

      const ownersPromise = fetch(
        `${baseURL}/erc20/${tokenAddress}/owners?limit=50&chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      const [ownersResponse] = await Promise.all([ownersPromise]);

      if (!ownersResponse.ok) {
        console.log(ownersResponse);
        const message = await ownersResponse.json();
        return res.status(500).json(message);
      }

      const holders = await ownersResponse.json();

      return res.status(200).json(holders.result);
    } catch (e) {
      next(e);
    }
  }
);

const fetchAllHistoricalTokenHolders = async (url) => {
  let allResults = [];
  let nextCursor = null;

  try {
    do {
      // Construct the URL dynamically, avoiding "&cursor=null"
      const requestUrl = nextCursor ? `${url}&cursor=${nextCursor}` : url;
      console.log(`Calling ${requestUrl}`);

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      });

      // Check for HTTP errors
      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate the data structure
      if (data.result && Array.isArray(data.result)) {
        allResults = [...allResults, ...data.result];
      } else {
        console.warn(`Unexpected data format:`, data);
      }

      // Update cursor for the next iteration
      nextCursor = data.cursor || null;
    } while (nextCursor);
  } catch (error) {
    console.error("An error occurred while fetching token holders:", error);
  }

  return allResults;
};
router.get(
  "/api/chain/:chain/tokens/:address/holders/insights",
  async (req, res) => {
    let { chain, address } = req.params;
    console.log(req.query);
    const rollupTimeFrame = req.query.rollupTimeFrame;
    const earlyTimestamp = req.query.start;
    const latestTimestamp = req.query.end;
    address = address.toLowerCase();

    try {
      if (!chain || !address) {
        return res
          .status(400)
          .json({ error: "Chain and address are required." });
      }

      // Token Holder Summary API URL
      const tokenHolderSummaryUrl = `${baseURL}/erc20/${address}/holders?chain=${chain}
      `;
      const tokenHolderSummaryPromise = fetch(tokenHolderSummaryUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }).then((response) => response.json());

      // Historical Token Holders API URL
      const historicalTokenHoldersUrl = `${baseURL}/erc20/${address}/holders/historical?chain=${chain}&fromDate=${earlyTimestamp}&toDate=${latestTimestamp}&limit=100&timeFrame=${rollupTimeFrame}`;
      const historicalTokenHoldersPromise = fetchAllHistoricalTokenHolders(
        historicalTokenHoldersUrl
      );

      // Await all promises
      const [tokenHolderSummary, historicalTokenHolders] = await Promise.all([
        tokenHolderSummaryPromise,
        historicalTokenHoldersPromise,
      ]);

      return res.status(200).json({
        summary: tokenHolderSummary,
        timeSeries: historicalTokenHolders,
      });
    } catch (error) {
      console.error("Error fetching token data:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching token data." });
    }
  }
);

router.get(
  "/api/chain/:chain/tokens/:address/traders",
  async function (req, res, next) {
    try {
      const tokenAddress = req.params.address;
      const chain = req.params.chain;

      if (!tokenAddress) {
        return res.status(400).json({ error: "tokenAddress is required" });
      }

      const tradersPromise = fetch(
        `${baseURL}/erc20/${tokenAddress}/top-gainers?chain=${chain}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": API_KEY,
          },
        }
      );

      const [tradersResponse] = await Promise.all([tradersPromise]);

      if (!tradersResponse.ok) {
        console.log(tradersResponse);
        const message = await tradersResponse.json();
        return res.status(200).json([]);
      }

      const traders = await tradersResponse.json();

      return res.status(200).json(traders.result);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/api/wallet/:walletAddress/token/:tokenAddress",
  async function (req, res, next) {
    const { walletAddress, tokenAddress } = req.params;
    const chain = req.query.chain;
    const fromDate = moment().subtract(7, "days").format("YYYY-MM-DD");

    try {
      // Construct the API URLs
      const tokensUrl = `${baseURL}/wallets/${walletAddress}/tokens?token_addresses=${tokenAddress}&chain=${chain}`;
      const tokenBalancesUrl = `${baseURL}/wallets/${walletAddress}/tokens?chain=${chain}&exclude_spam=true&max_token_inactivity=7&exclude_unverified_contracts=true`;
      const profitabilityUrl = `${baseURL}/wallets/${walletAddress}/profitability?token_addresses=${tokenAddress}&chain=${chain}`;
      const walletPnlUrl = `${baseURL}/wallets/${walletAddress}/profitability/summary?chain=${chain}`;
      let walletSwapsUrl = `${baseURL}/wallets/${walletAddress}/swaps?chain=${chain}&fromDate=${fromDate}`;

      if (req.query.trades && req.query.trades === "all") {
        walletSwapsUrl = `${baseURL}/wallets/${walletAddress}/swaps?chain=${chain}&limit=5`;
      }
      // Make parallel API calls
      const [
        tokensResponse,
        tokenBalancesResponse,
        profitabilityResponse,
        walletPnlResponse,
        walletSwapsResponse,
      ] = await Promise.all([
        fetch(tokensUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }),
        fetch(tokenBalancesUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }),
        fetch(profitabilityUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }),
        fetch(walletPnlUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }),
        fetch(walletSwapsUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }),
      ]);

      // Check all responses for success
      if (
        !tokensResponse.ok ||
        !profitabilityResponse.ok ||
        !walletSwapsResponse.ok
      ) {
        return res
          .status(500)
          .json({ error: "Failed to fetch data from one or more APIs." });
      }

      // Parse responses as JSON
      const [
        tokensData,
        tokenBalancesData,
        profitabilityData,
        walletPnlData,
        walletSwapsData,
      ] = await Promise.all([
        tokensResponse.json(),
        tokenBalancesResponse.json(),
        profitabilityResponse.json(),
        walletPnlResponse.json(),
        walletSwapsResponse.json(),
      ]);

      // Process walletSwapsData to calculate summary metrics
      const walletSwaps = walletSwapsData.result;
      let buyTransactions = 0;
      let sellTransactions = 0;
      let buyVolume = 0;
      let sellVolume = 0;
      const buyTokensTraded = new Set();
      const sellTokensTraded = new Set();

      walletSwaps.forEach((swap) => {
        const usdValue = Math.abs(swap.totalValueUsd || 0);

        if (swap.transactionType === "buy") {
          buyTransactions++;
          buyVolume += usdValue;

          // Add bought token to unique set
          if (swap.bought?.address) {
            buyTokensTraded.add(swap.bought.address);
          }
        } else if (swap.transactionType === "sell") {
          sellTransactions++;
          sellVolume += usdValue;

          // Add sold token to unique set
          if (swap.sold?.address) {
            sellTokensTraded.add(swap.sold.address);
          }
        }
      });

      const swapsSummary = {
        buyTransactions,
        sellTransactions,
        buyVolume,
        sellVolume,
        buyTokensTraded: buyTokensTraded.size,
        sellTokensTraded: sellTokensTraded.size,
      };

      // Combine the results into one object
      const result = {
        tokenBalance: tokensData?.result[0]?.balance_formatted,
        tokenBalances: tokenBalancesData?.result.slice(0, 5),
        pnl: profitabilityData.result[0],
        walletPnl: walletPnlData,
        swaps: walletSwaps.slice(0, 5),
        swapsSummary, // Add the summary here
      };

      // Send the combined result as the response
      res.json(result);
    } catch (error) {
      console.error("Error making API calls:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.get(
  "/api/wallet/:walletAddress/token/:tokenAddress/top-holder",
  async function (req, res, next) {
    const { walletAddress, tokenAddress } = req.params;
    const chain = req.query.chain;
    try {
      // Construct the API URLs
      let tokensUrl = `${baseURL}/wallets/${walletAddress}/tokens?token_addresses=${tokenAddress}&chain=${chain}`;
      let tokenBalancesUrl = `${baseURL}/wallets/${walletAddress}/tokens?chain=${chain}&exclude_spam=true&max_token_inactivity=7&exclude_unverified_contracts=true`;
      let walletHistoryUrl = `${baseURL}/wallets/${walletAddress}/history?chain=${chain}&limit=10`;

      // Make parallel API calls
      const [tokensResponse, tokenBalancesResponse, walletHistoryResponse] =
        await Promise.all([
          fetch(tokensUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": `${API_KEY}`,
            },
          }),
          fetch(tokenBalancesUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": `${API_KEY}`,
            },
          }),
          fetch(walletHistoryUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": `${API_KEY}`,
            },
          }),
        ]);

      // Check all responses for success
      if (!tokensResponse.ok) {
        return res
          .status(500)
          .json({ error: "Failed to fetch data from one or more APIs." });
      }

      // Parse responses as JSON
      const [tokensData, tokenBalancesData, walletHistoryData] =
        await Promise.all([
          tokensResponse.json(),
          tokenBalancesResponse.json(),
          walletHistoryResponse.json(),
        ]);

      // Combine the results into one object
      const result = {
        tokenBalance: tokensData?.result[0]?.balance_formatted,
        tokenBalances: tokenBalancesData?.result.slice(0, 11),
        walletHistory: walletHistoryData?.result.slice(0, 20),
      };

      // Send the combined result as the response
      res.json(result);
    } catch (error) {
      console.error("Error making API calls:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.get(
  "/api/wallet/:walletAddress/token/:tokenAddress/swaps",
  async function (req, res, next) {
    const { walletAddress, tokenAddress } = req.params;
    const chain = req.query.chain;

    try {
      const response = await fetch(
        `${baseURL}/wallets/${walletAddress}/swaps?tokenAddress=${tokenAddress}&chain=${chain}`,
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
  }
);

export default router;
