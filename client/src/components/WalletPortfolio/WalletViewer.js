import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Overview from './Overview';
import DeFiTokens from './DeFiPositions';
import NFTs from './NFTs';
import Historyv2 from './History';
import MarketData from '../MarketData/MarketData';
import NavBar from '../Misc/NavBar';
import WalletForm from './WalletForm';
import Loader from '../Misc/Loader';
import { DataProvider, useData } from '../../DataContext';
import { debounce } from 'lodash';
import '../../custom.scss';



function WalletViewer() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  let hasData = false;
  const navigate = useNavigate();

  // If address exists in the URL
  const { walletAddress } = useParams();
  
  useEffect(() => {
    const debouncedSubmit = debounce(() => {
      if (walletAddress && !globalDataCache.profile) {
        setLoading(true);
        console.log('WALLET CHANGED!');
        fetchWallet(walletAddress);
      }
    }, 300); // Adjust the delay as needed

    debouncedSubmit();
    
    // Cleanup the debounce function on component unmount or when tokenAddress changes
    return () => debouncedSubmit.cancel();
  }, [walletAddress]);


  const handleWalletSubmit = async (address) => {
    setLoading(true);
    fetchWallet(address);
    navigate(`/wallets/${address}`);
  };

  const fetchWallet = async (address) => {
    try {

      console.log("FETING WALLET!!")
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/wallet?chain=${globalDataCache.selectedChain ? globalDataCache.selectedChain : 'eth'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress:address }),
      });

      console.log("got reply")
      
      if (response.ok) {
        const data = await response.json();
        hasData = false;
        

        setGlobalDataCache(prevData => ({
            ...prevData,
            selectedChain: localStorage.getItem('selectedChain') || 'eth',
            walletAddress: data.address,
            balance:data.balance ? data.balance.balance : 0,
            chains: data.active_chains,
            nativeNetworth: data.nativeNetworth,
            networth: data.networth,
            networthArray: {
              labels: data.networthDataLabels,
              data:data.networthDatasets
            },
            profile: {
              walletAge: data.walletAge,
              firstSeenDate: data.firstSeenDate, 
              lastSeenDate: data.lastSeenDate,
              isWhale: data.isWhale, 
              earlyAdopter: data.earlyAdopter,
              multiChainer: data.multiChainer,
              speculator: data.speculator, 
              isFresh: data.isFresh,
              ens: data.ens,
              unstoppable: data.unstoppable
            },
            days: "7"
        }));

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
      {globalDataCache.walletAddress ? (
          <>
            <NavBar />
            <div className="container mx-auto">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/:walletAddress/defi" element={<DeFiTokens />} />
                <Route path="/:walletAddress/nfts" element={<NFTs />} />
                <Route path="/:walletAddress/history" element={<Historyv2 />} />
                <Route path="/market-data" element={<MarketData />} />
              </Routes>
            </div>
          </>
        ) : (
          <>
            <div 
              className="container text-center"
              style={{ padding: '100px 0' }}
            >
              <h1>🔍 <br/>View Wallet</h1>
              <div id="wallet-container">
                {loading ? (
                  <>
                  <Loader />
                  </>
                ) : (
                  <>
                  <p>Explore token balances, NFT holdings, activity and insights for any EVM wallet 🔥</p>
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

export default WalletViewer;
