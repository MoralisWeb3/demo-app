import React, { useState } from 'react';

const ChainDropDown = ({ chains, onChange, selectedChain }) => {

    const handleDropdownChange = (e) => {
        const value = e.target.value;
        // Invoke the passed-in onChange callback.
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <div>
            <select 
                value={selectedChain}
                onChange={handleDropdownChange}
            >
                {chains.map(chain => (
                    <option key={chain.chain} value={chain.chain}>
                        {chain.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ChainDropDown;