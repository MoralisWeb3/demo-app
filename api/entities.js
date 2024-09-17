import express from "express";
import fetch from "node-fetch";
import moment from "moment";
import { ethers } from "ethers";
import * as utilities from "./utilities.js";
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.get("/api/entities", async function (req, res, next) {
  try {
    const query = req.query.query;
    if (!query) {
      return res
        .status(400)
        .json({ message: "Please provide a search query." });
    }

    const response = await fetch(`${baseURL}/entities/search?query=${query}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": `${API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(response);
      const message = await response.json();
      console.log(message);
      throw new Error(message.error || message);
    }

    let results = await response.json();

    return res.status(200).json(results);
  } catch (e) {
    next(e);
  }
});

router.get("/api/entities/categories", async function (req, res, next) {
  try {
    const response = await fetch(`${baseURL}/entities/categories`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": `${API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(response);
      const message = await response.json();
      console.log(message);
      throw new Error(message.error || message);
    }

    let results = await response.json();

    return res.status(200).json(results.result);
  } catch (e) {
    next(e);
  }
});

router.get("/api/entities/categories/:id", async function (req, res, next) {
  try {
    const categoryId = req.params.id;
    if (!categoryId) {
      return res.status(400).json({ message: "Please provide a category ID." });
    }

    const response = await fetch(
      `${baseURL}/entities/categories/${categoryId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-API-Key": `${API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      const message = await response.json();
      console.log(message);
      throw new Error(message.error || message);
    }

    let results = await response.json();

    return res.status(200).json(results.result);
  } catch (e) {
    next(e);
  }
});

router.get("/api/entities/:id", async function (req, res, next) {
  try {
    const entityId = req.params.id;
    if (!entityId) {
      return res.status(400).json({ message: "Please provide an entity ID." });
    }

    const response = await fetch(`${baseURL}/entities/${entityId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": `${API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(response);
      const message = await response.json();
      console.log(message);
      throw new Error(message.error || message);
    }

    let results = await response.json();

    return res.status(200).json(results);
  } catch (e) {
    next(e);
  }
});

export default router;
