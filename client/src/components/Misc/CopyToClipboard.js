import React, { useState } from "react";

const CopyToClipboard = ({ valueToCopy }) => {
  const [buttonContent, setButtonContent] = useState(
    <svg
      width="15"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#ffffff"
    >
      <path
        d="M 4 2 C 2.895 2 2 2.895 2 4 L 2 18 L 4 18 L 4 4 L 18 4 L 18 2 L 4 2 z M 8 6 C 6.895 6 6 6.895 6 8 L 6 20 C 6 21.105 6.895 22 8 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 8 C 22 6.895 21.105 6 20 6 L 8 6 z M 8 8 L 20 8 L 20 20 L 8 20 L 8 8 z"
        fill="#ffffff"
      />
    </svg>
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(valueToCopy);
      setButtonContent(
        <svg
          width="15"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 50 50"
          fill="#ffffff"
        >
          <path
            d="M 41.9375 8.625 C 41.273438 8.648438 40.664063 9 40.3125 9.5625 L 21.5 38.34375 L 9.3125 27.8125 C 8.789063 27.269531 8.003906 27.066406 7.28125 27.292969 C 6.5625 27.515625 6.027344 28.125 5.902344 28.867188 C 5.777344 29.613281 6.078125 30.363281 6.6875 30.8125 L 20.625 42.875 C 21.0625 43.246094 21.640625 43.410156 22.207031 43.328125 C 22.777344 43.242188 23.28125 42.917969 23.59375 42.4375 L 43.6875 11.75 C 44.117188 11.121094 44.152344 10.308594 43.78125 9.644531 C 43.410156 8.984375 42.695313 8.589844 41.9375 8.625 Z"
            fill="#ffffff"
          />
        </svg>
      );
      setTimeout(() => {
        setButtonContent(
          <svg
            width="15"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#ffffff"
          >
            <path
              d="M 4 2 C 2.895 2 2 2.895 2 4 L 2 18 L 4 18 L 4 4 L 18 4 L 18 2 L 4 2 z M 8 6 C 6.895 6 6 6.895 6 8 L 6 20 C 6 21.105 6.895 22 8 22 L 20 22 C 21.105 22 22 21.105 22 20 L 22 8 C 22 6.895 21.105 6 20 6 L 8 6 z M 8 8 L 20 8 L 20 20 L 8 20 L 8 8 z"
              fill="#ffffff"
            />
          </svg>
        );
      }, 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <button
      className="copy"
      onClick={(event) => {
        event.stopPropagation(); // Prevent the click from propagating to the parent <tr>
        copyToClipboard();
      }}
    >
      {buttonContent}
    </button>
  );
};

export default CopyToClipboard;
