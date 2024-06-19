import React, { useState, useEffect } from "react";
import { useData } from "../../DataContext";
import moment from "moment";
import { UncontrolledTooltip } from "reactstrap";
import HistoryItem from "./HistoryItem";
import HistoryIcon from "./HistoryIcon";
import TransactionImage from "./TransactionImage";
import HistoryCategory from "./HistoryCategory";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionItem,
} from "reactstrap";

const HistoryAccordionItem = ({ item }) => {
  const { globalDataCache, setGlobalDataCache } = useData();

  return (
    <AccordionItem>
      <AccordionHeader targetId={item.hash}>
        <div className="history-item">
          <div className="history-icon">
            <HistoryIcon category={item.category} />
            <img
              className="mini-chain regular"
              src={`/images/${item.chain}-icon.png`}
            />
          </div>
          <div className="history-category">
            <div className="category">
              <HistoryCategory category={item.category} />
              {item.possible_spam && (
                <>
                  <svg
                    id={`tooltip-${item.hash}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#f7a600"
                    width="17"
                  >
                    <path
                      d="M16.619,3H7.381C7.024,3,6.694,3.191,6.515,3.5l-4.618,8c-0.179,0.309-0.179,0.691,0,1l4.618,8 C6.694,20.809,7.024,21,7.381,21h9.238c0.357,0,0.687-0.191,0.866-0.5l4.618-8c0.179-0.309,0.179-0.691,0-1l-4.618-8 C17.306,3.191,16.976,3,16.619,3z M12,17L12,17c-0.552,0-1-0.448-1-1v0c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v0 C13,16.552,12.552,17,12,17z M12,13L12,13c-0.552,0-1-0.448-1-1V8c0-0.552,0.448-1,1-1h0c0.552,0,1,0.448,1,1v4 C13,12.552,12.552,13,12,13z"
                      fill="#f7a600"
                    />
                  </svg>
                  <UncontrolledTooltip
                    target={`tooltip-${item.hash}`}
                    placement="top"
                  >
                    Spam contract
                  </UncontrolledTooltip>
                </>
              )}
            </div>
            <div className="timestamp">
              {moment(item.block_timestamp).fromNow()}
            </div>
          </div>
          <div className="history-action">
            <div className="history-image">
              <TransactionImage
                transaction={item}
                chain={globalDataCache.selectedChain}
              />
            </div>
            <div className="history-info">
              <div className="label">
                {item.summary}{" "}
                {item.category === "contract interaction"
                  ? item.method_label
                    ? `: ${item.method_label}()`
                    : `: unknown`
                  : ""}
              </div>
              {item.category === "approve" && (
                <div className="secondary-line">
                  Spender:{" "}
                  {item.contract_interactions.approvals
                    ? item.contract_interactions.approvals[0].spender.address
                    : item.contract_interactions.set_approvals_all[0].spender
                        .address}
                </div>
              )}

              <div className="secondary-line">
                Transaction hash: {item.hash}
              </div>
            </div>
          </div>
        </div>
      </AccordionHeader>
      <AccordionBody accordionId={item.hash}>
        <HistoryItem transaction={item} />
      </AccordionBody>
    </AccordionItem>
  );
};

export default HistoryAccordionItem;
