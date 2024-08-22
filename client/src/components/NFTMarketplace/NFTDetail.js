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

function NFTDetail() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let { collection, tokenId } = useParams(); // Access the protocolId from URL
  let navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("1");
  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const goBack = () => {
    navigate(-1); // Navigates one step back in the browser history
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    // Check for the cache item
  }, [navigate]);

  useEffect(() => {}, [globalDataCache]);

  useEffect(() => {
    const shouldFetch = !globalDataCache.selectedNFT;
    console.log("check check");

    fetch(`${process.env.REACT_APP_API_URL}/api/nfts/${collection}/${tokenId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch data");
        return response.json();
      })
      .then((fetchedData) => {
        setGlobalDataCache((prevData) => ({
          ...prevData,
          nftLoaded: true,
          selectedNFT: {
            ...prevData.selectedNFT,
            collectionSalePrices: fetchedData.collectionSalePrices,
            nftSalePrices: fetchedData.nftSalePrices,
            nftMetadata: fetchedData.nftMetadata,
            nftTrades: fetchedData.nftTrades,
          },
        }));
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });

    // if (shouldFetch) {
    //   console.log("Fetch marketplace");
    //   fetch(
    //     `${process.env.REACT_APP_API_URL}/api/nfts/${collection}/${tokenId}`
    //   )
    //     .then((response) => {
    //       if (!response.ok) throw new Error("Failed to fetch data");
    //       return response.json();
    //     })
    //     .then((fetchedData) => {
    //       setGlobalDataCache((prevData) => ({
    //         ...prevData,
    //         nftLoaded: true,
    //         selectedNFT: fetchedData,
    //       }));
    //     })
    //     .catch((error) => {
    //       setError(error.message);
    //       setLoading(false);
    //     });
    // } else {
    //   console.log("Data already available in cache, now fetch price!");
    //   setGlobalDataCache((prevData) => ({
    //     ...prevData,
    //     nftLoaded: true,
    //   }));
    // }

    // This will run when component unmounts
    return () => {
      //   setGlobalDataCache((prevData) => ({
      //     ...prevData,
      //     nftLoaded: false,
      //     selectedNFT: null,
      //   }));
    };
  }, []);

  return (
    <>
      <NavBar />

      <div id="nft-marketplace" className="page">
        {globalDataCache.selectedNFT && (
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
                <div className="row">
                  <div className="col-lg-5">
                    <h1>
                      {globalDataCache.selectedNFT?.normalized_metadata?.name}
                    </h1>
                    <img
                      src={
                        globalDataCache.selectedNFT?.media?.media_collection
                          ?.high.url
                      }
                    />
                  </div>

                  <div className="col-lg-7">
                    <h2>Traits</h2>
                    {globalDataCache.selectedNFT.normalized_metadata &&
                      globalDataCache.selectedNFT.normalized_metadata
                        .attributes && (
                        <ul className="nft-traits">
                          {globalDataCache.selectedNFT.normalized_metadata.attributes.map(
                            (attribute) => (
                              <li>
                                <div className="trait">
                                  {attribute.trait_type}
                                </div>
                                <div className="value">{attribute.value}</div>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                  </div>
                </div>

                <div className="row">
                  <div className="col">
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
                          Pricing Data
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
                    </Nav>

                    <TabContent activeTab={activeTab}>
                      <TabPane tabId="1">
                        <h2>Sale Prices</h2>
                        {globalDataCache.selectedNFT?.nftSalePrices?.last_sale
                          ? globalDataCache.selectedNFT?.nftSalePrices
                              ?.last_sale.current_usd_value
                          : "Fetching prices..."}

                        {globalDataCache.selectedNFT?.collectionSalePrices
                          ?.last_sale
                          ? globalDataCache.selectedNFT?.collectionSalePrices
                              ?.last_sale.current_usd_value
                          : "Fetching prices..."}
                      </TabPane>
                    </TabContent>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default NFTDetail;
