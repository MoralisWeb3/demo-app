import express from 'express';
import fetch from 'node-fetch';
import moment from 'moment';
import { ethers } from 'ethers';
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();
const chains = [{
    chain:"eth",
    id:"0x1"
}, {
    chain: "polygon",
    id: "0x89"
}, {
    chain: "bsc",
    id: "0x38"
}, {
    chain: "fantom",
    id: "0xfa"
}, {
    chain: "avalanche",
    id: "0xa86a"
}, {
    chain: "arbitrum",
    id: "0xa4b1"
}, {
    chain: "cronos",
    id: "0x19"
}, {
    chain: "palm",
    id: "0x2a15c308d"
}, {
    chain: "base",
    id: "0x2105"
}, {
    chain: "gnosis",
    id: "0x64"
}, {
    chain: "optimism",
    id: "0xa"
}];

const fetchHistory = async (address, chain, from_date, to_date) => {
    let foundChain = chains.find(item => item.chain === chain);
    let cursor = null;
    let page = 0;
    let all_txs = [];
    let url = `${baseURL}/wallets/${address}/history?chain=${chain}&nft_metadata=true&from_date=${from_date}&include_input_data=true`;
    if(to_date) {
        url = `${baseURL}/wallets/${address}/history?chain=${chain}&nft_metadata=true&from_date=${from_date}&to_date=${to_date}&include_input_data=true`;
    }
    console.log(`${baseURL}/wallets/${address}/history?chain=${chain}&nft_metadata=true&from_date=${from_date}&to_date=${to_date}&include_input_data=true`)
    do {
        const response = await fetch(`${url}&cursor=${cursor}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': `${API_KEY}`
            }
        });

        if (!response.ok) {
            console.log(response.statusText)
            const message = await response.json();
            console.log(message)
            throw new Error(message);
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
                tx.gas_price = ethers.formatEther(Number(tx.gas_price))
                tx.gas_paid = tx.gas_price*Number(tx.receipt_gas_used);
                // tx.gas = {
                //     price: ethers.formatEther(Number(tx.gas_price)),
                //     used: ethers.formatEther(Number(tx.receipt_gas_used)),
                //     paid: ethers.formatEther(Number(tx.gas_price)*Number(tx.receipt_gas_used))
                // }
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
            })
        }
        
        cursor = txs.cursor;
        console.log(`Page ${txs.page}, chain ${chain} cursor is ${txs.cursor}`)

        page = txs.page;

    } while (cursor != "" && cursor != null && cursor != undefined);
    console.log(`${chain} finished`);
    return all_txs;
};

router.get('/api/wallet/history/new', async function(req,res,next) {
    try {
        const address = req.query.wallet;
        const chain = req.query.chain ? req.query.chain : 'eth';
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

        console.log(`From: ${from_date}, to: ${to_date}`)

        // const check_chains = await fetch(`${baseURL}/wallets/${address}/chains?chains=eth&chains=polygon&chains=base&chains=optimism&chains=bsc&chains=fantom&chains=avalanche&chains=arbitrum&chains=cronos&chains=palm`,{
        //     method: 'get',
        //     headers: {accept: 'application/json', 'X-API-Key': `${API_KEY}`}
        // });
        // const active_chains = await check_chains.json();
        // let wallet_chains = active_chains.active_chains;

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

export default router;