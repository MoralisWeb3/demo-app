import React, { useState, useEffect } from 'react';
import { useData } from '../../DataContext';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../Misc/Skeleton';
import TokenLogo from '../WalletPortfolio/TokenLogo';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';

const MarketData = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [moversLoading, setMoversLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('1');

  const toggle = tab => {
    if(activeTab !== tab) setActiveTab(tab);
  }

    const handleTokenClick = (token) => {
        navigate(`/tokens/${token.contract_address}`);
    };

  const fetchFirstTab = (chain) => {
    setMoversLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData,
      marketCap: null,
      tradingVolume:null,
      marketDataLoaded:false
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/market-data/movers`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        setGlobalDataCache(prevData => ({
          ...prevData,
          tokenMovers: fetchedData.top_movers,
        }));
        setMoversLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setMoversLoading(false);
      });
  }


  const fetchMarketData = (chain) => {
    setLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData,
      marketCap: null,
      tradingVolume:null,
      marketDataLoaded:false
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/market-data`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        setGlobalDataCache(prevData => ({
          ...prevData,
          marketCap: fetchedData.market_cap,
          tradingVolume: fetchedData.trading_volume,
          topTokens: fetchedData.top_tokens,
          nftMarketCap: fetchedData.nft_market_cap,
          nftVolume: fetchedData.nft_volume,
          marketDataLoaded:true
        }));
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }


  useEffect(() => {
    if (!globalDataCache.marketDataLoaded) {
      setLoading(true);
      setMoversLoading(true);
      fetchFirstTab()
      fetchMarketData();
    }
  }, []);

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  useEffect(() => {
    localStorage.setItem('selectedChain', globalDataCache.selectedChain);
}, [globalDataCache.selectedChain]);


  return (
    <div id="market-data" className="container">
      
      <div className="page-header">
        <h2>Market Data</h2>
      </div>

      <div>
        <Nav tabs>
            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '1' })}
                    onClick={() => { toggle('1'); }}
                >
                    ERC20 Winners & Losers
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '2' })}
                    onClick={() => { toggle('2'); }}
                >
                    ERC20s by Market Cap
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '3' })}
                    onClick={() => { toggle('3'); }}
                >
                    Cryptos by Market Cap
                </NavLink>
            </NavItem>
            
            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '4' })}
                    onClick={() => { toggle('4'); }}
                >
                    Cryptos by Trade Volume
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '5' })}
                    onClick={() => { toggle('5'); }}
                >
                    NFTs by Market Cap
                </NavLink>
            </NavItem>

            <NavItem>
                <NavLink
                    className={classnames({ active: activeTab === '6' })}
                    onClick={() => { toggle('6'); }}
                >
                    NFTs by Trade Volume
                </NavLink>
            </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>

        <TabPane tabId="1">
                
                <div className="row">
                    <div className="col-md-6">
                        <div className="wallet-card">
                        <h3>📈 Winners (24hrs)</h3>
                            <ul className="token-list market-data wider-col-1">
                            <li className="header-row">
                            <div>Token</div>
                            <div></div>
                            <div>Price</div>
                            <div>24h %</div>
                            <div>Market Cap</div>
                            </li>
                            {loading && <Skeleton />}
                            {error && <div className="text-red-500">{error}</div>}      
                            {/* Assuming globalDataCache.tokensData is an array */}
                            
                            {globalDataCache.tokenMovers && globalDataCache.tokenMovers.gainers.slice(0,20).map(token => (
                                <li key={token.token_symbol} onClick={() => handleTokenClick(token)}>
                                <TokenLogo tokenImage={token.token_logo} tokenName={token.token_name}/>
                                <div>
                                    <div className="token-name">{token.token_name}</div>
                                    <div className="token-symbol">{token.token_symbol}</div>
                                </div>
                                <div className="token-price">{token.price_usd && `${Number(Number(token.price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                                <div className={token.price_24h_percent_change < 0 ? "negative" : "positive"}>{Number(token.price_24h_percent_change).toFixed(2)}%</div>
                                <div className="">{Number(token.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                                
                                </li>
                            ))}

                        </ul>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="wallet-card">
                        <h3>📉 Losers (24hrs)</h3>
                            <ul className="token-list market-data wider-col-1">
                            <li className="header-row">
                            <div>Token</div>
                            <div></div>
                            <div>Price</div>
                            <div>24h %</div>
                            <div>Market Cap</div>
                            </li>
                            {loading && <Skeleton />}
                            {error && <div className="text-red-500">{error}</div>}      
                            {/* Assuming globalDataCache.tokensData is an array */}
                            
                            {globalDataCache.tokenMovers && globalDataCache.tokenMovers.losers.slice(0,20).map(token => (
                                <li key={token.token_symbol} onClick={() => handleTokenClick(token)}>
                                <TokenLogo tokenImage={token.token_logo} tokenName={token.token_name}/>
                                <div>
                                    <div className="token-name">{token.token_name}</div>
                                    <div className="token-symbol">{token.token_symbol}</div>
                                </div>
                                <div className="token-price">{token.price_usd && `${Number(Number(token.price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                                <div className={token.price_24h_percent_change < 0 ? "negative" : "positive"}>{Number(token.price_24h_percent_change).toFixed(2)}%</div>
                                <div className="">{Number(token.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                                
                                </li>
                            ))}

                        </ul>
                        </div>
                    </div>
                </div>
            </TabPane>

            <TabPane tabId="2">
                <h3>Top ERC20 Tokens by Market Cap</h3>
                <ul className="token-list market-data wider-col-1">
                    <li className="header-row">
                    <div>Token</div>
                    <div></div>
                    <div>Price</div>
                    <div>24h %</div>
                    <div>7d %</div>
                    <div>Market Cap</div>
                    </li>
                    {loading && <Skeleton />}
                    {error && <div className="text-red-500">{error}</div>}      
                    {/* Assuming globalDataCache.tokensData is an array */}
                    
                    {globalDataCache.topTokens && globalDataCache.topTokens.map(token => (
                        <li key={token.token_symbol}>
                        <TokenLogo tokenImage={token.token_logo} tokenName={token.token_name}/>
                        <div>
                            <div className="token-name">{token.token_name}</div>
                            <div className="token-symbol">{token.token_symbol}</div>
                        </div>
                        <div className="token-price">{token.price_usd && `${Number(Number(token.price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                        <div className={token.price_24h_percent_change < 0 ? "negative" : "positive"}>{Number(token.price_24h_percent_change).toFixed(2)}%</div>
                        <div className={token.price_7d_percent_change < 0 ? "negative" : "positive"}>{Number(token.price_7d_percent_change).toFixed(2)}%</div>
                        <div className="">{Number(token.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        
                        </li>
                    ))}

                </ul>
            </TabPane>


            <TabPane tabId="3">
            <h3>New 🔥: Top 100 Cryptocurrencies by Market Cap</h3>
            <ul className="token-list market-data">
                <li className="header-row">
                <div>Token</div>
                <div></div>
                <div>Price</div>
                <div>1h %</div>
                <div>24h %</div>
                <div>7d %</div>
                <div>30d %</div>
                <div>24h High</div>
                <div>24h Low</div>
                <div>All Time High</div>
                <div>Market Cap</div>
                </li>
                {loading && <Skeleton />}
                {error && <div className="text-red-500">{error}</div>}      
                {/* Assuming globalDataCache.tokensData is an array */}
                
                {globalDataCache.marketCap && globalDataCache.marketCap.map(token => (
                    <li key={token.symbol}>
                    <TokenLogo tokenImage={token.logo} tokenName={token.name}/>
                    <div>
                        <div className="token-name">{token.name}</div>
                        <div className="token-symbol">{token.symbol}</div>
                    </div>
                    <div className="token-price">{token.usd_price && `${Number(Number(token.usd_price).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                    <div className={token.usd_price_1hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_1hr_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_24hr_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_7d_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_7d_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_30d_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_30d_percent_change).toFixed(2)}%</div>
                    <div className="">{Number(token.usd_price_24hr_high).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                    <div className="">{Number(token.usd_price_24hr_low).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                    <div className="">
                        <div>{Number(token.usd_price_ath).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        <div className={token.ath_percent_change < 0 ? "negative" : "positive"}>{Number(token.ath_percent_change).toFixed(2)}%</div>
                    </div>
                    <div className="">
                        <div>{Number(token.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        <div className={token.market_cap_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.market_cap_24hr_percent_change).toFixed(2)}%</div>
                    </div>
                    
                    </li>
                ))}

            </ul>
            </TabPane>
            <TabPane tabId="4">
            <h3>New 🔥: Top 100 Cryptocurrencies by Trade Volume</h3>
            <ul className="token-list market-data">
                <li className="header-row">
                <div>Token</div>
                <div></div>
                <div>Price</div>
                <div>1h %</div>
                <div>24h %</div>
                <div>7d %</div>
                <div>30d %</div>
                <div>24h High</div>
                <div>24h Low</div>
                <div>All Time High</div>
                <div>Trade Volume</div>
                </li>
                {loading && <Skeleton />}
                {error && <div className="text-red-500">{error}</div>}      
                {/* Assuming globalDataCache.tokensData is an array */}
                
                {globalDataCache.tradingVolume && globalDataCache.tradingVolume.map(token => (
                    <li key={token.symbol}>
                    <TokenLogo tokenImage={token.logo} tokenName={token.name}/>
                    <div>
                        <div className="token-name">{token.name}</div>
                        <div className="token-symbol">{token.symbol}</div>
                    </div>
                    <div className="token-price">{token.usd_price && `${Number(Number(token.usd_price).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                    <div className={token.usd_price_1hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_1hr_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_24hr_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_7d_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_7d_percent_change).toFixed(2)}%</div>
                    <div className={token.usd_price_30d_percent_change < 0 ? "negative" : "positive"}>{Number(token.usd_price_30d_percent_change).toFixed(2)}%</div>
                    <div className="">{Number(token.usd_price_24hr_high).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                    <div className="">{Number(token.usd_price_24hr_low).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                    <div className="">
                        <div>{Number(token.usd_price_ath).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        <div className={token.ath_percent_change < 0 ? "negative" : "positive"}>{Number(token.ath_percent_change).toFixed(2)}%</div>
                    </div>
                    <div className="">{Number(token.total_volume).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                    
                    </li>
                ))}

            </ul>
            </TabPane>

            

            

            <TabPane tabId="5">
                <h3>Top NFT Collections by Market Cap</h3>
                <ul className="token-list market-data wider-col-1">
                    <li className="header-row">
                    <div>Collection</div>
                    <div></div>
                    <div>Floor Price</div>
                    <div>Floor Price USD</div>
                    <div>Floor Price 24h %</div>
                    <div>Market Cap</div>
                    <div>Market Cap 24h %</div>
                    </li>
                    {loading && <Skeleton />}
                    {error && <div className="text-red-500">{error}</div>}      
                    {/* Assuming globalDataCache.tokensData is an array */}
                    
                    {globalDataCache.nftMarketCap && globalDataCache.nftMarketCap.map(token => (
                        <li key={token.collection_image}>
                        <TokenLogo tokenImage={token.collection_image} tokenName={token.collection_title}/>
                        <div>
                            <div className="token-name">{token.collection_title}</div>
                        </div>
                        <div className="token-price">{token.floor_price} ETH</div>
                        <div className="token-price">{token.floor_price_usd && `${Number(Number(token.floor_price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                        <div className={token.floor_price_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.floor_price_24hr_percent_change).toFixed(2)}%</div>
                        <div className="">{Number(token.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        <div className={token.market_cap_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.market_cap_24hr_percent_change).toFixed(2)}%</div>
                        </li>
                    ))}

                </ul>
            </TabPane>

            <TabPane tabId="6">
                <h3>Top NFT Collections by Trade Volume</h3>
                <ul className="token-list market-data wider-col-1">
                    <li className="header-row">
                    <div>Collection</div>
                    <div></div>
                    <div>Floor</div>
                    <div>Floor USD</div>
                    <div>Floor 24h %</div>
                    <div>Floor 7d %</div>
                    <div>Floor 30d %</div>
                    <div>Trade Volume 24h</div>
                    <div>Trade Volume 24h %</div>
                    <div>Avg. Trade Price</div>
                    <div>Avg. Trade Price USD</div>
                    </li>
                    {loading && <Skeleton />}
                    {error && <div className="text-red-500">{error}</div>}      
                    {/* Assuming globalDataCache.tokensData is an array */}
                    
                    {globalDataCache.nftVolume && globalDataCache.nftVolume.map(token => (
                        <li key={token.collection_image}>
                        <TokenLogo tokenImage={token.collection_image} tokenName={token.collection_title}/>
                        <div>
                            <div className="token-name">{token.collection_title}</div>
                        </div>
                        <div className="token-price">{token.floor_price} ETH</div>
                        <div className="token-price">{token.floor_price_usd && `${Number(Number(token.floor_price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                        <div className={token.floor_price_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.floor_price_24hr_percent_change).toFixed(2)}%</div>
                        <div className={token.floor_price_7d_percent_change < 0 ? "negative" : "positive"}>{Number(token.floor_price_7d_percent_change).toFixed(2)}%</div>
                        <div className={token.floor_price_30d_percent_change < 0 ? "negative" : "positive"}>{Number(token.floor_price_30d_percent_change).toFixed(2)}%</div>
                        <div className="">{Number(token.volume_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                        <div className={token.volume_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(token.volume_24hr_percent_change).toFixed(2)}%</div>
                        <div className="">{Number(token.average_price).toFixed(2)} ETH</div>
                        <div className="token-price">{token.average_price_usd && `${Number(Number(token.average_price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                        </li>
                    ))}

                </ul>
            </TabPane>
        </TabContent>
        </div>

      
      
    </div>
  );
};

export default MarketData;
