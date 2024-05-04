import * as utilities from '../../utilities.js';
import CopyToClipboard from '../Misc/CopyToClipboard';

const HistoryItemv2 = ({ transaction }) => {
    // Function to get the image URL
    const image = (transfer) => {
        if (transfer.data && transfer.data.media && transfer.data.media.media_collection && transfer.data.media.media_collection.medium) {
            return transfer.data.media.media_collection.medium.url;
        } else if (transfer.normalized_metadata && transfer.normalized_metadata.image) {
            return transfer.normalized_metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
        } else {
            return `/images/nft-placeholder.svg`;
        }
    }

    // Function to render a single summary item
    const renderSummaryItem = (label, value) => (
        <li>
            <div className="data-point">{label}</div>
            <div className="value">{value}</div>
        </li>
    );

    // Function to render the transaction summary
    const renderTransactionSummary = () => (
        <div className="tx-summary tx-details">
            <div className="title">Transaction Summary</div>
            <ul>
                <li>
                    <div className="data-point">Transaction Hash</div>
                    <div className="value copy-container">{transaction?.hash}
                        <CopyToClipboard valueToCopy={transaction?.hash}>
                            <button></button>
                        </CopyToClipboard>
                    </div>
                </li>
                {renderSummaryItem('Block Number', transaction?.block_number)}
                {renderSummaryItem('Timestamp', transaction?.block_timestamp)}
                {renderSummaryItem('Gas Price', transaction.gas_price)}
                {renderSummaryItem('Gas Used', transaction.receipt_gas_used)}
                {renderSummaryItem('Gas Paid', Number(transaction.gas_price)*Number(transaction.receipt_gas_used))}
                {renderSummaryItem('Transaction Type', transaction?.category)}
                {renderSummaryItem('Transaction Method', transaction?.method_label)}
                {renderSummaryItem('From Address', transaction.from_address_label ? transaction.from_address_label : transaction.from_address)}
                {renderSummaryItem('To Address', transaction.to_address_label ? transaction.to_address_label : transaction.to_address)}
                {renderSummaryItem('Native Transfers', transaction.native_transfers ? transaction.native_transfers.length : 0)}
                {renderSummaryItem('Token Transfers (ERC20)', transaction?.erc20_transfers.length)}
                {renderSummaryItem('NFT Transfers', transaction?.nft_transfers.length)}
                {renderSummaryItem('Approvals', transaction.approvals ? transaction.approvals.length : 0)}
                {renderSummaryItem('Internal Transactions', transaction.internal_transactions ? transaction.internal_transactions.length : 0)}
            </ul>
        </div>
    );

    // Function to render the list of NFTs based on the action
    const renderNFTList = (action) => {
        if(action === "send") {
            return transaction?.nft_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.data?.token_id ?? item.token_id ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${image(item)})` }}></div>
                        <div>
                        <div>{item.data?.name ?? utilities.shortAddress(item.token_address)} #{item.data?.token_id ?? item.token_id}</div>
                        <div className="secondary-line">
                            to {utilities.shortAddress(item.to_address)}
                            {item.to_address === "0x0000000000000000000000000000000000000000" && (
                                <span className="burn">Burn</span>
                            )}
                        </div>
                        </div>
                    
                </li>
            ));
        } else {
            return transaction?.nft_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.data?.token_id ?? item.token_id ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${image(item)})` }}></div>
                    <div>
                        <div>{item.data?.name ?? utilities.shortAddress(item.token_address)} #{item.data?.token_id ?? item.token_id}</div>
                        <div className="secondary-line">
                        from {utilities.shortAddress(item.from_address)}
                        {item.from_address === "0x0000000000000000000000000000000000000000" && (
                            <span className="mint">Mint</span>
                        )}
                        </div>
                        
                   </div>
                </li>
            ));
        }
    };

    const renderTokenList = (action) => {
        if(action === "sent") {
            return transaction?.erc20_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.address ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${item.token_logo})` }}></div>
                    <div>
                        {item.value_formatted} {item.token_symbol}
                        <div>to {utilities.shortAddress(item.to_address)}</div>
                    </div>
                    
                </li>
            ));
        } else {
            return transaction?.erc20_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.address ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${item.token_logo})` }}></div>
                    <div>{item.value_formatted} {item.token_name}</div>
                    <div>from {utilities.shortAddress(item.from_address)}</div>
                </li>
            ));
        }
        
    };

    const renderNativeList = (action) => {
        if(action === "sent") {
            return transaction?.native_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.address ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${item.token_logo})` }}></div>
                    <div>
                        <div>{item.value_formatted} {item.token_symbol} {item.internal_transaction && <span>(via internal tx)</span>}</div>
                        <div className="secondary-line">to {utilities.shortAddress(item.to_address)}</div>
                    </div>
                </li>
            ));
        } else {
            return transaction?.native_transfers?.filter(item => item.direction === action).map((item, index) => (
                <li key={item.address ?? index}>
                    <div className="image" style={{ backgroundImage: `url(${item.token_logo})` }}></div>
                    <div>
                        <div>{item.value_formatted} {item.token_symbol} {item.internal_transaction && <span>(via internal tx)</span>}</div>
                        <div className="secondary-line">from {utilities.shortAddress(item.from_address)}</div>
                    </div>
                </li>
            ));
        }
        
    };

    const renderInternalTxs = () => {
        return (
            <div className="tx-details tx-summary internal-txs">
            <div className="title">Internal Transactions</div>
            <div>

                {(transaction?.internal_transactions && transaction?.internal_transactions.length > 0) && (
                    <ul>
                    {transaction?.internal_transactions?.map((item, index) => (
                        <li key={item.id ?? index}>
                            <div className="heading-group">
                                <div className="heading">To address</div>
                                <div className="value">{utilities.shortAddress(item.to)}</div>
                            </div>
    
                            <div className="heading-group">
                                <div className="heading">From address</div>
                                <div className="value">{utilities.shortAddress(item.from)}</div>
                            </div>
    
                            <div className="heading-group">
                                <div className="heading">Value</div>
                                <div className="value">{item.value}</div>
                            </div>
    
                        </li>
                    ))}
                    </ul>
                )}
                
            </div>

            {(!transaction?.internal_transactions || transaction?.internal_transactions.length === 0) && (
                <p>No internal transactions.</p>
            )}
        </div>
        )
    };


    // Function to render the asset movements section
    const renderAssetMovements = () => (
        <div className="tx-details tx-summary wallet-card">
            <div className="title">Asset Movements</div>
            <div className="tx-detail">
                <div className="sent">
                    <div className="heading">Sent</div>
                    <ul>
                        {renderNFTList("send")}
                        {renderTokenList("send")}
                        {renderNativeList("send")}
                    </ul>
                </div>
                <div className="receive">
                <div className="heading">Received</div>
                    <ul>
                        {renderNFTList("receive")}
                        {renderTokenList("receive")}
                        {renderNativeList("receive")}
                    </ul>
                </div>
            </div>
        </div>
    );


    const renderInteractedAddresses = () => (
        <div className="tx-details tx-summary">
            <div className="title">Unique Addresses in this Transaction</div>
            <div>
             {(transaction.uniqueAddresses && transaction.uniqueAddresses.length > 0) && (
                    <ul>
                    {transaction.uniqueAddresses?.map((item, index) => (
                        <li key={item.id ?? index}>
                            {item}
                        </li>
                    ))}
                    </ul>
                )}
            </div>
        </div>
    );
    

    return (
        <>
            {renderTransactionSummary()}
            {renderAssetMovements()}
            {/* {renderInteractedAddresses()}
            {renderInternalTxs()} */}
        </>
    );
};

export default HistoryItemv2;