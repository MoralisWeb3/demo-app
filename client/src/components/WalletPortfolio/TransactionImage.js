import React, { useState, useEffect } from 'react';

// Custom hook to load an image with a timeout
function useImageWithTimeout(url, placeholder, timeout = 5000) {
  const [source, setSource] = useState({ src: url, error: false, loading: true });

  useEffect(() => {
    let isMounted = true;
    const img = new Image();

    let timer = setTimeout(() => {
      if (isMounted && source.loading) { // Only switch to placeholder if still loading
        setSource({ src: placeholder, error: true, loading: false });
      }
    }, timeout);

    img.onload = () => {
      if (isMounted) {
        clearTimeout(timer);
        setSource({ src: url, error: false, loading: false });
      }
    };

    img.onerror = () => {
      if (isMounted) {
        clearTimeout(timer);
        setSource({ src: placeholder, error: true, loading: false });
      }
    };

    img.src = url;

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [url, placeholder, timeout, source.loading]);

  return source;
}

// Assuming findImageUrl logic is incorporated based on the transaction and chain
const findImageUrl = (transaction, chain) => {
  // Iterate over nft_transfers to find the first image URL
  if (transaction.nft_transfers?.length > 0) {
    for (let transfer of transaction.nft_transfers) {
      if (transfer.normalized_metadata?.image) {
        return transfer.normalized_metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
    }
  }

  // Check for collection_logo in nft_transfers
  for (let transfer of transaction.nft_transfers || []) {
    if (transfer.collection_logo) {
      return transfer.collection_logo;
    }
  }

  // Check for token_logo in erc20_transfers
  for (let transfer of transaction.erc20_transfers || []) {
    if (transfer.token_logo) {
      return transfer.token_logo;
    }
  }

  // Check for token_logo in erc20_transfers
  for (let transfer of transaction.native_transfers || []) {
    if (transfer.token_logo) {
      return transfer.token_logo;
    }
  }

  // Default images for send/receive transactions
  if (transaction.category === "send" || transaction.category === "receive") {
    return `/images/${chain}-icon.png`;
  }

  // Fallback placeholder image
  return `https://api.dicebear.com/7.x/identicon/svg?backgroundColor=b6e3f4&seed=${transaction.hash}`;
};

// Component using the custom hook
function TransactionImage({ transaction, chain }) {
  const placeholderImage = '/images/nft-placeholder.svg';
  const imageUrl = findImageUrl(transaction, chain); // Determine the image URL based on the transaction
  const { src } = useImageWithTimeout(imageUrl, placeholderImage, 10000); // Include the placeholder image URL and timeout


  // Placeholder or fallback image
  

  return (
    <img src={src} alt="Transaction" />
  );
}

export default TransactionImage;