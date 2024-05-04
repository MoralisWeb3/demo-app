import express from 'express';
import fetch from 'node-fetch';
import * as utilities from './utilities.js';
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();


router.post('/api/token', async function(req,res,next) {
    try {
        let tokenAddress = req.body.address;

        const get_metadata = await fetch(`${baseURL}/erc20/metadata?addresses=${tokenAddress}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': `${API_KEY}`
            }
        });
        
        if (!get_metadata.ok) {
        console.log(get_metadata.statusText)
            const message = await get_metadata.json();
            throw new Error(message);
        }

        let tokenMetadata = await get_metadata.json();

        // const ownersPromise = fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/owners`, {
        //         method: 'GET',
        //         headers: {
        //             'Accept': 'application/json',
        //             'X-API-Key': API_KEY
        //         }
        //     });

        const pricePromise = fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/price?include=percent_change`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const blockPromise = fetch(`https://deep-index.moralis.io/api/v2.2/block/${tokenMetadata[0].block_number}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const [priceResponse, blockResponse] = await Promise.all([pricePromise, blockPromise]);

      

        if (!blockResponse.ok) {
            const message = await blockResponse.json();
            console.log(blockResponse.statusText);
            return res.status(500).json(message);
        }


        // const tokenOwners = await ownersResponse.json();
        const tokenPrice = await priceResponse.json();
        const blockCreated = await blockResponse.json();

        // const totalPercentageHeld = tokenOwners.result.slice(0, 10).reduce((acc, curr) => {
        //     return acc + (curr.percentage_relative_to_total_supply || 0); // Add || 0 to handle any undefined or null values gracefully
        // }, 0);

        if(tokenMetadata[0].total_supply_formatted) {
            if(tokenPrice.usdPrice) {
                tokenMetadata[0].fdv = Number(tokenMetadata[0].total_supply_formatted)*Number(tokenPrice.usdPrice);
                tokenMetadata[0].fdv = Number(tokenMetadata[0].fdv).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }

            tokenMetadata[0].total_supply_formatted = Number(tokenMetadata[0].total_supply_formatted).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }

        if(!tokenPrice.usdPrice) {
            tokenPrice.usdPrice = 0;
            tokenPrice.usdPriceFormatted = "0";
            tokenPrice["24hrPercentChange"] = "0";
        }

        return res.status(200).json({
            tokenAddress,
            tokenMetadata:tokenMetadata[0],
            // tokenOwners:tokenOwners.result,
            // topTenPercentageHeld: totalPercentageHeld,
            tokenPrice,
            blockCreated
        });

    } catch(e) {
        next(e);
    }
});

router.get('/api/token/:tokenAddress', async function(req,res,next) {
    try {
        let tokenAddress = req.params.tokenAddress;

        const ownersPromise = fetch(`${baseURL}/erc20/${tokenAddress}/owners?limit=50`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const transfersPromise = fetch(`${baseURL}/erc20/${tokenAddress}/transfers?limit=50`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const [ownersResponse, transfersResponse] = await Promise.all([ownersPromise, transfersPromise]);

        if (!ownersResponse.ok) {
            console.log(ownersResponse)
            const message = await ownersResponse.json();
            return res.status(500).json(message);
        }

        if (!transfersResponse.ok) {
            console.log(transfersResponse)
            const message = await transfersResponse.json();
            return res.status(500).json(message);
        }

        const tokenOwners = await ownersResponse.json();
        const tokenTransfers = await transfersResponse.json();
        
        let topTenHolders = [];
        if(tokenOwners && tokenOwners.result && tokenOwners.result.length > 0) {
            topTenHolders = tokenOwners.result.slice(0, 10);
        }

        let totalBalance = topTenHolders.reduce((acc, holder) => acc + Number(holder.balance_formatted), 0);
        let totalUsd = topTenHolders.reduce((acc, holder) => acc + Number(holder.usd_value), 0);
        let totalPercentage = topTenHolders.reduce((acc, holder) => acc + holder.percentage_relative_to_total_supply, 0);


        const results = await Promise.all(topTenHolders.map(owner => fetchDataForOwner(owner)));

        let tokenOccurrences = results.reduce((acc, holder) => {
        holder.balanceData.forEach(token => {
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
        .filter(item => item.count >= 3)
        .map(item => {
        // Extracting necessary token details
        return item;
        });

        return res.status(200).json({
            tokenTransfers: tokenTransfers.result,
            tokenOwners: tokenOwners.result,
            topTokenOwners: results,
            totalBalance,totalUsd,totalPercentage, commonTokens
        });

    } catch(e) {
        next(e);
    }
});

router.get('/api/token/:tokenAddress/prices', async function(req, res, next) {
    try {
        const tokenAddress = req.params.tokenAddress;
        const chain = req.query.chain || 'eth';

        // Initial setup to get the latest block (kept simple for readability)
        const latestBlockResponse = await fetch(`${baseURL}/latestBlockNumber/0x1`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-API-Key': API_KEY }
        });

        if (!latestBlockResponse.ok) {
            console.log(responseBalance.statusText)
            throw new Error('Unable to fetch latest block');
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
        const blockPromises = dates.map(dateString => 
            fetch(`${baseURL}/dateToBlock?chain=${chain}&date=${dateString}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'X-API-Key': API_KEY }
            }).then(res => res.json())
        );
        const blocks = await Promise.all(blockPromises);

        // Now fetch prices for each block in parallel
        const pricePromises = blocks.map(block => 
            fetch(`${baseURL}/erc20/${tokenAddress}/price?chain=${chain}&to_block=${block.block}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'X-API-Key': API_KEY }
            }).then(res => res.json())
        );
        const prices = await Promise.all(pricePromises);

        // Combine blocks and prices into price_blocks array
        const price_blocks = blocks.map((block, i) => ({
            x: dates[i],
            y: prices[i]?.usdPriceFormatted, // Assuming prices array returns an object with a usdPrice property
            block: block.block
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

        console.log(`First price ${firstPrice}`)
        console.log(`Last price ${lastPrice}`)
        console.log(`Direction ${direction}`)
        console.log(`Percentage change ${percentageChange}`)
        console.log(`USD change ${usdChange}`)
        

        return res.status(200).json({ 
            tokenPrices: price_blocks,
            tokenPriceStats: {
                percentageChange, usdChange, direction
            }
        });
    } catch(e) {
        next(e);
    }
});

async function fetchDataForOwner(owner) {
    let balanceData = [];
    let networthData = 0;

    if(owner.owner_address.indexOf("0x00000000000000000000000000000") > -1) {
        return { owner, balanceData, networthData };
    }

    try {
        const balanceResponse = await fetch(`${baseURL}/wallets/${owner.owner_address}/tokens?exclude_spam=true&exclude_unverified_contracts=true&limit=11`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        console.log(`${owner} DONE`)
        // Process balanceResponse only if OK, otherwise keep balanceData as []
        if (balanceResponse.ok) {
            let balances = await balanceResponse.json();
            balanceData = balances.result.filter(item => item.token_address !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
        } else {
            console.log(`Failed to fetch balances for owner: ${owner.owner_address}`);
            console.log(balanceResponse.statusText)
            const message = await response.json();
            balanceData = [];
        }
    } catch (error) {
        console.error(`Error fetching balances for owner: ${owner.owner_address}`, error);
    }

    try {
        const networthResponse = await fetch(`${baseURL}/wallets/${owner.owner_address}/net-worth?exclude_spam=true&exclude_unverified_contracts=true`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        // Process networthResponse only if OK, otherwise keep networthData as 0
        if (networthResponse.ok) {
            networthData = await networthResponse.json();
        } else {
            console.log(`Failed to fetch networth for owner: ${owner.owner_address}`);
            console.log(networthResponse.statusText)
            networthData = "0";
        }
    } catch (error) {
        console.error(`Error fetching networth for owner: ${owner.owner_address}`, error);
    }

    return { owner, balanceData, networthData };
}

router.get('/api/wallet/tokens', async function(req,res,next) {
    try {
      const address = req.query.wallet;
      const chain = req.query.chain && req.query.chain !== "undefined" ? req.query.chain : 'eth';
      const response = await fetch(`${baseURL}/wallets/${address}/tokens?chain=${chain}&exclude_spam=true&exclude_unverified_contracts=true`, {
          method: 'GET',
          headers: {
              'Accept': 'application/json',
              'X-API-Key': `${API_KEY}`
          }
      });
      
      if (!response.ok) {
        console.log(response.statusText)
        const message = await response.json();
        if(message && message.message === "Cannot fetch token balances as wallet contains over 2000 tokens. Please contact support for further assistance.")
        return res.status(200).json({verified_tokens:[],unsupported:true});
      }
      const data = await response.json();

      let verified_tokens = [];
      let spam_tokens = [];

      const foundChain = utilities.chains.find(item => item.chain === chain);
      for(const token of data.result) {
        verified_tokens.push(token)
      }

    return res.status(200).json({
        verified_tokens,
        spam_tokens
    });

    } catch(e) {
      next(e);
    }
});

router.get('/api/wallet/defi', async function(req,res,next) {
    try {
    
    const address = req.query.wallet;
    const chain = req.query.chain ? req.query.chain : 'eth';

    // Define both fetch requests as promises
    const protocolsPromise = fetch(`${baseURL}/wallets/${address}/defi/summary?chain=${chain}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-API-Key': API_KEY
        }
    });

    const positionsPromise = fetch(`${baseURL}/wallets/${address}/defi/positions?chain=${chain}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-API-Key': API_KEY
        }
    });

    // Use Promise.all to wait for all promises to resolve
    const [protocolsResponse, positionsResponse] = await Promise.all([protocolsPromise, positionsPromise]);

    // Check if protocolsResponse is ok
    if (!protocolsResponse.ok) {
        const message = await protocolsResponse.json();
        return res.status(500).json(message);
    }

    // Check if positionsResponse is ok
    if (!positionsResponse.ok) {
        const message = await positionsResponse.json();
        return res.status(500).json(message);
    }

    const protocolSummary = await protocolsResponse.json();
    const defiPositions = await positionsResponse.json();


    let uniswapRewards = 0;
    let uniswapValue = 0;
    let totalUsdValue = 0; // Ensure this is defined if you're using it

    if (protocolSummary && protocolSummary.protocols && protocolSummary.protocols.length > 0) {
        for (const protocol of protocolSummary.protocols) {
            if (protocol.protocol_name === "uniswap-v3") {
                uniswapRewards = protocol.unclaimed_total_value_usd;
                uniswapValue = protocol.total_value_usd;
                totalUsdValue += protocol.total_value_usd;
            }
        }
    }

    // Respond with the combined data
    return res.status(200).json({
        protocols: protocolSummary,
        uniswapRewards,
        uniswapValue,
        defiPositions
    });

    } catch(e) {
      next(e);
    }
});

router.get('/api/wallet/defi/positions/:protocolId', async function(req,res,next) {
    try {
    
    const address = req.query.wallet;
    const chain = req.query.chain ? req.query.chain : 'eth';
    const protocolId = req.params.protocolId;


    const get_positions = await fetch(`${baseURL}/wallets/${address}/defi/${protocolId}/positions?chain=${chain}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-API-Key': `${API_KEY}`
        }
    });
    
    if (!get_positions.ok) {
        console.log(get_positions.statusText)
        const message = await get_positions.json();
        throw new Error(message);
    }

    let defiPosition = await get_positions.json();


    // Respond with the combined data
    return res.status(200).json({
        positionDetail:defiPosition
    });

    } catch(e) {
      next(e);
    }
});

router.get('/api/wallet/pnl', async function(req,res,next) {
    try {
      const address = req.query.wallet;
      const chain = req.query.chain ? req.query.chain : 'eth';

      let betaURL = process.env.PNL_BETA_URL;

      const response = await fetch(`${betaURL}/wallets/${address}/profitability?chain=${chain}&days=all`, {
          method: 'GET',
          headers: {
              'Accept': 'application/json',
              'X-API-Key': `${API_KEY}`
          }
      });
    
      if (!response.ok) {
        console.log(response.statusText)
        const message = await response.json();
        throw new Error(message);
    }

    let profitability = await response.json();
      

    return res.status(200).json(profitability);

    } catch(e) {
      next(e);
    }
});

export default router;