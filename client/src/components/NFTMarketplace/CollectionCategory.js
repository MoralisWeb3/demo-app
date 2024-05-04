import React, { useState, useEffect } from 'react';

function CollectionCategory({ category }) {

    function setCategory(category) {
        switch (category) {
            case 'pfps': {
                return `PFPs`;
            }
            case 'gaming': {
                return `Gaming`;
            }
            default:
                return category;
        }
    }

  return (
    <div>{setCategory(category)}</div>

  );
}

export default CollectionCategory;