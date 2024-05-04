import express from 'express';
import fetch from 'node-fetch';
const API_KEY = process.env.API_KEY;
const baseURL = "https://deep-index.moralis.io/api/v2.2";
const router = express.Router();

router.post('/api/wallet/tokens/spam', async function(req,res,next) {
    try {
        let address = req.body.walletAddress;
        if(!address) {
            throw new Error('Missing wallet address.')
        }

        let ens;
        let isENSAddress = address.indexOf(".eth") > -1;

        if (isENSAddress) {
            const ens_response = await fetch(`${baseURL}/resolve/ens/${address}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': `${API_KEY}`
                }
            });
            if (!ens_response.ok) {
                throw new Error('Error fetching address via ENS');
            }

            let domain = await ens_response.json();
            address = domain.address;
            ens = req.body.walletAddress;
        }
 
        
        const chain = req.query.chain ? req.query.chain : 'eth';

        
        const response = await fetch(`${baseURL}/${address}/erc20?chain=${chain}`, {
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

        let totalTokens = 0;
        let spamTokens = 0;
        let nonSpamTokens = 0;
        let verifiedTokens = 0;
  
  
        for(const token of data) {
          totalTokens += 1;
          if(token.possible_spam) {
            spamTokens += 1;
          } else {
                nonSpamTokens += 1;
          }

          if(token.verified_contract) {
            verifiedTokens += 1;
          }
        }


        console.log(`Total ERC20s: ${totalTokens}`);
        console.log(`Spam ERC20s: ${spamTokens}`);
        console.log(`Non-spam ERC20s: ${nonSpamTokens}`);
        console.log(`Verified ERC20s: ${verifiedTokens}`);

        const tokenScore = Number(spamTokens/totalTokens*100);
        console.log(`Token Score: ${tokenScore}%`);


        let cursor = null;
        let page = 0;
        let totalNFTs = 0;
        let spamNFTs = 0;
        let nonSpamNFTs = 0;
        let verifiedNFTs = 0;
        let hasMorePages = false;
        do {
            const nfts_response = await fetch(`${baseURL}/${address}/nft/collections?chain=${chain}&cursor=${cursor}&limit=300`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': `${API_KEY}`
                }
            });
    
            if (!nfts_response.ok) {
                console.log(nfts_response.statusText)
                const message = await nfts_response.json();
                return res.status(500).json(message);
            }
    
            const nft_data = await nfts_response.json();
            
            if(nft_data.result && nft_data.result.length > 0) {
                for(const nft of nft_data.result) {
                    totalNFTs += 1;
                    if(nft.possible_spam) {
                        spamNFTs += 1;
                    } else {
                        nonSpamNFTs += 1;
                    }

                    if(nft.verified_collection) {
                        verifiedNFTs += 1;
                    }
                }
            }
            
            cursor = nft_data.cursor;

            page = nft_data.page;
            if(page > 3) {
                hasMorePages = true;
                break;
            }
        } while (cursor != "" && cursor != null);



        console.log(`Total NFTs: ${totalNFTs}`);
        console.log(`Spam NFTs: ${spamNFTs}`);
        console.log(`Non-spam NFTs: ${nonSpamNFTs}`);
        console.log(`Verified NFTs: ${verifiedNFTs}`);

        const nftScore = Number(spamNFTs/totalNFTs*100);
        console.log(`NFT Spamminess Score: ${nftScore}%`);


        let totalAssets = totalTokens+totalNFTs;
        let totalSpam = spamTokens+spamNFTs;
        let totalNonSpam = nonSpamTokens+nonSpamNFTs;
        let totalVerified = verifiedTokens+verifiedNFTs;

        const overallScore = Number(totalSpam/totalAssets*100)
        console.log(`Overall spam score is ${overallScore}%`)


        let tokenSpamChart = {
            labels: ["Not Spam", "Spam"],
            data: [nonSpamTokens, spamTokens]
        }

        let nftSpamChart = {
            labels: ["Not Spam", "Spam"],
            data: [nonSpamNFTs, spamNFTs]
        }
        

        return res.status(200).json({
            totalTokens, spamTokens, verifiedTokens, tokenScore, tokenSpamChart, nonSpamTokens,
            totalNFTs, spamNFTs, verifiedNFTs, nftScore, nftSpamChart, nonSpamNFTs,
            totalAssets, totalSpam, totalVerified, overallScore, hasMorePages
        });
    } catch(e) {
        next(e);
    }
});

export default router;