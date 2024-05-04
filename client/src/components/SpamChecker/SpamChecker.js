import React, { useEffect, useState } from 'react';
import WalletForm from '../WalletPortfolio/WalletForm';
import Loader from '../Misc/Loader';
import SpamChart from './SpamChart';
import { useData } from '../../DataContext';
import '../../custom.scss';

function SpamChecker() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [spamResults, setSpamResults] = useState(null);  // Using state to track spam results

  const handleWalletSubmit = async (address) => {
    setLoading(true);
    fetchWallet(address);
  };

  const clearWallet = () => {
    setSpamResults(null)
  }

  const fetchWallet = async (address) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet/tokens/spam?chain=${globalDataCache.selectedChain ? globalDataCache.selectedChain : 'eth'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress:address }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSpamResults(data)
      } else {
        setError(`Please provide a valid address.`);
      }
    } catch (error) {
      console.error('There was an error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (

    <>
      {spamResults ? (
          <>
            <div className="container" id="spam">
                <div className="text-center">
                  <h5>
                  {spamResults.overallScore > 50
                     ? <>WTF, so much spam! 💀💀💀💀</>
                     : 
                     spamResults.overallScore > 30
                     ? <>This is a crazy amount of spam 💀💀💀</>
                     : 
                     spamResults.overallScore > 20
                     ? <>Damn, this is a lot of spam 💀💀</>
                     : 
                     spamResults.overallScore > 10
                     ? <>Ugh, I hate spam 💀</>
                     : 
                     spamResults.overallScore < 10 && spamResults.overallScore > 5
                     ? <>Not too bad - we've seen worse!</>
                     : <>Wow, no spam 🤩</>
                    }
                  </h5>
                  <h1>{Number(spamResults.overallScore).toFixed(2)}%</h1>
                  <p>
                    This wallet contains {Number(spamResults.overallScore).toFixed(2)}% spam 
                    
                  </p>
                </div>

                <div className="row">
                  <div className="col-lg-6">
                    <div className="wallet-card text-center">
                      <h4>Tokens</h4>
                      <p><b>{Number(spamResults.tokenScore).toFixed(2)}% of tokens are spam</b></p>
                      
                      <SpamChart chartArray={spamResults.tokenSpamChart} />

                      <p>In total we analyzed {spamResults.totalTokens} ERC20 Tokens.</p>

                      <ul>
                        <li>{spamResults.spamTokens} were spam ⚠️</li>
                        <li>{spamResults.verifiedTokens} were verified <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20"><polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"/><polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"/></svg></li>
                        <li>{spamResults.totalTokens-spamResults.spamTokens-spamResults.verifiedTokens} were neither spam, nor verified 🤷‍♂️</li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="wallet-card text-center">
                      <h4>NFTs</h4>
                      <p><b>{Number(spamResults.nftScore).toFixed(2)}% of NFT collections are spam</b></p>
                      <SpamChart chartArray={spamResults.nftSpamChart} />
                      <p>{spamResults.hasMorePages 
                        ?
                          <>In total we analyzed the first {spamResults.totalNFTs} NFT Collections in this wallet.</>
                        :
                          <>In total we analyzed {spamResults.totalNFTs} NFT Collections.</>
                      }</p>

                      <ul>
                        <li>{spamResults.spamNFTs} were spam ⚠️</li>
                        <li>{spamResults.verifiedNFTs} were verified <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20"><polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"/><polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"/></svg></li>
                        <li>{spamResults.totalNFTs-spamResults.spamNFTs-spamResults.verifiedNFTs} were neither spam, nor verified 🤷‍♂️</li>
                      </ul>
                    </div>
                    
                  </div>

                    <button className="btn btn-sm btn-primary" onClick={clearWallet}>
                      Check Another
                    </button>
                </div>
                
            </div>
          </>
        ) : (
          <>
            <div 
              className="container text-center"
              style={{ padding: '100px 0' }}
            >
              <h1>🧐 <br/>Spam Analyzer</h1>
              <div id="wallet-container">
                {loading ? (
                  <>
                  <Loader />
                  </>
                ) : (
                  <>
                  <p>Add a wallet to see how spammy it is based on its NFT and Token holdings ⚠️</p>
                  <WalletForm onSubmit={handleWalletSubmit} loading={loading} placeholder={"Enter EVM address or ENS domain"} buttonText={"Check wallet"} />
                  {error && <div className="text-red-500 mt-2">{error}</div>}
                  </>
                )}
              </div>    
            </div>
            
          </>
        )}
        

    </>
  );
}

export default SpamChecker;
