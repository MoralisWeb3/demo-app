import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import { ethers } from "ethers";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/wallet/nfts", async function (req, res, next) {
  try {
    const address = req.query.wallet;
    const chain = req.query.chain ? req.query.chain : "eth";
    let nfts = [];
    let cursor = null;
    let page = 0;
    do {
      let chainURL = `${baseURL}/${address}/nft?chain=${chain}&exclude_spam=true&normalizeMetadata=true&media_items=true&include_prices=true&cursor=${cursor}`;
      if (chain !== "eth") {
        //Only eth is supported right now
        chainURL = `${baseURL}/${address}/nft?chain=${chain}&exclude_spam=true&normalizeMetadata=true&media_items=true&cursor=${cursor}`;
      }
      const response = await fetch(chainURL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      });

      if (!response.ok) {
        console.log(response.statusText);
        const message = await response.json();
      }

      const data = await response.json();

      console.log(`Got page ${data.page}`);
      if (data.result && data.result.length > 0) {
        for (const nft of data.result) {
          nfts.push(nft);
        }
      }

      cursor = data.cursor;

      page = data.page;
      if (page > 5) {
        break;
      }
    } while (cursor != "" && cursor != null);

    return res.status(200).json(nfts);
  } catch (e) {
    next(e);
  }
});

