import React from 'react';
import TransactionImage from './TransactionImage';
import SimpleCategory from './SimpleCategory';
import moment from 'moment';


function UniswapTimeline({ transactions }) {
    
    // transactions = transactions.filter(t => !t.possible_spam);
  // Group transactions by date_category
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const { date_category } = transaction;
    if (!acc[date_category]) {
      acc[date_category] = [];
    }
    acc[date_category].push(transaction);
    return acc;
  }, {});

  function formatRelativeTime(pastDate) {
    const now = moment();
    const past = moment(pastDate);
    const duration = moment.duration(now.diff(past));
  
    const minutes = duration.asMinutes();
    const days = duration.asDays();
    const weeks = duration.asWeeks();
    const months = duration.asMonths();
    const years = duration.asYears();
  
    if (minutes < 60) {
      return `${Math.floor(minutes)}min`;
    } else if (days < 1) {
      return `${Math.floor(minutes / 60)}h`;
    } else if (days < 7) {
      return `${Math.floor(days)}d`;
    } else if (weeks < 4) {
      return `${Math.floor(weeks)}w`;
    } else if (months < 12) {
      return `${Math.floor(months)}mo`;
    } else {
      return `${Math.floor(years)}y`;
    }
  }

  return (
    <>
    <ul className="timeline uniswap">
      {Object.entries(groupedTransactions).map(([date, transactions]) => (
        <div key={date} className="timeline-date-group">
          <div className="date-heading">{date}</div>
          {transactions.map((item, index) => (
          

            <li key={index} className="uniswap-item">
                <div className="history-icon">
                    <TransactionImage transaction={item} chain={item.chain} />
                    <img className="mini-chain" src={`/images/${item.chain}-icon.png`}/>
                </div>
                <div className="tx-detail">
                    <div className="tx-category">
                        <SimpleCategory category={item.category} />
                    </div>
                    <div className="summary">{item.summary}</div>
                </div>
                <div className="date">{formatRelativeTime(item.block_timestamp)}</div>
            </li>
          ))}
        </div>
      ))}
    </ul>
    </>
  );
}

export default UniswapTimeline;