import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useParams } from "react-router-dom";
import NavBar from "../Misc/NavBar";
import Form from "./Form";
import PairDashboard from "./PairDashboard";
import { useNavigate } from "react-router-dom";
import Loader from "../Misc/Loader";
import { useData } from "../../DataContext";
import "../../custom.scss";
import { debounce } from "lodash";

function PairSearch() {
  const { globalDataCache, setGlobalDataCache } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  let hasData = false;
  const { tokenAddress } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const debouncedSubmit = debounce(() => {
      if (tokenAddress) {
        handleWalletSubmit(tokenAddress);
      }
    }, 300); // Adjust the delay as needed

    debouncedSubmit();

    // Cleanup the debounce function on component unmount or when tokenAddress changes
    return () => debouncedSubmit.cancel();
  }, [tokenAddress]);

  const handleWalletSubmit = async ({ chain, address }) => {
    try {
      setLoading(true);
      setError(null);
  
      // Use the chain and address correctly in the navigate function
      navigate(`/chain/${chain}/pairs/${address}`);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {globalDataCache.pairData ? (
        <>
          <NavBar />
          <div className="container">
            <Routes>
              <Route path="/" element={<PairDashboard />} />
            </Routes>
          </div>
        </>
      ) : (
        <>
          <div className="container text-center">
            <h1>
              🔍 <br />
              Pair Analytics
            </h1>
            <div id="wallet-container">
              {loading ? (
                <>
                  <Loader />
                </>
              ) : (
                <>
                  <p>
                    Explore pair insights, prices, liquidity providers and more
                    🔥
                  </p>
                  <Form
                    onSubmit={handleWalletSubmit}
                    loading={loading}
                    placeholder={"Enter a pair address"}
                    buttonText={"Search"}
                  />
                  {error && <div className="text-red-500 mt-2">{error}</div>}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default PairSearch;
