import express from 'express';
import fetch from 'node-fetch';
import moment from 'moment';
import * as utilities from './utilities.js';
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();
const chains = ['eth', 'polygon', 'bsc', 'optimism', 'base', 'gnosis', 'fantom', 'avalanche', 'arbitrum', 'cronos'];
 

router.get('/api/market-data', async function(req,res,next) {
  try {
    const urls = [
      `${baseURL}/market-data/global/market-cap`,
      `${baseURL}/market-data/global/volume`,
      `${baseURL}/market-data/erc20s/top-tokens`,
      `${baseURL}/market-data/nfts/top-collections`,
      `${baseURL}/market-data/nfts/hottest-collections`
    ];

    const fetchPromises = urls.map(url =>
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      }).then(response => response.json())
    );

    const [
      market_cap,
      trading_volume,
      top_tokens,
      nft_market_cap,
      nft_volume
    ] = await Promise.all(fetchPromises);

    return res.status(200).json({
      market_cap,
      trading_volume,
      top_tokens,
      nft_market_cap,
      nft_volume
    });

  } catch(e) {
    next(e);
  }
});

router.get('/api/market-data/movers', async function(req,res,next) {
  try {
    const urls = [
    
      `${baseURL}/market-data/erc20s/top-movers`,
    ];

    const fetchPromises = urls.map(url =>
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      }).then(response => response.json())
    );

    const [
      top_movers,
    ] = await Promise.all(fetchPromises);

    return res.status(200).json({
      top_movers
    });

  } catch(e) {
    next(e);
  }
});

router.get('/api/market-data/top-erc20', async function(req,res,next) {
  try {
    const urls = [
    
      `${baseURL}/market-data/erc20s/top-tokens`,
    ];

    const fetchPromises = urls.map(url =>
      fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      }).then(response => response.json())
    );

    const [
      top_tokens,
    ] = await Promise.all(fetchPromises);

    return res.status(200).json({
      top_tokens
    });

  } catch(e) {
    next(e);
  }
});
  
