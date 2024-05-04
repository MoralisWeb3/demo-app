import React, { useState, useEffect } from 'react';

function SimpleCategory({ category }) {

    function setCategory(category) {
        switch (category) {
            case 'send': {
                return `Sent`;
            }
            case 'receive': {
                return `Received`;
            }
            case 'airdrop': {
                return `Received`;
            }
            case 'mint': {
                return `Minted`;
            }
            case 'deposit': {
                return `Deposit`;
            }
            case 'withdraw': {
                return `Withdraw`;
            }
            case 'burn': {
                return `Burned`;
            }
            case 'nft receive': {
                return `Received`;
            }
            case 'nft send': {
                return `Sent`;
            }
            case 'token send': {
                return `Sent`;
            }
            case 'token receive': {
                return `Received`;
            }
            case 'nft purchase': {
                return `Bought`;
            }
            case 'nft sale': {
                return `Sold`;
            }
            case 'token swap': {
                return `Swapped`;
            }
            case 'approve': {
                return `Approved`;
            }
            case 'borrow': {
                return `Borrowed`;
            }
            case 'contract interaction': {
                return `Contract Interaction`;
            }
            default:
                return '';
        }
    }

  return (
    <div>{setCategory(category)}</div>

  );
}

export default SimpleCategory;