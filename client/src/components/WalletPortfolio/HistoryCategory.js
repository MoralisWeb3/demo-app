import React, { useState, useEffect } from "react";

function HistoryCategory({ category }) {
  function setCategory(category) {
    switch (category) {
      case "send": {
        return `Send`;
      }
      case "receive": {
        return `Receive`;
      }
      case "airdrop": {
        return `Airdrop`;
      }
      case "mint": {
        return `Mint`;
      }
      case "deposit": {
        return `Deposit`;
      }
      case "withdraw": {
        return `Withdraw`;
      }
      case "burn": {
        return `Burn`;
      }
      case "nft receive": {
        return `Received NFT`;
      }
      case "nft send": {
        return `Sent NFT`;
      }
      case "token send": {
        return `Sent Token`;
      }
      case "token receive": {
        return `Received Token`;
      }
      case "nft purchase": {
        return `Purchased NFT`;
      }
      case "nft sale": {
        return `Sold NFT`;
      }
      case "token swap": {
        return `Token Swap`;
      }
      case "approve": {
        return `Approval`;
      }
      case "revoke": {
        return `Revoke`;
      }
      case "borrow": {
        return `Borrowed`;
      }
      case "contract interaction": {
        return `Contract Interaction`;
      }
      default:
        return "";
    }
  }

  return <div>{setCategory(category)}</div>;
}

export default HistoryCategory;
