import React, { useState } from "react";
import { Button } from "reactstrap";
import { useData } from "../../DataContext";

const Form = ({ onSubmit, loading, placeholder, buttonText }) => {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth"); // Default to Ethereum
  const [error, setError] = useState(null);
  const { globalDataCache, setGlobalDataCache } = useData();
  const isValidEthereumAddress = (address) =>
    /^(0x[a-fA-F0-9]{40})|([a-zA-Z0-9-]+\.eth)$/.test(address);

  const handleSubmit = (e) => {
    e.preventDefault();
    setGlobalDataCache((prevData) => ({
      ...prevData,
      selectedChain: chain,
    }));
    onSubmit({ chain, address });
  };

  return (
    <div className="container wallet-form">
      <form onSubmit={handleSubmit}>
        {/* Ethereum Address Input */}
        <input
          type="text"
          placeholder={placeholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        {/* Chain Selector Dropdown */}
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="chain-selector"
        >
          <option value="eth">Ethereum</option>
          <option value="base">Base</option>
          <option value="linea">Linea</option>
          <option value="solana">Solana</option>
        </select>

        {/* Submit Button */}
        <Button color="primary" type="submit">
          {loading ? "Loading..." : buttonText}
        </Button>
      </form>

      {/* Error Message */}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
};

export default Form;
