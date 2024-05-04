import React, { useEffect, useState } from 'react';
import { useData } from '../../DataContext';
import Skeleton from '../Misc/Skeleton';
import TxChart from './TxChart';
import NetworthChart from './NetworthChart';
import TokenLogo from './TokenLogo';
import WalletInteractions from './WalletInteractions';
import ChainDropDown from '../Misc/ChainDropDown';
import ExternalLinkIcon from '../Misc/ExternalLinkIcon';
import ArrowIcon from '../Misc/ArrowIcon';
import moment from 'moment';
import { UncontrolledTooltip } from 'reactstrap';
import { Link } from 'react-router-dom';
import * as utilities from '../../utilities.js';
import CopyToClipboard from '../Misc/CopyToClipboard';

const Overview = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(!globalDataCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    // setLoading(!globalDataCache);
  }, [globalDataCache]);

  const handleDropdownChange = (selectedValue) => {
    setGlobalDataCache(prevData => ({
      ...prevData,
      nftsLoaded:false,
      tokensLoaded:false,
      defiLoaded:false,
      selectedChain:selectedValue
    }));
    fetchProfile(selectedValue);
  };

  useEffect(() => {
    if (globalDataCache.walletAddress && !globalDataCache.stats) {
      setLoading(true)
      fetchProfile(globalDataCache.selectedChain || localStorage.getItem('selectedChain') || 'eth');
    }
  }, []);

  const fetchProfile = (chain) => {
    
    setLoading(true);
  fetch(`${process.env.REACT_APP_API_URL}/api/wallet/profile?wallet=${globalDataCache.walletAddress}&chain=${chain}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          setGlobalDataCache(prevData => ({
            ...prevData,
            chartArray:data.chartArray,
            stats:data.stats,
            profile: {
              ...prevData.profile,
              collector:data.collector
            },
            interactions:data.addressOccurrences,
            tokenCount:data.tokens.length,
            token_balances: data.tokens
          }));
          setLoading(false);
        })
        .catch((error) => {
          setError(error);
          setLoading(false);
        });
  }

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);
  useEffect(() => {
    localStorage.setItem('selectedChain', globalDataCache.selectedChain);
}, [globalDataCache.selectedChain]);
  return (
    <div>
      <div className="container overview">

      <div className="page-header">
        <h2>Wallet Summary
          <div className="domains">
            <div>
                <Link to={`https://etherscan.io/address/${globalDataCache.walletAddress}`} target="_blank">
                  <img className="etherscan" src="/images/etherscan.svg" alt="etherscan" />{utilities.shortAddress(globalDataCache.walletAddress)} <ExternalLinkIcon width={16}/>
                </Link>
            </div>
            
              {globalDataCache.profile.ens && (
                <div id="ens-domain">
                  <UncontrolledTooltip target={`ens-domain`} placement="top">ENS Domain</UncontrolledTooltip>
                  <img src="/images/ens-logo.avif" alt="ens" />{globalDataCache.profile.ens}
                  </div>
              )}
            
            
            {globalDataCache.profile.unstoppable && (
              <div id="ud-domain">
                  <UncontrolledTooltip target={`ud-domain`} placement="top">Unstoppable Domain</UncontrolledTooltip>
                  <img src="/images/ud-logo.svg" alt="unstoppable" />{globalDataCache.profile.unstoppable}
                </div>
              )}
            
          </div>

        </h2>
        <ChainDropDown 
          onChange={handleDropdownChange} 
          chains={globalDataCache.chains}
          selectedChain={globalDataCache.selectedChain}
        />
      </div>

        <div className="wallet-card top">
          <div className="title">Wallet Profile</div>

          <div className="row">
              <div className="col-lg-9">

                <div className="row">

                  <div className="col-lg-4">
                    <div className="profile-intro">
                        <div>
                          <img 
                            src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${globalDataCache.walletAddress}`} 
                            alt="profile"
                          />
                        </div>

                        <div>
                          <div className="heading">Address</div>
                          <div className="big-value networth copy-container">
                            {utilities.shortAddress(globalDataCache.walletAddress)} 
                            <CopyToClipboard valueToCopy={globalDataCache.walletAddress}>
                              <button></button>
                            </CopyToClipboard>
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="col-lg-4">
                      <div className="heading">Active chains</div>
                      <ul className="big-value">
                        {globalDataCache.chains.map(item => (
                        <li className="chain" key={item.chain}>
                            <img 
                              src={`/images/${item.chain}-icon.png`} 
                              id={`tooltip-${item.chain}`} // this ID is required for the tooltip
                              alt={item.label}
                            />
                            <UncontrolledTooltip target={`tooltip-${item.chain}`} placement="top">
                              {item.label}
                            </UncontrolledTooltip>
                          </li>
                        ))}
                      </ul>
                    </div>

                  <div className="col networth">
                    <div className="heading">Cross-chain Networth</div>
                    <div className="big-value">
                    ${globalDataCache.networth ? utilities.formatPriceNumber(Number(globalDataCache.networth).toFixed(0)) : "0"}
                    </div>
                  </div>

                </div>

                <div className="row">

                  <div className="col-lg-4">
                    <div className="heading">First seen
                      {globalDataCache?.profile?.isFresh && <span className="fresh">FRESH</span>}
                    </div>
                    <div className="big-value">{moment(globalDataCache.profile.firstSeenDate).fromNow()}</div>
                  </div>

                  <div className="col-lg-4">
                    <div className="heading">Last seen</div>
                    <div className="big-value">{moment(globalDataCache.profile.lastSeenDate).fromNow()}</div>
                  </div>

                </div>
               


              </div>


              <div className="col-lg-2">
                <NetworthChart chartArray={globalDataCache.networthArray} />
              </div>

          </div>
           
        </div>
      </div>

      {loading && <Skeleton /> }

      <div className="container">
        <div className="row">
          {!loading && globalDataCache.chartArray && (

              <div className="col-lg-8">
                <div className="wallet-card">
                  <div className="title">Wallet Activity</div>
                  <div className="card-info">Weekly transactions over the last 90 days</div>
                  <TxChart chartArray={globalDataCache.chartArray} />
                </div>

                <div className="wallet-card interactions">
                  <div className="title">Wallet Interactions</div>
                  <div className="card-info">Wallet interactions based on the last 90 days</div>
                  <WalletInteractions />
                </div>

              </div>

             
            

           


          )}

          {!loading && globalDataCache.stats && (

              <div className="col-lg-4">
                

                <div className="wallet-card">
                  <div className="title">Tokens ({globalDataCache?.token_balances.length})</div>
                  

                  {(globalDataCache.token_balances && globalDataCache.token_balances.length > 0) && (
                    <>
                    <ul className="token-list">

                        <li>
                          <div className="heading">Token</div>
                          <div></div>
                          <div className="heading">Balance</div>
                          <div className="heading">Value</div>
                        </li>
                          {globalDataCache.token_balances && globalDataCache.token_balances.filter(token => !token.possible_spam).slice(0,3).map(token => (
                            <li key={token.token_address}>
                              <TokenLogo tokenImage={token.logo} tokenName={token.name}/>
                              <div>
                                <div className="token-name">{token.symbol}</div>
                              </div>
                              <div className="token-balance">{Number(token.balance_formatted).toFixed(2)}</div>
                              <div className="token-balance">${Number(token.usd_value).toFixed(2)}</div>

                              
                            </li>
                          ))}
                        </ul>
                        <div className="naked-link">
                          <Link to="/tokens">View all <ArrowIcon width={16} /></Link>
                        </div>
                    </>
                  )}
                  
                  {(!globalDataCache.token_balances || globalDataCache.token_balances.length === 0) && (
                    <p>No tokens found on this chain.</p>
                  )}
                
                </div>

                <div className="wallet-card">
                  <div className="title">NFTs</div>
                  <div className="row nft-summary">
                    <div className="col-lg-6">
                      <div className="heading">Collections</div>
							        <div className="big-value">{globalDataCache.stats.collections}</div>
                    </div>

                    <div className="col-lg-6">
                      <div className="heading">NFTs</div>
							        <div className="big-value">{globalDataCache.stats.nfts}</div>
                    </div>
                  </div>

                  <div className="naked-link">
                    <Link to="/nfts">View all <ArrowIcon width={16} /></Link>
                  </div>
                </div>

                <div className="wallet-card">
                  <div className="title">Wallet Totals</div>
                  <div className="card-info">All-time totals for this wallet</div>

                  <div className="row">
                    <div className="col-lg-4">
                      <div className="big-value">{globalDataCache?.stats?.transactions?.total}</div>
                      <div className="heading">Transactions</div>
                    </div>

                    <div className="col-lg-4">
                      <div className="big-value">{globalDataCache?.stats?.token_transfers?.total}</div>
                      <div className="heading">Token Transfers</div>
                    </div>

                    <div className="col-lg-4">
                      <div className="big-value">{globalDataCache?.stats?.nft_transfers?.total}</div>
                      <div className="heading">NFT Transfers</div>
                    </div>
                  </div>
                </div>

                <div className="wallet-card">
                  <div className="title">Badges</div>

                  <div class="badges">
                    <UncontrolledTooltip target={`badge-whale`} placement="top">Holds more than 100 ETH</UncontrolledTooltip>
                      <div id="badge-whale" className={globalDataCache.profile.isWhale ? `badge-card active` : `badge-card`}>
                        <div class="icon">🐳</div>
                        <div class="text">Whale</div>
                      </div>
                    
                      <UncontrolledTooltip target={`badge-early`} placement="top">Pre-2017 Wallet</UncontrolledTooltip>
                    <div id="badge-early" className={globalDataCache.profile.earlyAdopter ? `badge-card active` : `badge-card`}>
                      <div class="icon">🚀</div>
                      <div class="text">Early Adopter</div>
                    </div>
                  

                    <UncontrolledTooltip target={`badge-chains`} placement="top">Active on multiple chains</UncontrolledTooltip>
                    <div id="badge-chains" className={globalDataCache.profile.multiChainer ? `badge-card active` : `badge-card`}>
                      <div class="icon">🔗</div>
                      <div class="text">Multi-Chainer</div>
                    </div>
                  

                    <UncontrolledTooltip target={`badge-tokens`} placement="top">Holds more than 20 tokens</UncontrolledTooltip>
                    <div id="badge-tokens" className={globalDataCache.profile.speculator ? `badge-card active` : `badge-card`}>
                      <div class="icon">💰</div>
                      <div class="text">Token Speculator</div>
                    </div>
                  

                    <UncontrolledTooltip target={`badge-nfts`} placement="top">Holds more than 20 NFTs</UncontrolledTooltip>
                    <div id="badge-nfts" className={globalDataCache.profile.collector ? `badge-card active` : `badge-card`}>
                      <div class="icon">🐧</div>
                      <div class="text">NFT Collector</div>
                    </div>
                

                    <UncontrolledTooltip target={`badge-age`} placement="top">Wallet Age</UncontrolledTooltip>
                    <div id="badge-age" class="badge-card">
                      <div class="icon">🎂</div>
                      <div class="text">Club</div>
                    </div>
                

              
                </div>
                </div>

              </div>

          )}


        </div>
      </div>

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
};

export default Overview;
