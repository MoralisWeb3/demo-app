import React, { useEffect, useState } from 'react';
import { useData } from '../../DataContext';
import {  Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';

const WalletInteractions = () => {
    const { globalDataCache, setGlobalDataCache } = useData();
    const [activeTab, setActiveTab] = useState('1');
    console.log("data is")    
console.log(globalDataCache)
  const toggle = tab => {
    if(activeTab !== tab) setActiveTab(tab);
  }

  useEffect(() => {
    console.log("Context value changed:", globalDataCache);
  }, [globalDataCache]);

  return (
    <div className="interactions-container">
      <Nav tabs>
        <NavItem>
          <NavLink
            className={activeTab === '1' ? 'active' : ''}
            onClick={() => { toggle('1'); }}
          >
            <div className="wallet-flex">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="#c7d5d3" width="30"><path d="M 64 6 C 48.5 6 33.9 12 23 23 C 11.7 34.3 6 49.1 6 64 C 6 78.9 11.7 93.7 23 105 C 34 116 48.5 122 64 122 C 79.5 122 94.1 116 105 105 C 127.6 82.4 127.6 45.6 105 23 C 94.1 12 79.5 6 64 6 z M 64 12 C 77.9 12 90.900781 17.399219 100.80078 27.199219 C 110.90078 37.399219 116 50.7 116 64 C 116 77.3 110.90078 90.600781 100.80078 100.80078 C 90.900781 110.60078 77.9 116 64 116 C 50.1 116 37.099219 110.60078 27.199219 100.80078 C 6.9992187 80.500781 6.9992188 47.499219 27.199219 27.199219 C 37.099219 17.399219 50.1 12 64 12 z M 63.962891 41 C 63.200391 41 62.450391 41.300391 61.900391 41.900391 L 46.900391 56.900391 C 46.300391 57.500391 46 58.2 46 59 C 46 59.8 46.300391 60.499609 46.900391 61.099609 C 48.100391 62.299609 49.999609 62.299609 51.099609 61.099609 L 61 51.199219 L 61 82 C 61 83.7 62.3 85 64 85 C 65.7 85 67 83.7 67 82 L 67 51.199219 L 76.900391 61.099609 C 78.100391 62.299609 79.999609 62.299609 81.099609 61.099609 C 82.299609 59.899609 82.299609 58.000391 81.099609 56.900391 L 66.099609 41.900391 C 65.499609 41.300391 64.725391 41 63.962891 41 z" fill="#c7d5d3"/></svg>
              </div>
              <div>
                <div className="big-value">{globalDataCache?.interactions.uniqueSentToCount}</div>
                <div className="heading">unique addresses sent to</div>
              </div>
            </div>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={activeTab === '2' ? 'active' : ''}
            onClick={() => { toggle('2'); }}
          >
            <div className="wallet-flex">
                          <div>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="#17bc76" width="30"><path d="M 64 6 C 48.5 6 33.9 12 23 23 C 11.7 34.3 6 49.1 6 64 C 6 78.9 11.7 93.7 23 105 C 34 116 48.5 122 64 122 C 79.5 122 94.1 116 105 105 C 127.6 82.4 127.6 45.6 105 23 C 94.1 12 79.5 6 64 6 z M 64 12 C 77.9 12 90.900781 17.399219 100.80078 27.199219 C 110.90078 37.399219 116 50.7 116 64 C 116 77.3 110.90078 90.600781 100.80078 100.80078 C 90.900781 110.60078 77.9 116 64 116 C 50.1 116 37.099219 110.60078 27.199219 100.80078 C 6.9992187 80.500781 6.9992188 47.499219 27.199219 27.199219 C 37.099219 17.399219 50.1 12 64 12 z M 64 43 C 62.3 43 61 44.3 61 46 L 61 76.800781 L 51.099609 66.900391 C 49.899609 65.700391 48.000391 65.700391 46.900391 66.900391 C 46.300391 67.500391 46 68.2 46 69 C 46 69.8 46.300391 70.499609 46.900391 71.099609 L 61.900391 86.099609 C 63.100391 87.299609 64.999609 87.299609 66.099609 86.099609 L 81.099609 71.099609 C 82.299609 69.899609 82.299609 68.000391 81.099609 66.900391 C 79.899609 65.700391 78.100391 65.700391 76.900391 66.900391 L 67 76.800781 L 67 46 C 67 44.3 65.7 43 64 43 z" fill="#17bc76"/></svg>
                          </div>
                          <div>
                            <div className="big-value">{globalDataCache?.interactions.uniqueReceivedFromCount}</div>
                            <div className="heading">unique addresses received from</div>
                          </div>
                        </div>
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">
            <ul class="table-list">
            <li className="header-row">
              <div>Address</div>
              <div>Interactions</div>
            </li>
             {globalDataCache.interactions.to && globalDataCache.interactions.to.slice(0,10).map(item => (
                <li>
                    <div className="address">{item[0]}</div>
                    <div>{item[1]}</div>
                </li>
             ))}
            </ul>
        </TabPane>
        <TabPane tabId="2">
            
            <ul class="table-list">
            <li className="header-row">
              <div>Address</div>
              <div>Interactions</div>
            </li>
             {globalDataCache.interactions.from && globalDataCache.interactions.from.slice(0,10).map(item => (
                <li>
                    <div className="address">{item[0]}</div>
                    <div>{item[1]}</div>
                </li>
             ))}
            </ul>
        </TabPane>
      </TabContent>
    </div>
  );
}

export default WalletInteractions;
