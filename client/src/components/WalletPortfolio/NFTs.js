import React, { useState, useEffect } from 'react';
import { useData } from '../../DataContext';
import { useParams } from 'react-router-dom';
import useFetchWalletDetails from '../../hooks/useFetchWalletDetails';
import NavBar from '../Misc/NavBar';
import Skeleton from '../Misc/Skeleton';
import Loader from '../Misc/Loader';
import ChainDropDown from '../Misc/ChainDropDown';
import NFT from './NFT';
import CopyToClipboard from '../Misc/CopyToClipboard';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import * as utilities from '../../utilities.js';

const NFTs = () => {
  const { walletAddress } = useParams();
  const fetchWalletDetails = useFetchWalletDetails(walletAddress);
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [nftLoading, setNFTLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modal, setModal] = useState(false);
  const [activeNFT, setActiveNFT] = useState(null);

  const toggleModal = () => setModal(!modal);

  const handleNFTClick = (nft) => {
    toggleModal();
    setNFTLoading(true)
    fetch(`${process.env.REACT_APP_API_URL}/api/wallet/nfts/${nft.token_address}/${nft.token_id}?chain=${globalDataCache.selectedChain}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        // Update globalDataCache with fetchedData
        setActiveNFT(fetchedData);
        setNFTLoading(false);
        
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  };


  const fetchTokens = (chain, address) => {
    setLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData,
      nfts:null,
      nftsLoaded:false
    }));
    fetch(`${process.env.REACT_APP_API_URL}/api/wallet/nfts?chain=${chain ? chain : globalDataCache.selectedChain}&wallet=${address ? address : globalDataCache.walletAddress}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {
        // Update globalDataCache with fetchedData
        
        setGlobalDataCache(prevData => ({
          ...prevData,
          nfts: fetchedData,
          nftsLoaded:true
        }));
        setLoading(false);
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
      selectedChain:selectedValue
    }));
    fetchTokens(selectedValue);
  };
  
  useEffect(() => {
    if (!globalDataCache.nftsLoaded) {
        console.log("FETCH!")
        if (!globalDataCache.profile || globalDataCache.walletAddress !== walletAddress) {
            console.log('No profile details, look up wallet details.')
            fetchWalletDetails().then(data => {
                console.log("Fetched profile! Now fetch tokens");
                fetchTokens(null, data.address);
            }).catch(error => {
                console.error('Failed to fetch wallet details:', error);
                // Handle errors or update state to show error message
            });
        } else if(globalDataCache.profile && !globalDataCache.nfts) {
            console.log('Already got profile details, look up token details.')
            fetchTokens(globalDataCache.selectedChain);
        }
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

      <div id="nft-page" className="container">

      {(!globalDataCache.nfts || loading) && <Loader />}

      {error && <div className="text-red-500">{error}</div>} 
      {globalDataCache.nftsLoaded && (
        <>
      
        <div className="page-header">
          <h2>NFTs {globalDataCache.nfts && <span>({globalDataCache?.nfts.length})</span>}</h2>
          <ChainDropDown 
            onChange={handleDropdownChange} 
            chains={globalDataCache.chains}
            selectedChain={globalDataCache.selectedChain}
          />
        </div>

        <div className="container">
          {loading && <Loader />}
          
          <div className="row">

          {globalDataCache.nfts && globalDataCache.nfts.map(token => (
            <div className="col-lg-3 equal" key={token.token_id+token.address} onClick={() => handleNFTClick(token)}>
                <NFT nft={token}/>
            </div>
            ))}

          </div>

          <Modal isOpen={modal} toggle={toggleModal} size="md" className="nft-modal">
            <ModalBody>
            {nftLoading && <Skeleton />}
              {activeNFT && !nftLoading && (
                <div className="nft-details">

                  <button className="close" onClick={toggleModal}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="#ffffff"><path d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z" fill="#ffffff"/></svg>
                  </button>
                  
                  <div className="container">

          
                      <img className="nft-image" src={utilities.returnNFTImage(activeNFT,"high")} alt="nft detail" width="100%"/>

                        <div className="nft-modal-content">
                          {activeNFT.verified_collection && (
                              <div className="verified-collection">Verified collection <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20"><polygon fill="#42a5f5" points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"/><polygon fill="#fff" points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"/></svg></div>
                          )}
                          <div className="title">{activeNFT.name} #{activeNFT.token_id}</div>
                          {activeNFT?.normalized_metadata.description && (
                            <p>{activeNFT.normalized_metadata.description}</p>
                          )}
                          <ul className="table-list">
                            <li>
                              <div className="left">Contract type</div>
                              <div className="right">{activeNFT.contract_type}</div>
                            </li>
                            <li>
                              <div className="left">Contract address</div>
                              <div className="right">
                                <div className="copy-container">
                                {utilities.shortAddress(activeNFT.token_address)}
                                    <CopyToClipboard valueToCopy={activeNFT.token_address}>
                                        <button></button>
                                      </CopyToClipboard>
                                </div>
                                
                                </div>
                            </li>
                            <li>
                              <div className="left">Token ID</div>
                              <div className="right">{activeNFT.token_id}</div>
                            </li>
                            
                          </ul>
                        </div>

                        <div className="nft-modal-content">
                            <div className="subtitle">Transaction Details</div>
                            <p>{activeNFT.transfer_event.type} {activeNFT.received_at_label} at block {activeNFT.block_number}
                            {activeNFT.transfer_event.type === "Purchased" ? ` for ${activeNFT.transfer_event.value_decimals} ETH.` : '.'}
                            </p>

                            <ul className="table-list">
                            <li>
                                <div className="left">Transaction Hash</div>
                                <div className="right">
                                  <div className="copy-container">
                                  {utilities.shortAddress(activeNFT.transfer_event.transaction_hash)}
                                    <CopyToClipboard valueToCopy={activeNFT.transfer_event.transaction_hash}>
                                        <button></button>
                                      </CopyToClipboard>
                                  </div>
                                  
                                </div>
                              </li>
                              <li>
                                <div className="left">Transfer Type</div>
                                <div className="right"><span className="nft-type-label">{activeNFT.transfer_event.type}</span></div>
                              </li>
                              {activeNFT.transfer_event.type === "Purchased" && (
                                <li>
                                  <div className="left">Amount Paid</div>
                                  <div className="right">{activeNFT.transfer_event.value_decimals} ETH</div>
                                </li>  
                              )}
                              <li>
                                <div className="left">Block Number</div>
                                <div className="right">{activeNFT.transfer_event.block_number}</div>
                              </li>
                              
                              <li>
                                <div className="left">Timestamp</div>
                                <div className="right">{activeNFT.transfer_event.block_timestamp}</div>
                              </li>
                              <li>
                                <div className="left">From Address</div>
                                <div className="right">
                                  
                                  <div className="copy-container">
                                  {utilities.shortAddress(activeNFT.transfer_event.from_address)}
                                    <CopyToClipboard valueToCopy={activeNFT.transfer_event.from_address}>
                                        <button></button>
                                      </CopyToClipboard>
                                  </div>
                                </div>
                              </li>
                              {activeNFT.transfer_event.operator && (
                                <li>
                                  <div className="left">Operator Address</div>
                                  <div className="right">{utilities.shortAddress(activeNFT.transfer_event.operator)}</div>
                                </li>
                              )}
                              
                  
                              
                            </ul>
                        </div>
                      
                      {activeNFT.last_sale && (
                        <div className="nft-modal-content">
                            <div className="subtitle">Last Sale Details</div>
                            <p>Last sold for {activeNFT.last_sale.price_formatted} ETH ({activeNFT.last_sale.usd_price_at_sale})</p>

                            <ul className="table-list">
                            <li>
                                <div className="left">Amount Paid</div>
                                <div className="right">{activeNFT.last_sale.price_formatted} {activeNFT.last_sale.token_symbol}</div>
                              </li> 
                              <li>
                                <div className="left">Amount Paid (USD)</div>
                                <div className="right">${activeNFT.last_sale.usd_price_at_sale}</div>
                              </li> 
                              <li>
                                <div className="left">Transaction Hash</div>
                                <div className="right">
                                  <div className="copy-container">
                                  {utilities.shortAddress(activeNFT.last_sale.transaction_hash)}
                                    <CopyToClipboard valueToCopy={activeNFT.last_sale.transaction_hash}>
                                        <button></button>
                                      </CopyToClipboard>
                                  </div>
                                  
                                </div>
                              </li>                            
                              <li>
                                <div className="left">Timestamp</div>
                                <div className="right">{activeNFT.last_sale.block_timestamp}</div>
                              </li>
                              <li>
                                <div className="left">Buyer Address</div>
                                <div className="right">
                                  <div className="copy-container">
                                  {utilities.shortAddress(activeNFT.last_sale.buyer_address)}
                                    <CopyToClipboard valueToCopy={activeNFT.last_sale.buyer_address}>
                                        <button></button>
                                      </CopyToClipboard>
                                  </div>
                                </div>
                              </li>
                              <li>
                                <div className="left">Seller Address</div>
                                <div className="right">
                                  <div className="copy-container">
                                  {utilities.shortAddress(activeNFT.last_sale.seller_address)}
                                    <CopyToClipboard valueToCopy={activeNFT.last_sale.seller_address}>
                                        <button></button>
                                      </CopyToClipboard>
                                  </div>
                                </div>
                              </li>
                            
                  
                              
                            </ul>
                        </div>
                      )}


                        <div className="nft-modal-content">
                            <div className="subtitle">Token Provenance</div>
                            <p>Minted at block {activeNFT.block_number_minted}.</p>
                        </div>

                        <div className="nft-modal-content">
                            <div className="subtitle">Token Attributes</div>

                            <ul className="table-list">
                              {activeNFT.normalized_metadata && activeNFT.normalized_metadata.attributes && activeNFT.normalized_metadata.attributes.map((attribute, index) => (
                                <li key={index}>
                                  <div className="left">{attribute.trait_type}</div>
                                  <div className="right">{attribute.value}</div>
                                </li>
                              ))}
                            </ul>
                  
                        </div>

        
      
                  </div>
                  
                  
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <button onClick={toggleModal}></button>
            </ModalFooter>
          </Modal>
        </div>
            
        </>
        )}
      </div>
    </>
  );
};

export default NFTs;
