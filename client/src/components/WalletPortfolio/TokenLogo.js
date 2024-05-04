import React, { useState, useEffect } from 'react';

function TokenLogo({ tokenImage, tokenName, tokenSymbol }) {
    const [validImage, setValidImage] = useState(false);

    useEffect(() => {
        checkImageExists(tokenImage, exists => {
            setValidImage(exists);
        });
    }, [tokenImage]);

    function checkImageExists(url, callback) {
        const img = new Image();
        img.onload = function() {
            callback(true);
        };
        img.onerror = function() {
            callback(false);
        };
        img.src = url;
    }

    function getRandomColorWithOpacity(opacity = 0.5) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r},${g},${b},${opacity})`;
      }
      
    
      function getFirstValidCharacter(str) {
        for(let i = 0; i < str.length; i++) {
          if (/[A-Za-z0-9]/.test(str.charAt(i))) {
            return str.charAt(i);
          }
        }
        return '';  // Return empty string if no valid character is found
      }

    return (
        validImage && tokenImage 
        ? <div><img src={tokenImage} alt={tokenName} /></div>
        : <div>
            <div className="default-logo" style={{ background: getRandomColorWithOpacity(0.3) }}>
              {tokenSymbol && tokenSymbol.length < 6 ? tokenSymbol : getFirstValidCharacter(tokenName ? tokenName : "?")}
            </div>
          </div>
    );
}

export default TokenLogo;