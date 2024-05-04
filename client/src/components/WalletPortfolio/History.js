import React, { useState, useEffect } from 'react';
import { useData } from '../../DataContext';
import NavBar from '../Misc/NavBar';
import { useParams } from 'react-router-dom';
import useFetchWalletDetails from '../../hooks/useFetchWalletDetails'; // Adjust path as necessary
import Skeleton from '../Misc/Skeleton';
import DateDropDown from '../Misc/DateDropDown';
import HistoryAccordionItem from './HistoryAccordionItem';
import ZerionTimeline from './ZerionTimeline';
import ZapperTimeline from './ZapperTimeline';
import UniswapTimeline from './UniswapTimeline';
import Loader from '../Misc/Loader';

import {
  Accordion
} from 'reactstrap';

const Historyv2 = () => {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('white'); // Default background color
  const { walletAddress } = useParams();
  const fetchWalletDetails = useFetchWalletDetails(walletAddress);
  // Handler to change background color
  const changeBackgroundColor = (color) => {
    setBackgroundColor(color);
  };
  const [view, setView] = useState("Default");

  const [dateValue, setDateValue] = useState('');
  const [firstTime, setFirstTime] = useState(true);

    const toggle = (id) => {
      if (open === id) {
        setOpen();
      } else {
        setOpen(id);
      }
  };

  const fetchHistory = (chain, days, address) => {
    setLoading(true);
    setError(null);
    setGlobalDataCache(prevData => ({
      ...prevData,
      history:null,
      historyLoaded:false
    }));
    
    let wallet = address ? address : globalDataCache.walletAddress;

    fetch(`${process.env.REACT_APP_API_URL}/api/wallet/history/new?chain=${chain}&wallet=${wallet}&days=${days ? days : "7"}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {

        setGlobalDataCache(prevData => ({
          ...prevData,
          history: fetchedData.txs,
          historyLoaded:true,
          lastDate: fetchedData.lastDate
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
      historyLoaded:false,
      selectedChain:selectedValue
    }));
    fetchHistory(selectedValue);
  };

  const handleDateChange = (days) => {
    setGlobalDataCache(prevData => ({
      ...prevData,
      days:days
    }));
    fetchHistory(globalDataCache.selectedChain, days);
  };

  const handleViewChange = (event) => {
    setView(event.target.value);
    if(event.target.value === "Zerion") {
      document.body.style.backgroundColor = "#17161B"
    }
    if(event.target.value === "Default") {
      document.body.style.backgroundColor = "#000D26"
    }
    if(event.target.value === "Zapper") {
      document.body.style.backgroundColor = "#0D1115"
    }

    if(event.target.value === "Uniswap") {
      document.body.style.backgroundColor = "#131313"
    }

  };


  const fetchMoreTxs = () => {
    let lastDate = globalDataCache.lastDate;
    let chain = globalDataCache.selectedChain;
    let days = globalDataCache.days;
    setLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/wallet/history/new?chain=${chain}&wallet=${globalDataCache.walletAddress}&days=${days ? days : "7"}&lastDate=${lastDate}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(fetchedData => {

        setGlobalDataCache(prevData => ({
          ...prevData,
          history: [...prevData.history, ...fetchedData.txs],
          historyLoaded:true,
          lastDate: fetchedData.lastDate
        }));
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  };
  


  useEffect(() => {
    if (!globalDataCache.historyLoaded) {
          console.log("FETCH!")
          if (!globalDataCache.profile || globalDataCache.walletAddress !== walletAddress) {
              console.log('No profile details, look up wallet details.')
              fetchWalletDetails().then(data => {
                  console.log("Fetched profile! Now fetch tokens");
                  fetchHistory(globalDataCache.selectedChain, null, data.address);
              }).catch(error => {
                  console.error('Failed to fetch wallet details:', error);
                  // Handle errors or update state to show error message
              });
          } else if(globalDataCache.profile && !globalDataCache.tokens) {
              console.log('Already got profile details, look up token details.')
              fetchHistory(globalDataCache.selectedChain);
          }
      }
  }, []);

 
  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  useEffect(() => {
    localStorage.setItem('selectedChain', globalDataCache.selectedChain);
}, [globalDataCache.selectedChain, globalDataCache.days]);

  
  return (
    <>
      <NavBar />

      {(!globalDataCache.history || loading) && <Loader />}

      {globalDataCache.history && (
          <div id="history-page">
              <div className="page-header">
                <h2>{view} History</h2>
                <select value={view} onChange={handleViewChange}>
                  <option value="Default">Default</option>
                  <option value="Zerion">Zerion</option>
                  <option value="Zapper">Zapper</option>
                  <option value="Uniswap">Uniswap</option>
                </select>
                <DateDropDown 
                  onChange={handleDateChange} 
                  days={globalDataCache.days}
                />
                {/* <ChainDropDown 
                  onChange={handleDropdownChange} 
                  chains={globalDataCache.chains}
                  selectedChain={globalDataCache.selectedChain}
                /> */}
              </div>
              {!loading && !error && globalDataCache?.history && globalDataCache.history.length === 0 && (
                  <h5>No activity found for this period.</h5>
                )}
              <div className="container">
                
                {error && <div className="text-red-500">{error}</div>} 
      
                { view === "Default" && (
                  <Accordion flush open={open} toggle={toggle}>
                  {globalDataCache.history && globalDataCache.history.filter(t => !t.possible_spam).map(item => (
                    <HistoryAccordionItem item={item} />
                  ))}
                </Accordion>
                )} 
      
                {view === "Zerion" && (
                  <>
                    {globalDataCache.history
                    ? <>
                        <ZerionTimeline transactions={globalDataCache.history} />
                        <div id="fetch-txs">
                            <button onClick={fetchMoreTxs}>More transactions</button>
                        </div>
                      </>
                    : <></>
                    }
      
      
                    
                  
                  </>
                  
                  
                )}
      
                {view === "Zapper" && (
                  <>
                    {globalDataCache.history
                      ? <ZapperTimeline transactions={globalDataCache.history} />
                      : <></>
                      }
                  </>
                )}
      
                {view === "Uniswap" && (
                  <>
                    {globalDataCache.history
                      ? <UniswapTimeline transactions={globalDataCache.history} />
                      : <></>
                      }
                  </>
                )}
      
              
              {loading && <Skeleton />}
              
              </div>
            </div>
      )}
      
    </>
  );
};

export default Historyv2;
