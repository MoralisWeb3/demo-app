import React, { useState } from 'react';

const DateDropDown = ({ onChange, days }) => {

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
                value={days}
                onChange={handleDropdownChange}
            >
                <option key="7" value="7">7 days</option>
                <option key="30" value="30">30 days</option>
                <option key="60" value="60">60 days</option>
                <option key="90" value="90">90 days</option>
                <option key="90" value="365">1 year</option>
            </select>
        </div>
    );
};

export default DateDropDown;