router.post('/api/wallet', async function(req,res,next) {
    try {
      let address = req.body.walletAddress;
      let ens;
      let unstoppable;

      if(!address) {
        throw new Error('Missing wallet address.')
      }

    let promises = [];
    let isENSAddress = address.indexOf(".eth") > -1;

    if (isENSAddress) {
      promises.push(fetch(`${baseURL}/resolve/ens/${address}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      }));
    } else {
      promises.push(fetch(`${baseURL}/resolve/${address}/reverse`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY
        }
      }));
    }

    promises.push(fetch(`${baseURL}/resolve/${address}/domain`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      }
    }));

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
    const queryString = chains.map(chain => `chains=${chain}`).join('&');
    const walletChainsPromise = fetch(`${baseURL}/wallets/${address}/chains?${queryString}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    const balancePromise = fetch(`${baseURL}/${address}/balance?chain=${req.chain}`, {
      method: 'get',
      headers: {
        accept: 'application/json',
        'X-API-Key': API_KEY
      }
    });

    const [response, get_balance] = await Promise.all([walletChainsPromise, balancePromise]);

    if (!response.ok) {
      throw new Error(`Error fetching chains: ${response.statusText}`);
    }
    const active_chains = await response.json();
    const balance = await get_balance.json();

    const activeChains = active_chains.active_chains.map(chain => `chains=${chain.chain}`).join('&');
    const fetch_networth = await fetch(`${baseURL}/wallets/${address}/net-worth?${activeChains}&exclude_spam=true&exclude_unverified_contracts=true`,{
      method: 'get',
      headers: {accept: 'application/json', 'X-API-Key': `${API_KEY}`}
    });

    let networth = 0;
    if (!fetch_networth.ok) {
      console.log(`Error fetching net-worth: ${fetch_networth.statusText}`);
    }

    networth = await fetch_networth.json();

    let networthDataLabels = [];
    let networthDatasets = [];

    if(networth.chains && networth.chains.length > 0) {
      networth.chains.forEach(function(item) {
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
      if(balance.balance > 100000000000000000000) isWhale = true;
  
      let wallet_chains = [];
      let earlyAdopterDate = new Date("2016-01-01");

  
      for(const chain of active_chains.active_chains) {
          if(chain.first_transaction) {
              wallet_chains.push(chain);
  
              if(chain.first_transaction) {
                  if(new Date(chain.first_transaction.block_timestamp) < earlyAdopterDate)
                  earlyAdopter = true;
              }
          }
      }
      const one_day_ago = moment().subtract(1, 'days');
      let firstSeenDate = utilities.findEarliestAndLatestTimestamps(active_chains.active_chains).earliest;
      let lastSeenDate = utilities.findEarliestAndLatestTimestamps(active_chains.active_chains).latest;
  
      
  
      wallet_chains.forEach(item => {
        item.label = utilities.getChainName(item.chain);
        if (new Date(item.first_transaction.block_timestamp) < new Date(firstSeenDate.block_timestamp)) {
          firstSeenDate = item.first_transaction.block_timestamp
        }
        if (new Date(item.last_transaction.block_timestamp) > new Date(lastSeenDate.block_timestamp)) {
          lastSeenDate = item.last_transaction.block_timestamp
        }
      });
  
      let walletAge = utilities.calcAge(firstSeenDate);

      if(new Date(firstSeenDate) > new Date(one_day_ago)) isFresh = true;
  
  
      if(wallet_chains.length > 1) multiChainer = true;
      
      return res.status(200).json({address,networth:networth.total_networth_usd,networthDataLabels,
        networthDatasets,
        active_chains:wallet_chains, walletAge, firstSeenDate, lastSeenDate, ens,unstoppable,
        isWhale, earlyAdopter,multiChainer,speculator,balance:balance.balance, moment, isFresh
      });
    } catch(e) {
      next(e);
    }
  });
  
  router.get('/api/wallet/profile', async function(req, res, next) {
  try {
    const address = req.query.wallet;
    const chain = req.chain ? req.chain : 'eth';

    const statsPromise = fetch(`${baseURL}/wallets/${address}/stats?chain=${chain}`, {
      method: 'get',
      headers: { accept: 'application/json', 'X-API-Key': API_KEY }
    });

    const tokensPromise = fetch(`${baseURL}/wallets/${address}/tokens?exclude_spam=true&exclude_unverified_contracts=true&chain=${chain}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    // Initialize chart data for the last 90 days
    let chart_data = [];
    // Start from today
    let currentDate = new Date();

    for (let i = 0; i < 90; i++) {
        let formattedDate = currentDate.toISOString().split('T')[0];
        chart_data.push({ x: formattedDate, y: 0 });

        // Subtract a day for the next iteration
        currentDate.setDate(currentDate.getDate() - 1);
    }

    const days = moment().subtract(90, 'days').format('YYYY-MM-DD');
    let cursor = null;
    let all_txs = [];

    // Fetch transactions within the last 90 days
    do {

      const response = await fetch(`${baseURL}/${address}?${cursor ? `cursor=${cursor}&`:''}`+ new URLSearchParams({
          from_date: days,
          chain:chain
      }),{
        method: 'get',
        headers: {accept: 'application/json', 'X-API-Key': `${API_KEY}`}
      });

      const txs = await response.json();
      cursor = txs.cursor;
      
      if(txs.result) {
          for(let item of txs.result) {
              all_txs.push(item)
          }
      }

  } while (cursor !== "" && cursor !== null);

    // Process transaction data for chart
    if(all_txs.length > 0) {
      all_txs.forEach(function(data) {
          let blockDate = data.block_timestamp.split('T')[0];
          // Find the corresponding date in the chartArray
          let chartItem = chart_data.find(item => item.x === blockDate);

          if (chartItem) {
            chartItem.y += 1;
          }
      })
  }

  let chartArray = utilities.generateWeekArray(9);

  utilities.updateChartArrayByWeek(chartArray, all_txs);
  chartArray = chartArray.reverse()

    // Resolve promises for wallet stats, tokens, and net worth
    const [statsResponse, tokensResponse] = await Promise.all([statsPromise, tokensPromise]);
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
      collector
    });

  } catch (e) {
    next(e);
  }
});


export default router;