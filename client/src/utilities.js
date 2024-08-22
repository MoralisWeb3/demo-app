export function returnNFTImage(nft, resolution) {
  if (
    nft.media &&
    nft.media.media_collection &&
    nft.media.media_collection.high &&
    String(nft.media.media_collection.high.url).indexOf("charset=utf-8") < 0
  ) {
    if (resolution === "high") {
      return nft.media.media_collection.high.url;
    }

    return nft.media.media_collection.medium.url;
  } else if (nft.normalized_metadata && nft.normalized_metadata.image) {
    return nft.normalized_metadata.image;
  } else {
    return "/images/nft-placeholder.svg";
  }
}

export function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPriceNumber(num) {
  // First, handle the large number formatting with commas
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (parts.length === 2) {
    // If there's a decimal part, format it according to the rule
    let decimalPart = parts[1];
    const nonZeroMatch = decimalPart.match(/[^0]/); // Find first non-zero digit in decimal
    if (nonZeroMatch) {
      const firstNonZeroIndex = nonZeroMatch.index;
      // Calculate total length: digits before first non-zero + 4 or remaining length
      let totalLength = Math.min(firstNonZeroIndex + 5, decimalPart.length);
      // For numbers greater than 1, we limit to 2 decimal places if they exist
      if (parseInt(parts[0].replace(/,/g, ""), 10) >= 1) {
        totalLength = Math.min(2, decimalPart.length);
      }
      decimalPart = decimalPart.substring(0, totalLength);
      // Remove trailing zeros
      decimalPart = decimalPart.replace(/0+$/, "");
    }
    return decimalPart ? `${parts[0]}.${decimalPart}` : parts[0];
  }

  // Return formatted integer part if no decimal part
  return parts[0];
}

export function formatAsUSD(number) {
  if (number < 0.01 && number > 0) {
    return "<$0.01";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}
