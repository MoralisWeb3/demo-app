import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import { ethers } from "ethers";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/volume/categories", async function (req, res, next) {
  try {
    // Fetch chains and categories in parallel
    const [chainsResult, categoriesResult] = await Promise.all([
      fetch(`${baseURL}/volume/chains`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      }),
      fetch(`${baseURL}/volume/categories`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      }),
    ]);

    if (!chainsResult.ok) {
      const message = await chainsResult.json();
      throw new Error(message.error || message);
    }
    if (!categoriesResult.ok) {
      const message = await categoriesResult.json();
      throw new Error(message.error || message);
    }

    const chains = (await chainsResult.json()).chains;
    const categories = (await categoriesResult.json()).categories;

    // Fetch timeseries data for categories in parallel
    const fetchTimeseries = async (categoryId) => {
      const response = await fetch(
        `${baseURL}/volume/timeseries/${categoryId}?timeframe=1d`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.json();
        console.error(message);
        throw new Error(message.error || message);
      }

      return response.json();
    };

    // Fetch timeseries data for chains in parallel
    const fetchChainTimeseries = async (chainId) => {
      const response = await fetch(
        `${baseURL}/volume/timeseries?timeframe=1d&chain=${chainId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-API-Key": `${API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const message = await response.json();
        console.error(message);
        throw new Error(message.error || message);
      }

      return response.json();
    };

    // Parallelize fetching timeseries data for all categories and chains
    const [categoriesWithTimeseries, chainsWithTimeseries] = await Promise.all([
      Promise.all(
        categories.map(async (category) => {
          const timeseries = await fetchTimeseries(category.categoryId);
          return { ...category, timeseries };
        })
      ),
      Promise.all(
        chains.map(async (chain) => {
          const timeseries = await fetchChainTimeseries(chain.chainId);
          return { ...chain, timeseries };
        })
      ),
    ]);

    // Return the combined data
    return res.status(200).json({
      categories: categoriesWithTimeseries,
      chains: chainsWithTimeseries,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