router.get("/api/nfts/:address", async function (req, res, next) {
  try {
    const address = req.params.address;
    const chain = req.query.chain ? req.query.chain : "eth";

    const metadataPromise = fetch(
      `${baseURL}/nft/${address}/metadata?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const nftsPromise = fetch(
      `${baseURL}/nft/${address}?chain=${chain}&normalizeMetadata=true&media_items=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const transfersPromise = fetch(
      `${baseURL}/nft/${address}/transfers?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const ownersPromise = fetch(
      `${baseURL}/nft/${address}/owners?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [metadataResponse, nftsResponse, transfersResponse, ownersResponse] =
      await Promise.all([
        metadataPromise,
        nftsPromise,
        transfersPromise,
        ownersPromise,
      ]);

    if (!metadataResponse.ok) {
      const message = await metadataResponse.json();
      console.log(metadataResponse.statusText);
      return res.status(500).json(message);
    }

    if (!nftsResponse.ok) {
      const message = await nftsResponse.json();
      console.log(nftsResponse.statusText);
      return res.status(500).json(message);
    }

    if (!transfersResponse.ok) {
      const message = await transfersPromise.json();
      console.log(transfersPromise.statusText);
      return res.status(500).json(message);
    }

    if (!ownersResponse.ok) {
      const message = await ownersPromise.json();
      console.log(ownersPromise.statusText);
      return res.status(500).json(message);
    }

    const collectionMetadata = await metadataResponse.json();
    const collectionNFTs = await nftsResponse.json();
    const collectionTransfers = await transfersResponse.json();
    const collectionOwners = await ownersResponse.json();

    return res.status(200).json({
      collectionMetadata: collectionMetadata,
      collectionNFTs: collectionNFTs.result,
      collectionTransfers: collectionTransfers.result,
      collectionOwners: collectionOwners.result,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/nfts/:address/trades", async function (req, res, next) {
  try {
    const address = req.params.address;
    const chain = req.query.chain ? req.query.chain : "eth";

    const tradesPromise = fetch(
      `${baseURL}/nft/${address}/trades?chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );
    const [tradesResponse] = await Promise.all([tradesPromise]);

    if (!tradesResponse.ok) {
      const message = await tradesResponse.json();
      console.log(tradesResponse.statusText);
      console.log(tradesResponse);
      return res.status(500).json(message);
    }

    const collectionTrades = await tradesResponse.json();

    return res.status(200).json({
      collectionTrades: collectionTrades.result,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/api/nfts/:address/:token_id", async function (req, res, next) {
  try {
    const address = req.params.address;
    const tokenId = req.params.token_id;
    const chain = req.query.chain ? req.query.chain : "eth";

    const metadataPromise = fetch(
      `${baseURL}/nft/${address}/${tokenId}?normalizeMetadata=true&chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const tokenSalePricesPromise = fetch(
      `${baseURL}/nft/${address}/${tokenId}/price?chain=${chain}&days=365`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const collectionSalePricesPromise = fetch(
      `${baseURL}/nft/${address}/price?chain=${chain}&days=90`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const tradesPromise = fetch(
      `${baseURL}/nft/${address}/${tokenId}/trades?days=365&chain=${chain}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [
      metadataResponse,
      tokenSaleResponse,
      collectionSaleResponse,
      tradesResponse,
    ] = await Promise.all([
      metadataPromise,
      tokenSalePricesPromise,
      collectionSalePricesPromise,
      tradesPromise,
    ]);

    if (!metadataResponse.ok) {
      const message = await metadataResponse.json();
      console.log(metadataResponse.statusText, `metadata`);
      return res.status(500).json(message);
    }

    if (!tokenSaleResponse.ok && tokenSaleResponse.status !== 404) {
      console.log(tokenSaleResponse);
      const message = await tokenSaleResponse.json();
      console.log(tokenSaleResponse.statusText, `tokenSales`);
      return res.status(500).json(message);
    }

    if (!collectionSaleResponse.ok && tokenSaleResponse.status !== 404) {
      const message = await collectionSaleResponse.json();
      console.log(collectionSaleResponse.statusText, `collectionSales`);
      return res.status(500).json(message);
    }

    if (!tradesResponse.ok) {
      const message = await tradesResponse.json();
      console.log(tradesResponse.statusText, `trades`);
      return res.status(500).json(message);
    }

    const nftMetadata = await metadataResponse.json();
    const nftSalePrices = await tokenSaleResponse.json();
    const collectionSalePrices = await collectionSaleResponse.json();
    const nftTrades = await tradesResponse.json();

    return res.status(200).json({
      nftMetadata,
      nftSalePrices,
      collectionSalePrices,
      nftTrades: nftTrades.result,
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/api/wallet/nfts/:address/:token_id",
  async function (req, res, next) {
    try {
      const address = req.params.address;
      const token_id = req.params.token_id;
      const chain = req.query.chain ? req.query.chain : "eth";
      const response = await fetch(
        `${baseURL}/nft/${address}/${token_id}?chain=${chain}&normalizeMetadata=true&media_items=true&include_prices=true`,
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
      }

      const nft = await response.json();

      if (nft) {
        const get_transfer = await fetch(
          `${baseURL}/nft/${address}/${token_id}/transfers?chain=${chain}&limit=1`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-API-Key": `${API_KEY}`,
            },
          }
        );

        const transfer = await get_transfer.json();
        nft.transfer_event = transfer.result[0];
        nft.received_at = transfer.result[0].block_timestamp;
        nft.received_at_label = moment(
          transfer.result[0].block_timestamp
        ).fromNow();
        if (nft.transfer_event.value !== "0") {
          nft.transfer_event.type = "Purchased";
          nft.transfer_event.value_decimals = ethers.formatUnits(
            nft.transfer_event.value,
            18
          );
        }

        if (
          nft.transfer_event.from_address ===
          "0x0000000000000000000000000000000000000000"
        ) {
          nft.transfer_event.type = "Minted";
        }

        if (
          nft.transfer_event.value === "0" &&
          nft.transfer_event.from_address !==
            "0x0000000000000000000000000000000000000000"
        ) {
          nft.transfer_event.type = "Received";
        }

        if (nft.transfer_event.operator) {
          nft.transfer_event.type = "Airdropped";
        }
      }

      return res.status(200).json(nft);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/api/marketplace", async function (req, res, next) {
  try {
    const trendingCollections = fetch(
      `${baseURL}/market-data/nfts/hottest-collections`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const topCollections = fetch(
      `${baseURL}/market-data/nfts/top-collections`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": API_KEY,
        },
      }
    );

    const [trendingResponse, topResponse] = await Promise.all([
      trendingCollections,
      topCollections,
    ]);

    if (!trendingResponse.ok) {
      const message = await trendingResponse.json();
      console.log(trendingResponse.statusText);
      return res.status(500).json(message);
    }

    if (!topResponse.ok) {
      const message = await topResponse.json();
      console.log(topResponse.statusText);
      return res.status(500).json(message);
    }

    const trending = await trendingResponse.json();
    const top = await topResponse.json();

    let topFour = [];
    if (trending && trending.length > 0) {
      topFour = trending.slice(0, 4);
    }

    let addresses = [];
    topFour.forEach(function (collection) {
      addresses.push(collection.collection_address);
    });

    const response = await fetch(`${baseURL}/nft/metadata`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-API-Key": `${API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ addresses: addresses }),
    });

    if (!response.ok) {
      console.log(response.statusText);
      const message = await response.json();
      return res.status(500).json(message);
    }

    const featured = await response.json();

    if (featured && featured.length > 0) {
      featured.forEach((feature) => {
        const trend = topFour.find(
          (t) => t.collection_address === feature.token_address
        );
        if (trend) {
          feature.collection_title = feature.name;
          // Merge specific fields from trending into featured
          feature.floor_price = trend.floor_price;
          feature.floor_price_usd = trend.floor_price_usd;
          feature.floor_price_24hr_percent_change =
            trend.floor_price_24hr_percent_change;
          feature.volume_usd = trend.volume_usd;
          feature.volume_24hr_percent_change = trend.volume_24hr_percent_change;
          feature.average_price_usd = trend.average_price_usd;
        }
      });
    }

    return res.status(200).json({
      trending,
      top,
      featured,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
