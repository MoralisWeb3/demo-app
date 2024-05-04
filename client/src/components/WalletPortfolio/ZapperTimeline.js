import React from 'react';
import TransactionImage from './TransactionImage';
import TokenLogo from './TokenLogo';
import moment from 'moment';
import { useData } from '../../DataContext';

function ZapperTimeline({ transactions }) {
    const { globalDataCache, setGlobalDataCache } = useData();

  return (
    <div className="zapper">
        <div className="top-section"><h3>Activity</h3></div>
        <ul className="timeline">
            
            {transactions.map(item => (
                <li className="zapper-tx">
                    <div className="top">
                        <div className="address-line">
                            <img 
                                src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${globalDataCache.profile.ens ? globalDataCache.profile.ens : globalDataCache.walletAddress}`} 
                                alt="profile"
                            />
                            <div>
                                <div className="address">{globalDataCache.profile.ens ? globalDataCache.profile.ens : globalDataCache.walletAddress}</div>
                                <div className="meta">
                                    <div className="timestamp">{moment(item.block_timestamp).fromNow()}</div>
                                    <div className="divider">•</div>
                                    <div><img className="mini-chain" src={`/images/${item.chain}-icon.png`}/></div>
                                </div>
                            </div>
                            
                        </div>

                        <div className="summary">
                            <a href={`${item.explorerUrl}/tx/${item.hash}`} target="_blank">
                            <span>{item.summary.split(" ")[0]}</span>
                                {" " + item.summary.split(" ").slice(1).join(" ")}
                            </a>
                        </div>

                        {item.possible_spam && (
                            <div class="spam-label">Spam</div>
                        )}
                    </div>

                    <div className="bottom">
                        <ul>

                            {item.erc20_transfers && item.erc20_transfers.filter(token => token.direction === "receive").map(token => (
                                <li className="token-details receive">
                                    <div><TokenLogo tokenImage={token.token_logo} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                    <div>+{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                    <div className="direction-label">IN</div>
                                </li>
                            ))}

                            {item.native_transfers && item.native_transfers.filter(token => token.action === "receive").map(token => (
                                <li className="token-details receive">
                                    <div><TokenLogo tokenImage={token.token_logo} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                    <div>+{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                    <div className="direction-label">IN</div>
                                </li>
                            ))}
                            <li className="break"></li>
                            {item.nft_transfers && item.nft_transfers.filter(token => token.direction === "receive").map(token => (
                                <li className="nft-details receive">
                                    {token.normalized_metadata && token.normalized_metadata.image && (
                                        <><img src={token.normalized_metadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}/></>
                                    )}
                                    
                                    {!token.normalized_metadata || !token.normalized_metadata.image && (
                                        <TransactionImage transaction={item} chain={item.chain} />  
                                    )}
                                    
                                    <div className="info-bar">
                                        <div>#{token.token_id}</div>
                                        <div className="direction-label">IN</div>
                                    </div>
                                </li>
                            ))}
                            <li className="break"></li>

                            

                            {item.erc20_transfers && item.erc20_transfers.filter(token => token.direction === "send").map(token => (
                                <li className="token-details send">
                                    <div><TokenLogo tokenImage={`https://d23exngyjlavgo.cloudfront.net/${item.chainId}_${token.address}`} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                    <div>-{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                    <div className="direction-label">OUT</div>
                                </li>
                            ))}

                            {item.native_transfers && item.native_transfers.filter(token => token.action === "send").map(token => (
                                <li className="token-details send">
                                    <div><TokenLogo tokenImage={token.token_logo} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                    <div>-{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                    <div className="direction-label">OUT</div>
                                </li>
                            ))}

                            <li className="break"></li>
                            
                            {item.nft_transfers && item.nft_transfers.filter(token => token.direction === "send").map(token => (
                                <li className="nft-details send">
                                    <TransactionImage transaction={item} chain={item.chain} />
                                    <div className="info-bar">
                                        <div>#{token.token_id}</div>
                                        <div className="direction-label">OUT</div>
                                    </div>
                                </li>
                            ))}

                            
                        </ul>
                    </div>

                </li>
            ))}
        
        </ul>
    </div>
  );
}

export default ZapperTimeline;