import express from 'express';
import fetch from 'node-fetch';
import moment from 'moment';
import { ethers } from 'ethers';
import * as utilities from './utilities.js';
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

const fetchHistory = async (address, chain, from_date, to_date) => {
    try {
        let foundChain = utilities.chains.find(item => item.chain === chain);
        let cursor = null;
        let all_txs = [];
        let url = `${baseURL}/wallets/${address}/history?chain=${chain}&nft_metadata=true&from_date=${from_date}&include_input_data=true`;
        if (to_date) {
            url += `&to_date=${to_date}`;
        }
        
        do {
            console.log(`About to fetch ${url}&cursor=${cursor}`)
            const response = await fetch(`${url}&cursor=${cursor}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': `${API_KEY}`
                }
            });

            if (!response.ok) {
                console.log(response)
                const message = await response.json();
                console.log(message)
                throw new Error(message.error || message);
            }

            let txs = await response.json();
            
            const now = moment();
            const today = now.clone().startOf('day');
            const yesterday = today.clone().subtract(1, 'days');
            const thisMonthStart = today.clone().startOf('month');
            const thisYearStart = today.clone().startOf('year');

            if (txs.result && txs.result.length > 0) {
                txs.result.forEach(function(tx) {
                    tx.chain = chain;
                    tx.chainId = foundChain.id;
                    tx.gas_price = ethers.formatEther(Number(tx.gas_price));
                    tx.gas_paid = tx.gas_price * Number(tx.receipt_gas_used);
                    tx.explorerUrl = chain === "eth" ? "https://etherscan.com" : "https://polygonscan.com";
                    tx.date_label = `${moment(tx.block_timestamp).format('Do MMMM')}, ${moment(tx.block_timestamp).format('YYYY')}`;
                    const txDate = moment(tx.block_timestamp);

                    // Determine the date_category
                    if (txDate.isSameOrAfter(today)) {
                        tx.date_category = "Today";
                    } else if (txDate.isSameOrAfter(yesterday) && txDate.isBefore(today)) {
                        tx.date_category = "Yesterday";
                    } else if (txDate.isSameOrAfter(thisMonthStart) && txDate.isBefore(today)) {
                        tx.date_category = "This Month";
                    } else if (txDate.isSameOrAfter(thisYearStart) && txDate.isBefore(thisMonthStart)) {
                        tx.date_category = "This Year";
                    } else {
                        tx.date_category = "Older";
                    }
                    all_txs.push(tx);
                });
            }
            
            cursor = txs.cursor;

        } while (cursor);
        console.log(`${chain} finished`);
        return all_txs;
    } catch (error) {
        console.error(`Error fetching history for ${address} on ${chain}:`, error.message || error);
        throw error;
    }
};


router.get('/api/wallet/history/new', async function(req,res,next) {
    try {
        const address = req.query.wallet;
        const to_date = req.query.lastDate;
        let txs = [];
        
        const days = ["7","14","30","60","90", "365"]
        let day = req.query.days ? req.query.days : "7";
        if (!days.includes(day)) {
            day = "7"
        }
        
        let from_date = moment().subtract(Number(day), 'days').format('YYYY-MM-DD');
        if(to_date) {
            from_date = moment(to_date).subtract(Number(day), 'days').format('YYYY-MM-DD');
        }

        Promise.all([
            fetchHistory(address, "eth", from_date, to_date),
            fetchHistory(address, "polygon", from_date, to_date),
            fetchHistory(address, "arbitrum", from_date, to_date),
            fetchHistory(address, "base", from_date, to_date),
            fetchHistory(address, "bsc", from_date, to_date),
            fetchHistory(address, "optimism", from_date, to_date)
        ]).then(responses => {
            
            txs = responses.flatMap(innerArray => innerArray);
            txs.sort((a, b) => b.block_timestamp.localeCompare(a.block_timestamp));
            return res.status(200).json({txs, lastDate:from_date});
        }).catch(error => {
            console.error('An error occurred:', error);
        });
        
    } catch(e) {
        next(e);
    }
});

const addresses = [
    "0x704c8c855765b4c053cc2dc02b3f318caf2ab732",
    "0x26fcbd3afebbe28d0a8684f790c48368d21665b5",
    "0xcb1c1fde09f811b294172696404e88e658659905",
    "0x020ca66c30bec2c4fe3861a94e4db4a498a35872",
    "0x2238c8b16c36628b8f1f36486675c1e2a30debf1",
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    "0x7d199ebce755adfdd1fd46daf6f8b348b7dd37c7",
    "0x7582d0b7a150f6227b447a0f282bff612f0f4b3e",
    "0xc7acb3bd30cb58d44bc49b4b48603a350bd8be36",
    "0xae357d83342113a77556db77d4ce9031693dfe33"
]

router.get('/api/multi-wallet/history', async function(req, res, next) {
    try {
        const startTime = new Date();
        const to_date = req.query.lastDate;
        let txs = [];
        
        const days = ["7", "14", "30", "60", "90", "365"];
        let day = req.query.days ? req.query.days : "7";
        if (!days.includes(day)) {
            day = "7";
        }
        
        let from_date = moment().subtract(Number(day), 'days').format('YYYY-MM-DD');
        if (to_date) {
            from_date = moment(to_date).subtract(Number(day), 'days').format('YYYY-MM-DD');
        }

        let promises = [];

        // Assuming addresses is an array of wallet addresses defined elsewhere
        addresses.forEach(function(address) {
            promises.push(fetchHistory(address, "eth", from_date, to_date));
        });

        const responses = await Promise.all(promises.map(p => p.catch(e => ({ error: e.message || e }))));
        
        responses.forEach(response => {
            if (response.error) {
                console.error('An error occurred:', response.error);
            } else {
                txs = txs.concat(response);
            }
        });

        txs.sort((a, b) => b.block_timestamp.localeCompare(a.block_timestamp));

        const endTime = new Date(); // End timer
        const timeTaken = endTime - startTime; // Calculate time taken in milliseconds

        console.log(`Time taken to fetch history: ${timeTaken}ms`);
        
        return res.status(200).json({ txs, lastDate: from_date });
    } catch (e) {
        next(e);
    }
});

export default router;