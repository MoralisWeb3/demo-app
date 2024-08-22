import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import NavBar from "../Misc/NavBar";
import { useData } from "../../DataContext";
import Skeleton from "../Misc/Skeleton";
import Loader from "../Misc/Loader";
import SkeletonCard from "../Misc/SkeletonCard";
import ExternalLinkIcon from "../Misc/ExternalLinkIcon";
import CopyToClipboard from "../Misc/CopyToClipboard";
import NFT from "../WalletPortfolio/NFT";
import { Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
import * as utilities from "../../utilities.js";
import classnames from "classnames";
import moment from "moment";
import CollectionCategory from "./CollectionCategory";

function NFTCollection() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let { collection } = useParams(); // Access the protocolId from URL
  let navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const goBack = () => {
    navigate(-1); // Navigates one step back in the browser history
    window.scrollTo(0, 0);
  };

  const handleNFTClick = (nft) => {
    setGlobalDataCache((prevData) => ({
      ...prevData,
      selectedNFT: nft,
    }));
    navigate(`/nfts/${nft.token_address}/${nft.token_id}`);
  };

  const fetchTrades = (collection) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/nfts/${collection}/trades`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch data");
        return response.json();
      })
      .then((fetchedData) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          collectionTrades: fetchedData.collectionTrades,
        }));
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Check for the cache item
  }, [navigate]);

  useEffect(() => {}, [globalDataCache]);

  useEffect(() => {
    const shouldFetch =
      !globalDataCache.activeNFTCollection ||
      !globalDataCache.activeNFTCollection.metadata;
    if (shouldFetch) {
      console.log("Fetch marketplace");
      fetch(`${process.env.REACT_APP_API_URL}/api/nfts/${collection}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch data");
          return response.json();
        })
        .then((fetchedData) => {
          setGlobalDataCache((prevData) => ({
            ...prevData,
            nftLoaded: true,
            activeNFTCollection: {
              ...prevData.activeNFTCollection,
              metadata: fetchedData.collectionMetadata,
              nfts: fetchedData.collectionNFTs,
              transfers: fetchedData.collectionTransfers,
              owners: fetchedData.collectionOwners,
            },
          }));
          fetchTrades(collection);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    } else {
      console.log("Data already available in cache.");
      setGlobalDataCache((prevData) => ({
        ...prevData,
        nftLoaded: true,
      }));
    }

    // This will run when component unmounts
    return () => {
      setGlobalDataCache((prevData) => ({
        ...prevData,
        nftLoaded: false,
      }));
    };
  }, []);

  // Fetch data based on id or use it as needed
  return (
    <>
      <NavBar />

      <div id="nft-marketplace" className="page">
        {globalDataCache.nftLoaded && globalDataCache.activeNFTCollection && (
          <div className="hero-section">
            {globalDataCache.activeNFTCollection.metadata && (
              <div
                className="hero-img"
                style={{
                  backgroundImage: `url('${globalDataCache.activeNFTCollection.metadata.collection_banner_image}')`,
                }}
              ></div>
            )}

            <div className="container">
              <button
                className="btn btn-sm btn-outline portfolio-back"
                onClick={goBack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  fill="#edf2f4"
                >
                  <path
                    d="M 10 4.9296875 L 2.9296875 12 L 10 19.070312 L 11.5 17.570312 L 6.9296875 13 L 21 13 L 21 11 L 6.9296875 11 L 11.5 6.4296875 L 10 4.9296875 z"
                    fill="#edf2f4"
                  />
                </svg>{" "}
                Back
              </button>
              <div className="wallet-card marketplaces">
                <h1>
                  {globalDataCache.activeNFTCollection.metadata
                    ? globalDataCache.activeNFTCollection.metadata.name
                    : ""}
                  {globalDataCache.activeNFTCollection.metadata &&
                    globalDataCache.activeNFTCollection.metadata
                      .verified_collection && (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          width="30"
                        >
                          <polygon
                            fill="#42a5f5"
                            points="29.62,3 33.053,8.308 39.367,8.624 39.686,14.937 44.997,18.367 42.116,23.995 45,29.62 39.692,33.053 39.376,39.367 33.063,39.686 29.633,44.997 24.005,42.116 18.38,45 14.947,39.692 8.633,39.376 8.314,33.063 3.003,29.633 5.884,24.005 3,18.38 8.308,14.947 8.624,8.633 14.937,8.314 18.367,3.003 23.995,5.884"
                          />
                          <polygon
                            fill="#fff"
                            points="21.396,31.255 14.899,24.76 17.021,22.639 21.428,27.046 30.996,17.772 33.084,19.926"
                          />
                        </svg>
                      </>
                    )}
                </h1>
                <div className="row">
                  <div className="col-lg-8">
                    <div className="collection-info">
                      <div className="nft-category">
                        <CollectionCategory
                          category={
                            globalDataCache.activeNFTCollection.metadata
                              .collection_category
                          }
                        />
                      </div>
                      <div className="spacer">·</div>
                      <div>
                        Minted{" "}
                        {moment(
                          globalDataCache.activeNFTCollection.metadata.synced_at
                        ).format("Do MMMM YYYY")}
                      </div>
                    </div>

                    <ul>
                      <li></li>
                      <li>
                        {
                          globalDataCache.activeNFTCollection.metadata
                            .project_url
                        }
                      </li>
                      <li>
                        @
                        {
                          globalDataCache.activeNFTCollection.metadata
                            .twitter_username
                        }
                      </li>
                      <li>
                        {
                          globalDataCache.activeNFTCollection.metadata
                            .discord_url
                        }
                      </li>
                      <li></li>
                    </ul>
                  </div>

                  <div className="col-lg-4">
                    {globalDataCache.activeNFTCollection.floor_price && (
                      <div className="collection-floor">
                        {globalDataCache.activeNFTCollection.floor_price} ETH{" "}
                        <span
                          className={
                            globalDataCache.activeNFTCollection
                              .floor_price_24hr_percent_change < 0
                              ? "negative"
                              : "positive"
                          }
                        >
                          {Number(
                            globalDataCache.activeNFTCollection
                              .floor_price_24hr_percent_change
                          ).toFixed(2)}
                          %
                        </span>
                      </div>
                    )}

                    <ul className="collection-info">
                      <li>
                        <a
                          href={`https://opensea.io/assets/ethereum/${globalDataCache.activeNFTCollection.metadata.token_address}`}
                          target="_blank"
                        >
                          OpenSea <ExternalLinkIcon width={16} />
                        </a>
                      </li>
                      <li className="spacer">·</li>
                      <li>
                        <a
                          href={`https://looksrare.org/collections/${globalDataCache.activeNFTCollection.metadata.token_address}`}
                          target="_blank"
                        >
                          LooksRare <ExternalLinkIcon width={16} />
                        </a>
                      </li>
                      <li className="spacer">·</li>
                      <li>
                        <a
                          href={`https://blur.io/collection/${globalDataCache.activeNFTCollection.metadata.token_address}`}
                          target="_blank"
                        >
                          Blur <ExternalLinkIcon width={16} />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container">
          {(!globalDataCache.activeNFTCollection ||
            !globalDataCache.activeNFTCollection.metadata) && (
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

          {globalDataCache.activeNFTCollection &&
            globalDataCache.activeNFTCollection.nfts && (
              <>
                <div className="row">
                  <div className="col">
                    <div>
                      <Nav tabs>
                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "1",
                            })}
                            onClick={() => {
                              toggle("1");
                            }}
                          >
                            NFTs
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "2",
                            })}
                            onClick={() => {
                              toggle("2");
                            }}
                          >
                            Activity
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "5",
                            })}
                            onClick={() => {
                              toggle("5");
                            }}
                          >
                            Sales
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "3",
                            })}
                            onClick={() => {
                              toggle("3");
                            }}
                          >
                            Holders
                          </NavLink>
                        </NavItem>
                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "4",
                            })}
                            onClick={() => {
                              toggle("4");
                            }}
                          >
                            Traits & Rarity
                          </NavLink>
                        </NavItem>

                        <NavItem>
                          <NavLink
                            className={classnames({
                              active: activeTab === "6",
                            })}
                            onClick={() => {
                              toggle("6");
                            }}
                          >
                            Pricing Data
                          </NavLink>
                        </NavItem>
                      </Nav>

                      <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                          <h2>NFTs</h2>
                          <div className="row">
                            {globalDataCache.activeNFTCollection.nfts &&
                              globalDataCache.activeNFTCollection.nfts.map(
                                (token) => (
                                  <div className="col-lg-3 equal">
                                    <div
                                      className="nft-holder"
                                      key={token.token_hash}
                                      onClick={() => handleNFTClick(token)}
                                    >
                                      <NFT nft={token} />
                                    </div>
                                  </div>
                                )
                              )}
                          </div>
                        </TabPane>
                        <TabPane tabId="2">
                          <h2>Activity</h2>
                          <ul>
                            {globalDataCache.activeNFTCollection.transfers &&
                              globalDataCache.activeNFTCollection.transfers.map(
                                (item) => (
                                  <li className="transfer-item">
                                    <div
                                      className={`category ${
                                        item.value === "0" ? "transfer" : "sale"
                                      }`}
                                    >
                                      <div
                                        className={`${
                                          item.value === "0"
                                            ? "transfer"
                                            : "sale"
                                        }`}
                                      >
                                        {item.value === "0"
                                          ? "Transfer"
                                          : "Sale"}
                                      </div>
                                    </div>

                                    <div className="label">
                                      <div className="group">
                                        <div className="heading">Token ID</div>
                                        <div className="value">
                                          {item.token_id}
                                        </div>
                                      </div>

                                      <div className="group">
                                        <div className="heading">From</div>
                                        <div className="value">
                                          {utilities.shortAddress(
                                            item.from_address
                                          )}
                                        </div>
                                      </div>

                                      <div className="group">
                                        <div className="heading">To</div>
                                        <div className="value">
                                          {utilities.shortAddress(
                                            item.to_address
                                          )}
                                        </div>
                                      </div>

                                      <div className="group">
                                        <div className="heading">
                                          Transaction
                                        </div>
                                        <div className="value copy-container">
                                          {utilities.shortAddress(
                                            item.transaction_hash
                                          )}
                                          <CopyToClipboard
                                            valueToCopy={item.transaction_hash}
                                          >
                                            <button></button>
                                          </CopyToClipboard>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="timestamp">
                                      {moment(item.block_timestamp).fromNow()}
                                    </div>
                                  </li>
                                )
                              )}
                          </ul>
                        </TabPane>
                        <TabPane tabId="3">
                          <h2>Holders</h2>

                          <div className="row">
                            <div className="col-lg-6">
                              <ul className="owners-list">
                                {globalDataCache.activeNFTCollection.owners &&
                                  globalDataCache.activeNFTCollection.owners
                                    .slice(0, 50)
                                    .map((owner) => (
                                      <li>
                                        <div>{owner.owner_of}</div>
                                        <div>#{owner.token_id}</div>
                                      </li>
                                    ))}
                              </ul>
                            </div>

                            <div className="col-lg-6">
                              <ul className="owners-list">
                                {globalDataCache.activeNFTCollection.owners &&
                                  globalDataCache.activeNFTCollection.owners
                                    .slice(50, 100)
                                    .map((owner) => (
                                      <li>
                                        <div>{owner.owner_of}</div>
                                        <div>#{owner.token_id}</div>
                                      </li>
                                    ))}
                              </ul>
                            </div>
                          </div>
                        </TabPane>

                        <TabPane tabId="4">
                          <h2>Coming soon</h2>
                        </TabPane>
                        <TabPane tabId="5">
                          <h2>Sales</h2>
                          <ul className="flex-table nft-trades">
                            {globalDataCache.collectionTrades &&
                              globalDataCache.collectionTrades.map((item) => (
                                <li className="flex-row transfer-item trade-item">
                                  <div className="group small">
                                    <img
                                      src={item.marketplace_logo}
                                      width="50"
                                    />
                                  </div>
                                  <div className="group">
                                    <div className="heading">Token ID</div>
                                    <div className="value">
                                      {item.token_ids[0]}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Sold For</div>
                                    <div className="value">
                                      {Number(item.price_formatted).toFixed(2)}{" "}
                                      {item.token_name}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Current Value</div>
                                    <div className="value">
                                      $
                                      {utilities.formatPriceNumber(
                                        Number(item.current_usd_value)
                                      )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Seller</div>
                                    <div className="value">
                                      {utilities.shortAddress(
                                        item.seller_address
                                      )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Buyer</div>
                                    <div className="value">
                                      {utilities.shortAddress(
                                        item.buyer_address
                                      )}
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="heading">Transaction</div>
                                    <div className="value copy-container">
                                      {utilities.shortAddress(
                                        item.transaction_hash
                                      )}
                                      <CopyToClipboard
                                        valueToCopy={item.transaction_hash}
                                      >
                                        <button></button>
                                      </CopyToClipboard>
                                    </div>
                                  </div>

                                  <div className="group">
                                    <div className="timestamp">
                                      {moment(item.block_timestamp).fromNow()}
                                    </div>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        </TabPane>
                        <TabPane tabId="6">
                          <h2>Coming soon</h2>
                        </TabPane>
                      </TabContent>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </>
  );
}

export default NFTCollection;
