// index.js
import express from 'express';
import cors from 'cors';
import apiIndex from './api/index.js';
import tokenApi from './api/tokens.js';
import nftApi from './api/nfts.js';
import historyApi from './api/history.js';
import spamApi from './api/spamCheck.js';
import path from 'path';
const __dirname = path.resolve();
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	limit: 100, 
	standardHeaders: 'draft-7',
	legacyHeaders: false
});


const app = express();
app.use(express.json());
app.use(cors());

import http from 'http';
const server = http.createServer(app);

app.use(express.static(path.resolve(__dirname, './client/build')));
app.use(validateChain);
app.use(limiter)

app.use('/', apiIndex);
app.use('/', tokenApi);
app.use('/', nftApi);
app.use('/', historyApi);
app.use('/', spamApi);
const chains = ['eth', 'polygon', 'bsc', 'base', 'gnosis', 'optimism', 'fantom', 'avalanche', 'arbitrum', 'cronos', 'palm'];
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
      req.chain = 'eth';
    }
  } else {
    // If req.query.chain does not exist, default to req.chain = "eth"
    req.chain = 'eth';
  }

  // Continue to the next middleware or route handler
  next();
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// if (process.env.NODE_ENV === 'production') {
//   app.get('/*', async function(req,res,next) {
//     try {
//       return res.redirect('/');
//     } catch(e) {
//       next(e);
//     }
//   });
// }

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});