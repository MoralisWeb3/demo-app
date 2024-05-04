import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import NavBar from '../Misc/NavBar';
import { useData } from '../../DataContext';
import TokenLogo from '../WalletPortfolio/TokenLogo';
import ExternalLinkIcon from '../Misc/ExternalLinkIcon';
import Skeleton from '../Misc/Skeleton';
import SkeletonCard from '../Misc/SkeletonCard';
import * as utilities from '../../utilities.js';
import CollectionCategory from './CollectionCategory';

function NFTMarketplace() {

    const { globalDataCache, setGlobalDataCache } = useData();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    let { id } = useParams(); // Access the protocolId from URL
    let navigate = useNavigate();

    const goBack = () => {
        navigate(-1);  // Navigates one step back in the browser history
    };

    const handleCollectionClick = (collection) => {
        const address = collection.collection_address ? collection.collection_address : collection.token_address;
        setGlobalDataCache(prevData => ({
          ...prevData,
          activeNFTCollection: collection
        }));
        navigate(`/nfts/${address}`);
        window.scrollTo(0, 0);
      };

  useEffect(() => {
    // Check for the cache item
    
  }, [navigate]);

  

  useEffect(() => {

  }, [globalDataCache]);


  useEffect(() => {
    
    const shouldFetch = !globalDataCache.nft;
    if (shouldFetch) {
        fetch(`${process.env.REACT_APP_API_URL}/api/marketplace`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch data');
            return response.json();
        })
        .then(fetchedData => {
                
            setGlobalDataCache(prevData => ({
                ...prevData,
                nft: {
                    trending: fetchedData.trending,
                    top: fetchedData.top,
                    featured: fetchedData.featured
                }
            }));
        })
        .catch(error => {
            setError(error.message);
            setLoading(false);
        });
    } else {
      console.log("Data already available in cache.");
    }
  }, [globalDataCache.nft, setGlobalDataCache]);


  // Fetch data based on id or use it as needed
  return (

        <>
            <NavBar />
          
    <div id="nft-marketplace">
    
        <div className="container">
            <h1 className="intro">RareMint Marketplace</h1>

            {!globalDataCache.nft && (
                <>
                    <div className="row">
                        <div className="col">
                            <SkeletonCard />
                        </div>
                        <div className="col">
                            <SkeletonCard />
                        </div>
                        <div className="col">
                            <SkeletonCard />
                        </div>
                        <div className="col">
                            <SkeletonCard />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <Skeleton />
                            <Skeleton />
                        </div>
                    </div>
                    
                </>
            )}

            {(globalDataCache.nft && globalDataCache.nft.featured) && (
                <>
                    <h2>🔦 Featured</h2>

                    <div className="row">
                        {globalDataCache.nft.featured.slice(0, 4).map(collection => (
                            <div className="col-lg-3">
                                <div className="wallet-card collection-card" onClick={() => handleCollectionClick(collection)}>
                                    <div className="card-img" style={{ backgroundImage: `url('${collection.collection_logo}')` }}></div>
                                    <div className="nft-category">
                                        <CollectionCategory category={collection.collection_category}/>
                                    </div>
                                    <div className="title">{collection.name}
                                    {collection.verified_collection && 
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20"><polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"/><polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"/></svg>
                                        </>
                                    }
                                    </div>
                                    <h6>Floor</h6>
                                    <div className="token-price">{collection.floor_price ? collection.floor_price : "0.04"} ETH</div>
                                </div>
                                
                            </div>
                        ))}
                        
                    </div>

                </>
            )}

            {(globalDataCache.nft && globalDataCache.nft.trending) && (
                <>
                    <h2>🔥 Trending</h2>

                    <div className="row">
                        <div className="col-lg-6">
                            <ul className="token-list market-data featured">
                         
                                
                                
                                {globalDataCache.nft.trending.slice(0,5).map(collection => (
                                    <li key={collection.collection_image}  onClick={() => handleCollectionClick(collection)}>
                                        <TokenLogo tokenImage={collection.collection_image} tokenName={collection.collection_title}/>
                                        <div>
                                            <div className="token-name">{collection.collection_title}</div>
                                        </div>
                                        <div className="token-price">{collection.floor_price} ETH</div>
                                    </li>
                                ))}

                            </ul>
                        </div>

                        <div className="col-lg-6">
                            <ul className="token-list market-data featured">
                               
                                
                                {globalDataCache.nft.trending.slice(5,10).map(collection => (
                                    <li key={collection.collection_image}  onClick={() => handleCollectionClick(collection)}>
                                        <TokenLogo tokenImage={collection.collection_image} tokenName={collection.collection_title}/>
                                        <div>
                                            <div className="token-name">{collection.collection_title} 
                                            {collection.verified_collection && 
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20"><polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"/><polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"/></svg>
                                                </>
                                            }
                                            </div>
                                        </div>
                                        <div className="token-price">{collection.floor_price} ETH</div>
                                    </li>
                                ))}

                            </ul>
                        </div>
                    </div>
                    
                </>
            )}

            {(globalDataCache.nft && globalDataCache.nft.top) && (
                <>
                    <h2>🚀 Top Collections by Market Cap</h2>
                    <ul className="token-list market-data wider-col-1">
                        <li className="header-row">
                            <div>Collection</div>
                            <div></div>
                            <div>Floor Price</div>
                            <div>Floor Price 24h %</div>
                            <div>Market Cap</div>
                            <div>Market Cap 24h %</div>
                        </li>
                        
                        
                        {globalDataCache.nft.top.slice(0,25).map(collection => (
                            <li key={collection.collection_image}  onClick={() => handleCollectionClick(collection)}>
                            <TokenLogo tokenImage={collection.collection_image} tokenName={collection.collection_title}/>
                            <div>
                                <div className="token-name">{collection.collection_title}</div>
                            </div>
                            <div className="token-price">
                                {collection.floor_price} ETH
                                <div className="usd-floor-price">{collection.floor_price_usd && `${Number(Number(collection.floor_price_usd).toFixed(2)).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}`}</div>
                            </div>
                            <div className={collection.floor_price_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(collection.floor_price_24hr_percent_change).toFixed(2)}%</div>
                            <div className="">{Number(collection.market_cap_usd).toLocaleString('en-US', {style: 'currency',currency: 'USD'})}</div>
                            <div className={collection.market_cap_24hr_percent_change < 0 ? "negative" : "positive"}>{Number(collection.market_cap_24hr_percent_change).toFixed(2)}%</div>
                            </li>
                        ))}

                    </ul>
                </>
            )}
        </div>
    </div>

    </>
  );
}

export default NFTMarketplace;
