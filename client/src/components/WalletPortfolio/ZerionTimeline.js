import React from 'react';
import HistoryIcon from './HistoryIcon';
import TransactionImage from './TransactionImage';
import HistoryCategory from './HistoryCategory';
import TokenLogo from './TokenLogo';
import moment from 'moment';
import { UncontrolledTooltip } from 'reactstrap';
import * as utilities from '../../utilities.js';

function ZerionTimeline({ transactions }) {
    
    transactions = transactions.filter(t => !t.possible_spam);
  // Group transactions by date_label
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const { date_label } = transaction;
    if (!acc[date_label]) {
      acc[date_label] = [];
    }
    acc[date_label].push(transaction);
    return acc;
  }, {});

  return (
    <>
    <ul className="timeline zerion">
      {Object.entries(groupedTransactions).map(([date, transactions]) => (
        <div key={date} className="timeline-date-group">
          <div className="date-heading">{date}</div>
          {transactions.map((item, index) => (
          

        <li key={index} className="history-item">
            <div className="history-left">
                <div className="history-icon">
                    <HistoryIcon category={item.category}/>
                    <img className="mini-chain" src={`/images/${item.chain}-icon.png`}/>
                </div>
                <div className="history-category">
                    <div className="category"><HistoryCategory category={item.category}/>
                    {
                        item.possible_spam && 
                        <>
                        <svg id={`tooltip-${item.hash}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f7a600" width="17"><path d="M16.619,3H7.381C7.024,3,6.694,3.191,6.515,3.5l-4.618,8c-0.179,0.309-0.179,0.691,0,1l4.618,8 C6.694,20.809,7.024,21,7.381,21h9.238c0.357,0,0.687-0.191,0.866-0.5l4.618-8c0.179-0.309,0.179-0.691,0-1l-4.618-8 C17.306,3.191,16.976,3,16.619,3z M12,17L12,17c-0.552,0-1-0.448-1-1v0c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v0 C13,16.552,12.552,17,12,17z M12,13L12,13c-0.552,0-1-0.448-1-1V8c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v4 C13,12.552,12.552,13,12,13z" fill="#f7a600"/></svg>
                        <UncontrolledTooltip target={`tooltip-${item.hash}`} placement="top">
                            Spam contract
                        </UncontrolledTooltip>
                        </>
                    }
                    </div>
                    <div className="timestamp">{moment(item.block_timestamp).format('HH:mm A')}</div>
                </div>
            </div>

            <div className="history-action">

                <div className="block-1 history-info">
                {
                    item.category === "token swap" ||
                    item.category === "deposit" ||
                    item.category === "send" ||
                    item.category === "receive" ||
                    item.category === "token receive" ||
                    item.category === "nft send" ||
                    item.category === "nft receive" ||
                    item.category === "token send" ||
                    item.category === "nft purchase" ||
                    item.category === "nft sale" ||
                    item.category === "mint" ||
                    item.category === "borrow" ||
                    item.category === "airdrop"
                    ?
                    <>
                        <div>
                            {item.erc20_transfers && item.erc20_transfers.filter(token => token.direction === "send").map(token => (
                                <div className="token-details send">
                                    <div><TokenLogo tokenImage={token.token_logo} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                    <div>-{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                </div>
                            ))}

                            {item.nft_transfers && item.nft_transfers.filter(item => item.direction === "send").length > 0 &&
                                        <div className="token-details send">
                                        <div><TransactionImage transaction={item} chain={item.chain} /></div>
                                        <div>
                                        {item.nft_transfers.filter(item => item.direction === "send").length > 1 ?
                                            <>-{item.nft_transfers.filter(item => item.direction === "send").length} NFTs</>
                                            :
                                            <>-1 {item.nft_transfers[0].normalized_metadata ? item.nft_transfers[0].normalized_metadata.name : `NFT #${item.nft_transfers[0].token_id}`}</>
                                        }
                                        </div>
                                    </div>
                                    }

                            {item.native_transfers && item.native_transfers.filter(token => token.direction === "send").map(token => (
                                <div className="token-details send">
                                    <div><img src={`${token.token_logo}`}/></div>
                                    <div>-{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                </div>
                            ))}
                        </div>

                            {item.erc20_transfers && item.erc20_transfers.filter(item => item.direction === "receive").length > 0 && item.erc20_transfers && item.erc20_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }

                            {item.erc20_transfers && item.erc20_transfers.filter(item => item.direction === "receive").length > 0 && item.native_transfers && item.native_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }

                            {item.nft_transfers && item.nft_transfers.filter(item => item.direction === "receive").length > 0 && item.nft_transfers && item.nft_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }

                            {item.nft_transfers && item.nft_transfers.filter(item => item.direction === "receive").length > 0 && item.native_transfers && item.native_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }

                            {item.native_transfers && item.native_transfers.filter(item => item.direction === "receive").length > 0 && item.native_transfers && item.native_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }

                            {item.native_transfers && item.native_transfers.filter(item => item.direction === "receive").length > 0 && item.erc20_transfers && item.erc20_transfers.filter(item => item.direction === "send").length > 0 &&
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
                            }
                    </>
                    :
                    <>
                        <div className="token-details">{item.summary} {item.method_label}</div>
                    </>
                }
                </div>

                <div className="block-2">
                {
                            item.category === "token swap" ||
                            item.category === "deposit" ||
                            item.category === "send" ||
                            item.category === "receive" ||
                            item.category === "nft send" ||
                            item.category === "token send" ||
                            item.category === "nft purchase" ||
                            item.category === "nft sale" ||
                            item.category === "mint" ||
                            item.category === "airdrop" ||
                            item.category === "token receive" ||
                            item.category === "borrow" ||
                            item.category === "nft receive"

                            ?
                            <>
                                
                               <div>
                                    {item.erc20_transfers && item.erc20_transfers.filter(token => token.direction === "receive").map(token => (
                                        <div className="token-details receive">
                                            <div><TokenLogo tokenImage={token.token_logo} tokenName={token.token_name} tokenSymbol={token.token_symbol}/></div>
                                            <div className="received">
                                                {token.value_formatted 
                                                ?
                                                    <>+{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</>
                                                :
                                                <>+1 {item.normalized_metadata ? item.normalized_metadata.name : `NFT #${item.token_id}`}</>
                                                }
                                                
                                            </div>
                                        </div>
                                    ))}
                                    {item.native_transfers && item.native_transfers.filter(token => token.direction === "receive").map(token => (
                                        <div className="token-details receive">
                                            <div><img src={`${token.token_logo}`}/></div>
                                            <div className="received">+{Number(token.value_formatted).toFixed(2)} {token.token_symbol}</div>
                                        </div>
                                    ))}

                                    {item.nft_transfers && item.nft_transfers.filter(item => item.direction === "receive").length > 0 &&
                                        <div className="token-details receive">
                                        <div><TransactionImage transaction={item} chain={item.chain} /></div>
                                        <div className="received">
                                        {item.nft_transfers.filter(item => item.direction === "receive").length > 1 ?
                                            <>Received +{item.nft_transfers.filter(item => item.direction === "receive").length} NFTs</>
                                            :
                                            <>+1 {item.nft_transfers[0].normalized_metadata ? item.nft_transfers[0].normalized_metadata.name : `NFT #${item.nft_transfers[0].token_id}`}</>
                                        }
                                        </div>
                                    </div>
                                    }

                                    
                               </div>
                            </>
                            :
                            <></>
                        }
                </div>
                
        
                </div>

                <div className="history-right">
                    
                        {
                            item.category === "send" ||
                            item.category === "deposit"
                            ? 
                            <>
                                <div className="heading">To</div>
                                <div><img 
                                    src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${item.to_address}`} 
                                    alt="profile"
                                    />
                                    {item.to_address_label ? item.to_address_label : utilities.shortAddress(item.to_address)}
                                </div>
                            </>
                            : item.category.indexOf("receive") > 1 
                            ? 
                            <>
                                <div className="heading">From</div>
                                <div>
                                <img 
                                    src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${item.to_address}`} 
                                    alt="profile"
                                    />
                                    {item.from_address_label ? item.from_address_label : utilities.shortAddress(item.from_address)}
                                </div>
                            </>
                            : 
                            <>
                                <div className="heading">Application</div>
                                <div>
                                <img 
                                    src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${item.to_address}`} 
                                    alt="profile"
                                    />
                                    {item.from_address_label ? item.from_address_label : item.from_address ? utilities.shortAddress(item.from_address) :utilities.shortAddress(item.from_address)}
                                </div>
                            </>
                        }

                </div>

            </li>
          ))}
        </div>
      ))}
    </ul>
    </>
  );
}

export default ZerionTimeline;