import React, { useState, useEffect } from 'react';
import { useData } from '../../DataContext';
import Skeleton from '../misc/Skeleton';
import ChainDropDown from './ChainDropDown';
import TokenLogo from './TokenLogo';
import CopyToClipboard from './CopyToClipboard';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import * as utilities from '../../utilities.js';
import moment from 'moment';
import classnames from 'classnames';
import io from "socket.io-client";

const LivePortfolio = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [livePortfolio, setLivePortfolio] = useState(false);
  
  const fetchPortfolio = (chain) => {

    const socket = io("ws://6.tcp.ngrok.io:15596", {
        reconnectionDelayMax: 10000,
        reconnect: true
    });


    setLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData
    }));

    socket.on('error', (error) => {
        console.log(error);
    })


    socket.on("connect", () => {
        console.log("Registering events");

        socket.send({
          action: 'getNativeBalance',
          request: {
            address: globalDataCache.walletAddress,
            chain: '0x1'
          }
        })
      
        socket.send({
          action: 'getWalletNetWorth',
          request: {
            address: globalDataCache.walletAddress,
            chains: ['0x1']
          }
        })
      
        socket.send({
          action: 'getWalletTokenBalances',
          request: {
            address: globalDataCache.walletAddress,
            chain: '0x1'
          }
        })
      
        socket.send({
          action: 'getTokenPrice',
          request: {
            address: globalDataCache.walletAddress,
            chain: '0x1'
          }
        })
  
      });

    
    socket.on('message', (payload) => {
        console.log(payload);

        if(payload.action === "getNativeBalance") {
            setGlobalDataCache(prevData => ({
                ...prevData,
                liveNativeBalance: payload.response
            }));
        }

        if(payload.action === "getNativgetWalletNetwortheBalance") {
            setGlobalDataCache(prevData => ({
                ...prevData,
                liveNetworth: payload.response
            }));
        }

        if(payload.action === "getTokenBalances") {
            setGlobalDataCache(prevData => ({
                ...prevData,
                liveTokenBalances: payload.response
            }));
        }
        setLoading(false);
    });
    

  }


  useEffect(() => {

    fetchPortfolio();
  }, []);

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  useEffect(() => {
    localStorage.setItem('selectedChain', globalDataCache.selectedChain);
}, [globalDataCache.selectedChain]);


  return (
    <div id="live-portfolio">
      
        <div className="page-header">
            <h1>Live Portfolio</h1>
        </div>

        <h2>Networth: ${globalDataCache.liveNetworth}</h2>

        <h2>Native Balance: {globalDataCache.liveNativeBalance} ETH</h2>

        <div>
            <h2>Tokens</h2>
            <ul className="token-list">
                <li className="header-row">
                <div>Token</div>
                <div></div>
                <div>Price</div>
                <div>Balance</div>
                <div>Value</div>
                <div>24hr Change</div>
                <div>Portfolio Percentage</div>
                </li>
                {loading && <Skeleton />}
                {error && <div className="text-red-500">{error}</div>}      
                {/* Assuming globalDataCache.tokensData is an array */}
                {!loading && !error && globalDataCache.tokens && globalDataCache.tokens.length === 0 && (
                <p>No tokens</p>
                )}
                {globalDataCache.liveTokenBalances && globalDataCache.liveTokenBalances.filter(token => !token.possible_spam).map(token => (
                    <li key={token.token_address}>
                    <TokenLogo tokenImage={token.logo} tokenName={token.name}/>
                    <div>
                        <div className="token-name">{token.name}</div>
                        <div className="token-symbol">{token.symbol}</div>
                    </div>
                    <div className="token-price">{token.usd_price && `$${Number(token.usd_price).toFixed(2)}`}</div>
                    <div className="token-balance">{Number(token.balance_formatted).toFixed(3)}</div>
                    <div className="token-value"><div className="price">${Number(token.usd_value).toFixed(2)}</div></div>
                    <div className="token-value">
                    {token.usd_price && (
                            <>
                                <div className={token.usd_price_24hr_percent_change && token.usd_price_24hr_percent_change < 0 ? "negative" : "positive"}>
                                    {Number(token.usd_price_24hr_percent_change).toFixed(2)}% <span>(${Number(token.usd_price_24hr_usd_change).toFixed(2)})</span>
                                </div>
                            </>
                    )}
                    </div>
                    <div>{Number(token.portfolio_percentage).toFixed(2)}%</div>
                    
                    </li>
                ))}

            </ul>
        </div>
      
    </div>
  );
};

export default LivePortfolio;
