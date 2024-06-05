import React, { useState, useEffect } from 'react';
import { useData } from '../../DataContext';
import NavBar from '../Misc/NavBar';
import Loader from '../Misc/Loader';
import ChainDropDown from '../Misc/ChainDropDown';
import TokenLogo from './TokenLogo';
import ExternalLinkIcon from '../Misc/ExternalLinkIcon';
import * as utilities from '../../utilities.js';
import { Link, useNavigate } from 'react-router-dom';

const DeFiTokens = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleProtocolClick = (protocol) => {
    setGlobalDataCache(prevData => ({
      ...prevData,
      defiPosition: {
        protocol
      } 
    }));
    navigate(`/wallets/${globalDataCache.walletAddress}/defi/${protocol.protocol_id}`);
  };

  const fetchDeFi = (chain) => {
    setLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData,
      defi: null,
      defiLoaded:false
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/wallet/defi?chain=${chain}&wallet=${globalDataCache.walletAddress}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        // Update globalDataCache with fetchedData
        
        setGlobalDataCache(prevData => ({
          ...prevData,
          defi: fetchedData,
          defiLoaded:true
        }));
        setLoading(false);
        if(fetchedData.unsupported) {
          setError("Unsupported wallet.")
        }
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }

  const handleDropdownChange = (selectedValue) => {
    setGlobalDataCache(prevData => ({
      ...prevData,
      nftsLoaded:false,
      tokensLoaded:false,
      defiLoaded:false,
      selectedChain:selectedValue
    }));
    fetchDeFi(selectedValue);
  };

  useEffect(() => {
    if (!globalDataCache.defiLoaded) {
      setLoading(true);
      fetchDeFi(globalDataCache.selectedChain);
    }
  }, []);

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  useEffect(() => {
    localStorage.setItem('selectedChain', globalDataCache.selectedChain);
}, [globalDataCache.selectedChain]);


  return (
    <>
      <NavBar />

      <div id="defi-page">
      
        <div className="page-header">
          <h2>DeFi Positions</h2>
          <ChainDropDown 
            onChange={handleDropdownChange} 
            chains={globalDataCache.chains}
            selectedChain={globalDataCache.selectedChain}
          />
        </div>

        
          {loading && <Loader />}
          {error && <div className="text-red-500">{error}</div>}      
          {/* Assuming globalDataCache.tokensData is an array */}


          
          {globalDataCache.defi && (
          <>
              <h3 className="sub-header">Wallet Summary</h3>
              <div className="summary-section">
                  <div className="row">
                      <div className="col-lg-3">
                          <div className="wallet-card">
                              <div className="heading">Total Value</div>
                              <div className="big-value">${globalDataCache.defi.protocols.total_usd_value ? utilities.formatPriceNumber(globalDataCache.defi.protocols.total_usd_value) : 0}</div>
                          </div>
                      </div>

                      <div className="col-lg-3">
                          <div className="wallet-card">
                              <div className="heading">Active Protocols</div>
                              <div className="big-value">{globalDataCache.defi.protocols.active_protocols}</div>
                          </div>
                      </div>

                      <div className="col-lg-3">
                          <div className="wallet-card">
                              <div className="heading">Current Positions</div>
                              <div className="big-value">{globalDataCache.defi.protocols.total_positions}</div>
                          </div>
                      </div>

                      <div className="col-lg-3">
                          <div className="wallet-card">
                              <div className="heading">Unclaimed Rewards</div>
                              <div className="big-value">${utilities.formatPriceNumber(globalDataCache.defi.protocols.total_unclaimed_usd_value)}</div>
                          </div>
                      </div>


                  </div>
              </div>


              <h3 className="sub-header">Protocol Breakdown</h3>
              <ul className="summary-protocols">

                {globalDataCache.defi.protocols.protocols.map(protocol => (
                  <li>
                    <img src={protocol.protocol_logo} alt={protocol.protocol_name} />
                    <div>
                      <div className="protocol-title">{protocol.protocol_name}</div>
                      <div className="protocol-value">{protocol.total_usd_value ? `$${utilities.formatPriceNumber(protocol.total_usd_value)}` : null}</div>
                      <div className="position-count">{protocol.positions} positions</div>
                    </div>
                  </li>
                ))}
              </ul>

              {!loading && !error && globalDataCache.defi && globalDataCache.defi.totalDeFiPositions === 0 && (
              <h5>No DeFi positions found. More protocols will be supported soon.</h5>
              )}


<h3 className="sub-header">Wallet Positions</h3>

              {globalDataCache.defi.defiPositions && globalDataCache.defi.defiPositions.length > 0 && (
                <div className="summary-positions">
                  {globalDataCache.defi.protocols.protocols.map(protocol => (
                    <>
                      <div className="wallet-card" key={protocol.name_name} onClick={() => handleProtocolClick(protocol)}>
                          <div className="protocol-details">
                              <img src={protocol.protocol_logo} alt={protocol.protocol_name} />
                              <div className="protocol-title">
                                {protocol.protocol_name} {protocol.total_usd_value ? `- $${utilities.formatPriceNumber(protocol.total_usd_value)}` : null}

                                {protocol.total_unclaimed_usd_value && (
                                  <spam className="rewards-available">+${utilities.formatPriceNumber(protocol.total_unclaimed_usd_value)} Unclaimed Rewards</spam>
                                )}
                                <div className="position-count">{protocol.positions} positions</div>
                              </div>
                              
                                <Link to={protocol.protocol_url} target="_blank">
                                  <button className="btn btn-outline icon btn-sm">Manage Positions <ExternalLinkIcon width="15" /></button>
                                </Link>
                          </div>


                          <ul className="defi-list">
                            <div className="position-detail">
                            <li className="header-row">
                              <div>Token</div>
                              <div></div>
                              <div>Token Balances</div>
                              <div>Position Type</div>
                              <div>Position Value</div>
                            </li>
                            

                            {
                              globalDataCache.defi.defiPositions.filter(position => position.protocol_id === protocol.protocol_id)
                                .map((position, index) => (
                                  <li key={index}>
                                    <>
                                      <div>
                                        {position.position.tokens.map(position_token => (
                                              (position_token.token_type !== "reward" || !position_token.token_type) && (
                                                <>
                                                  <TokenLogo tokenImage={position_token.logo} tokenName={position_token.name}/>
                                                </>
                                                

                                                
                                            
                                          )
                                        ))}
                                      </div>
                                      <div>
                                      {
                                        position.position.tokens.map(position_token => (
                                          (position_token.token_type !== "reward" || !position_token.token_type) && (

                                            <div>
                                              {position_token.symbol} ({position_token.token_type})
                                            </div>
                                          )
                                        ))
                                      }
                                      </div>

                                      <div className="token-balance">
                                        {position.position.tokens.map(position_token => (
                                              (position_token.token_type !== "reward" || !position_token.token_type) && (

                                          <div>{Number(position_token.balance_formatted).toFixed(4)} {position_token.usd_value > 0 ? `($${Number(position_token.usd_value).toFixed(2)})` : ''}</div>
                                          )
                                        ))}
                                      </div>

                                      

                                    </>
                                    

                                    

                                    <div>
                                      {position.position.label}
                                    </div>
                                    <div className="value">
                                    ${utilities.formatPriceNumber(Number(position.position.balance_usd))}
                                    </div>

                                      {position.position.total_unclaimed_usd_value && (
                                        <div className="rewards-available">Claim Rewards</div>
                                      )}
                                    
                                  </li>
                                ))
                            }
                          </div>
                        </ul>
                      </div>
                    </>
                  ))}
                </div>
              )}

          </>
          )}

        
        
      </div>
    </>
  );
};

export default DeFiTokens;
