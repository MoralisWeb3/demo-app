import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Nav, NavItem, NavLink, TabContent, TabPane, Table } from "reactstrap";
import CopyToClipboard from "../Misc/CopyToClipboard";
import { useNavigate } from "react-router-dom";

function EntityDashboard() {
  const { id } = useParams();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const navigate = useNavigate();

  const chainDetails = {
    "0x1": { name: "Ethereum", explorer: "https://etherscan.io" },
    "0x89": { name: "Polygon", explorer: "https://polygonscan.com" },
    "0x38": { name: "Binance Smart Chain", explorer: "https://bscscan.com" },
    "0xfa": { name: "Fantom", explorer: "https://ftmscan.com" },
    "0xa86a": { name: "Avalanche", explorer: "https://snowtrace.io" },
    "0xa4b1": { name: "Arbitrum", explorer: "https://arbiscan.io" },
    "0x19": { name: "Cronos", explorer: "https://cronoscan.com" },
    "0x2105": { name: "Base", explorer: "https://basescan.io" },
    "0x64": { name: "Gnosis", explorer: "https://gnosisscan.io" },
    "0xa": { name: "Optimism", explorer: "https://optimistic.etherscan.io" },
  };

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    async function fetchEntityDetails() {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/entities/${id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch entity details");
        }
        const data = await response.json();
        setEntity(data);
        if (data.addresses && data.addresses.length > 0) {
          setActiveTab(
            chainDetails[data.addresses[0].chain]?.name ||
              data.addresses[0].chain
          );
        }
      } catch (error) {
        setError(error.message);
        console.error("Error fetching entity details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEntityDetails();
  }, [id]);

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!entity) return <div>No entity found.</div>;

  // Helper function to group addresses by chain
  const groupedAddresses = getGroupedAddresses(
    entity.addresses || [],
    chainDetails
  );

  return (
    <div className="container page">
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
      <div className="entity-header">
        <img src={entity.logo} alt={`${entity.name} logo`} />
        <div>
          <h1>
            {entity.name} <span className="entity-type">{entity.type}</span>
          </h1>
          <p>{entity.bio}</p>
        </div>
      </div>

      <p>
        <strong>Website:</strong>{" "}
        <a href={entity.website} target="_blank" rel="noopener noreferrer">
          {entity.website}
        </a>
      </p>
      <p>
        <strong>Twitter:</strong>{" "}
        <a href={entity.twitter} target="_blank" rel="noopener noreferrer">
          {entity.twitter}
        </a>
      </p>

      <p>{entity.description}</p>

      <h4>Addresses</h4>
      <Nav tabs>
        {Object.keys(groupedAddresses).map((chain, index) => (
          <NavItem key={index}>
            <NavLink
              className={activeTab === chain ? "active" : ""}
              onClick={() => toggle(chain)}
            >
              {chain}
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent activeTab={activeTab}>
        {Object.keys(groupedAddresses).map((chain, index) => (
          <TabPane tabId={chain} key={index}>
            <Table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Address</th>
                  <th>Primary Label</th>
                  <th>Additional Labels</th>
                  <th>Explore</th>
                </tr>
              </thead>
              <tbody>
                {groupedAddresses[chain].map((address, idx) => (
                  <tr key={idx}>
                    <th scope="row">{idx + 1}</th>
                    <td className="entity-address-item">
                      <div className="right copy-container">
                        <img
                          src={`https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${address.address}`}
                          width="25"
                        />
                        {address.address}

                        <CopyToClipboard valueToCopy={address.address}>
                          <button></button>
                        </CopyToClipboard>
                      </div>
                    </td>
                    <td>{address.primary_label}</td>
                    <td></td>
                    <td>
                      <img src="/images/favicon.png" width="20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TabPane>
        ))}
      </TabContent>
    </div>
  );
}

// Group addresses by chain
function getGroupedAddresses(addresses, chainDetails) {
  return addresses.reduce((acc, address) => {
    const chainName = chainDetails[address.chain]?.name || address.chain;
    acc[chainName] = acc[chainName] || [];
    acc[chainName].push(address);
    return acc;
  }, {});
}

export default EntityDashboard;
