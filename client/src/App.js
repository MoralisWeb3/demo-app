import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation} from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import WalletViewer from './components/WalletPortfolio/WalletViewer';
import WalletTokens from './components/WalletPortfolio/WalletTokens';
import WalletPnl from './components/WalletPortfolio/WalletPnl';
import TokenViewer from './components/TokenDashboard/TokenViewer';
import TokenDashboard from './components/TokenDashboard/TokenDashboard';
import NFTs from './components/WalletPortfolio/NFTs';
import DeFiTokens from './components/WalletPortfolio/DeFiPositions';
import DeFiPosition from './components/WalletPortfolio/DeFiPositionDetail';
import History from './components/WalletPortfolio/History';
import NFTMarketplace from './components/NFTMarketplace/NFTMarketplace';
import NFTCollection from './components/NFTMarketplace/NFTCollection';
import MarketData from './components/MarketData/MarketData';
import SpamChecker from './components/SpamChecker/SpamChecker';
import { DataProvider, useData } from './DataContext';
import './custom.scss';

const Navigation = () => {
  const location = useLocation();
  const { globalDataCache, setGlobalDataCache } = useData();
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/`);
    setGlobalDataCache(prevData => ({
      ...prevData,
      balance: null,
      chains: null,
      chartArray: null,
      days: null,
      interactions:null,
      nativeNetworth: null,
      networth: null,
      networthArray: null,
      profile: null,
      selectedChain: "eth",
      stats: null,
      tokenCount: null,
      token_balances: null,
      walletAddress: null,
      token:null,
      initialTokenLoaded: false
    }));
  };

  const fetchTopMarketCap = () => {
    
    setGlobalDataCache(prevData => ({
      ...prevData,
      topTokensLoaded:false
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/market-data/top-erc20`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        setGlobalDataCache(prevData => ({
          ...prevData,
          topTokensLoaded:true,
          marketCap: fetchedData.top_tokens,
        }));
      })
      .catch(error => {
        console.log(error);
      });
  }

  useEffect(() => {
    if (!globalDataCache.topTokensLoaded) {
      fetchTopMarketCap()
    }
  }, []);

  if (location.pathname === '/') {
    return (
      
      <div id="home" className="container">

        <div className="wallet-card intro text-center">
          <div><img src="/images/icon.png" alt="moralis" width="50"/></div>
          <div>
            <h1>Moralis Demo Project</h1>
              <p>Welcome to this Moralis Demo project! This is an open source project to demo the power of <a href="https://moralis.io?ref=demo-app" target="_blank">Moralis APIs</a>.</p>
              <p>Note: this app contains many early stage, beta or experimental features. As a result bugs are highly likely.</p>
              <p>Check-out the code over at Github: <a href="https://github.com/MoralisWeb3/demo-app/tree/main" target="_blank">https://github.com/MoralisWeb3/demo-app</a></p>
          </div>
          
        </div>


        <div className="row">
          <h3>Demos</h3>
          <div className="col-lg-4 equal">
            <Link className="demo-link" to="/wallets/">
              <div className="wallet-card">
                <div className="card-img" style={{ backgroundImage: "url('/images/portfolio.png')" }}></div>
                <div className="demo-title">Wallet Portfolio</div>
                <p>A demo wallet portfolio app showcasing wallet profile details, net-worth, tokens, NFTs, DeFi positions and more.</p>
              </div>
            </Link>
          </div>

          <div className="col-lg-4 equal">
            <Link className="demo-link" to="/tokens/">
              <div className="wallet-card">
                <div className="card-img" style={{ backgroundImage: "url('/images/token.png')" }}></div>
                <div className="demo-title">Token Analytics</div>
                <p>An example Token Dashboard page displaying detailed token insights, pricing data and ownership information.</p>
              </div>
            </Link>
          </div>

          <div className="col-lg-4 equal">
            <Link className="demo-link" to="/marketplace/">
              <div className="wallet-card">
                <div className="card-img" style={{ backgroundImage: "url('/images/marketplace.png')" }}></div>  
                <div className="demo-title">NFT Marketplace</div>
                <p>RareMint, a demo NFT Marketplace, showcasing NFT market data as well as detailed NFT collection and token data.</p>
              </div>
            </Link>
          </div>

          <div className="col-lg-4 equal">
            <Link className="demo-link" to="/market-data">
              <div className="wallet-card">
                <div className="card-img" style={{ backgroundImage: "url('/images/market-data.png')" }}></div>  
                <div className="demo-title">Trending Tokens & NFTs</div>
                <p>Summary market data insights across global cryptocurrencies, trending ERC20 tokens, popular NFT collections and more.</p>
              </div>
            </Link>
          </div>

          

          

          <div className="col-lg-4 equal">
            <Link className="demo-link" to="/spam-checker">
              <div className="wallet-card">
                <div className="card-img" style={{ backgroundImage: "url('/images/spam-checker.png')" }}></div>  
                <div className="demo-title">Spam Analyzer</div>
                <p>This tool analyzes a wallet's NFTs and ERC20 tokens to determine how spammy the wallet is.</p>
              </div>
            </Link>
          </div>
        </div>

      </div>

    
 
    );
  } else {
    return (
      <div id="back-home" onClick={() => handleClick()}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" fill="#edf2f4"><path d="M 10 4.9296875 L 2.9296875 12 L 10 19.070312 L 11.5 17.570312 L 6.9296875 13 L 21 13 L 21 11 L 6.9296875 11 L 11.5 6.4296875 L 10 4.9296875 z" fill="#edf2f4"/></svg> Demo Home</div>
    );
  }
};

function Root() {
  return (
    <DataProvider>
      <App />
    </DataProvider>
  );
}

function App() {

  return (
      
    <Router>
      <div>


          <Navigation />

          
        <Routes>
          <Route path="/wallets" element={<WalletViewer />} />
          <Route path="/wallets/:walletAddress" element={<WalletViewer />} />
          <Route path="/wallets/:walletAddress/tokens" element={<WalletTokens />} />
          <Route path="/wallets/:walletAddress/pnl" element={<WalletPnl />} />
          <Route path="/wallets/:walletAddress/defi" element={<DeFiTokens />} />
          <Route path="/wallets/:walletAddress/nfts" element={<NFTs />} />
          <Route path="/wallets/:walletAddress/history" element={<History />} />
          <Route path="/wallets/:walletAddress/defi/:protocol" element={<DeFiPosition />} />

          <Route path="/tokens/" element={<TokenViewer />} />
          <Route path="/tokens/:tokenAddress" element={<TokenDashboard />} />

          <Route path="/marketplace" element={<NFTMarketplace />} />
          <Route path="/nfts/:collection" element={<NFTCollection />} />

          <Route path="/market-data" element={<MarketData />} />

          <Route path="/spam-checker" element={<SpamChecker />} />
        </Routes>
      </div>

      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <a href="https://moralis.io?ref=demo-app" target="_blank">
          <img 
            src="/images/Powered-by-Moralis-Badge-Text-Grey.svg"
            alt="Powered by Moralis"
            width="200"
          />
        </a>
      </div>
    </Router>

  );
}

export default Root;
