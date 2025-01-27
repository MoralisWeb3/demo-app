import React, { useEffect, useState } from "react";
import { Collapse, Spinner } from "reactstrap";

const ExpandedRow = ({
  isOpen,
  address,
  fetchWalletInfo,
  walletData,
  contentRenderer,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && address && !walletData[address]) {
      setLoading(true);
      fetchWalletInfo(address)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, address, fetchWalletInfo, walletData]);

  return (
    <Collapse isOpen={isOpen}>
      {loading ? (
        <Spinner size="sm" />
      ) : error ? (
        <div className="text-danger">{error}</div>
      ) : walletData[address] ? (
        <div className="expanded-row-content p-3">
          {contentRenderer(walletData[address])}
        </div>
      ) : (
        <div>No data available.</div>
      )}
    </Collapse>
  );
};

export default ExpandedRow;
