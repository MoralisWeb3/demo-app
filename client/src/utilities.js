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
  if (number > 0 && number < 0.00000001) {
    return "<$0.01";
  }

  if (number > 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  }).format(number);
}

export const abbreviateNumber = (num) => {
  if (num < 1000) {
    return Number(num.toString()).toFixed(0);
  } else if (num >= 1000 && num < 1000000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
  } else if (num >= 1000000 && num < 1000000000) {
    return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}M`;
  } else if (num >= 1000000000 && num < 1000000000000) {
    return `${(num / 1000000000).toFixed(num >= 10000000000 ? 0 : 1)}B`;
  } else if (num >= 1000000000000) {
    return `${(num / 1000000000000).toFixed(num >= 10000000000000 ? 0 : 1)}T`;
  }
};

export const getTradeSizeLabel = (usdValue, showLabel) => {
  if (usdValue > 100000) {
    return `🐳${showLabel ? " Whale" : ""}`;
  } else if (usdValue > 10000) {
    return `🦈${showLabel ? " Shark" : ""}`;
  } else if (usdValue > 1000) {
    return `🐠${showLabel ? " Fish" : ""}`;
  } else if (usdValue > 100) {
    return `🦀${showLabel ? " Crab" : ""} `;
  } else {
    return `🍤${showLabel ? " Shrimp" : ""}`;
  }
};

export const formatTokenValue = (rawValue, decimals) => {
  if (typeof rawValue !== "string" && typeof rawValue !== "number") {
    throw new Error("rawValue must be a string or number");
  }
  if (typeof decimals !== "number" || decimals < 0) {
    throw new Error("decimals must be a positive number");
  }

  // Convert rawValue to a number
  const rawNumber = Number(rawValue);
  if (isNaN(rawNumber)) {
    throw new Error("rawValue must be a valid number");
  }

  // Calculate the formatted value
  const divisor = Math.pow(10, decimals);
  const formattedValue = rawNumber / divisor;

  // Convert to a string and limit to necessary decimal places
  return formattedValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const transformTransactionFormat = (
  transactions,
  initialPairAddress
) => {
  return transactions.map((tx) => {
    // Transaction type and basic fields
    const transactionType = tx.transactionType || "unknown";
    const transactionHash = tx.transactionHash || "";
    const transactionIndex = tx.transactionIndex || null;
    const blockTimestamp = tx.blockTimestamp || null;
    const blockNumber = tx.blockNumber || null;
    const walletAddress = tx.walletAddress || "unknown";
    const subCategory = tx.subCategory || "unknown";

    // Flag for different pair address
    const isDifferentPair = tx.pairAddress !== initialPairAddress;

    // Extract base and quote tokens from pairLabel
    const [baseTokenSymbol, quoteTokenSymbol] = (tx.pairLabel || "").split("/");

    // Determine if it's a buy or sell transaction
    const isSellTransaction = transactionType === "sell";

    // Extract the relevant fields from bought and sold
    let baseTokenAmount, quoteTokenAmount, totalValueUsd;
    if (isSellTransaction) {
      // For "sell" transactions, baseTokenAmount comes from sold.amount
      baseTokenAmount = Math.abs(parseFloat(tx.sold.amount || 0)).toFixed(6);
      quoteTokenAmount = Math.abs(parseFloat(tx.bought.amount || 0)).toFixed(6);
      totalValueUsd = parseFloat(tx.totalValueUsd || 0).toFixed(6);
    } else {
      // For "buy" transactions, baseTokenAmount comes from bought.amount
      baseTokenAmount = Math.abs(parseFloat(tx.bought.amount || 0)).toFixed(6);
      quoteTokenAmount = Math.abs(parseFloat(tx.sold.amount || 0)).toFixed(6);
      totalValueUsd = parseFloat(tx.totalValueUsd || 0).toFixed(6);
    }

    // Base and Quote Prices
    const baseTokenPriceUsd = isSellTransaction
      ? parseFloat(tx.sold.usdPrice || 0).toFixed(6)
      : parseFloat(tx.bought.usdPrice || 0).toFixed(6);
    const quoteTokenPriceUsd = isSellTransaction
      ? parseFloat(tx.bought.usdPrice || 0).toFixed(6)
      : parseFloat(tx.sold.usdPrice || 0).toFixed(6);

    return {
      transactionHash: transactionHash,
      transactionType: transactionType,
      transactionIndex: transactionIndex,
      blockTimestamp: blockTimestamp,
      blockNumber: blockNumber,
      walletAddress: walletAddress,
      subCategory: subCategory,

      // New fields for base and quote tokens
      baseTokenAmount: baseTokenAmount,
      quoteTokenAmount: quoteTokenAmount,
      baseTokenPriceUsd: baseTokenPriceUsd,
      quoteTokenPriceUsd: quoteTokenPriceUsd,

      // Total value USD
      totalValueUsd: totalValueUsd,

      // Additional fields
      isDifferentPair: isDifferentPair, // Flag indicating different pair address
      baseTokenSymbol: baseTokenSymbol, // Base token symbol
      quoteTokenSymbol: quoteTokenSymbol, // Quote token symbol
    };
  });
};

export const getTransactionSummary = (
  transaction,
  isBuy,
  baseToken,
  savedTokenSymbol
) => {
  let sentence = "";
  let category = "";

  switch (transaction.type) {
    case "largeTrade":
      category = "Large Trade";
      sentence = `A ${savedTokenSymbol} trader just `;
      break;
    case "smartMoney":
      category = "Smart Money";
      sentence = `A ${savedTokenSymbol} top trader just `;
      break;
    case "whaleMovement":
      category = "Whale Movement";
      sentence = `A ${savedTokenSymbol} whale just `;
      break;
    default:
      sentence = `Transaction detected: `;
  }

  const summary = {
    sentence,
    category,
    baseTokenSummary: `
      <strong>
        ${
          isBuy
            ? '<span class="positive">bought</span>'
            : '<span class="negative">sold</span>'
        }
        <span class="usd-amount">${formatAsUSD(
          transaction.totalValueUsd
        )}</span>
      </strong> 
      of 
      <a href="https://moralis.com/chain/ethereum/token/price/${
        baseToken.address
      }" target="_blank" rel="noreferrer">
        ${
          baseToken.logo
            ? `<img src="${baseToken.logo}" width="20" alt="${baseToken.symbol}" />`
            : ""
        }
        <strong>${baseToken.symbol} </strong>
      </a> 
      (
      <span class="${isBuy ? "buy" : "sell"}">
        ${isBuy ? "+" : ""}${formatPriceNumber(baseToken.amount)}
      </span>
      )
    `,
  };

  return summary;
};
