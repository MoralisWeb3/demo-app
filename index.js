// index.js
import express from "express";
import cors from "cors";
import apiIndex from "./api/index.js";
import tokenApi from "./api/tokens.js";
import pairApi from "./api/pairs.js";
import nftApi from "./api/nfts.js";
import historyApi from "./api/history.js";
import defiApi from "./api/defi.js";
import pnlApi from "./api/pnl.js";
import approvalsApi from "./api/approvals.js";
import spamApi from "./api/spamCheck.js";
import entitiesApi from "./api/entities.js";
import volumeApi from "./api/volume.js";
import path from "path";
const __dirname = path.resolve();
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const app = express();
app.use(express.json());
app.use(cors());

import http from "http";
const server = http.createServer(app);

app.use(express.static(path.resolve(__dirname, "./client/build")));
app.use(validateChain);
app.use(limiter);

app.use("/", apiIndex);
app.use("/", tokenApi);
app.use("/", pairApi);
app.use("/", nftApi);
app.use("/", historyApi);
app.use("/", defiApi);
app.use("/", pnlApi);
app.use("/", approvalsApi);
app.use("/", spamApi);
app.use("/", entitiesApi);
app.use("/", volumeApi);

const chains = [
  "eth",
  "polygon",
  "bsc",
  "base",
  "gnosis",
  "optimism",
  "fantom",
  "avalanche",
  "arbitrum",
  "cronos",
  "palm",
];
function validateChain(req, res, next) {
  const requestedChain = req.query.chain;

  // Check if req.query.chain exists
  if (requestedChain) {
    // Check if the requested chain is in the supported list
    if (chains.includes(requestedChain)) {
      // If supported, set req.chain to req.query.chain
      req.chain = requestedChain;
    } else {
      // If not supported, default to req.chain = "eth"
      req.chain = "eth";
    }
  } else {
    // If req.query.chain does not exist, default to req.chain = "eth"
    req.chain = "eth";
  }

  // Continue to the next middleware or route handler
  next();
}

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
