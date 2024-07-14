import React, { useCallback, useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import {
    WalletProvider,
    ConnectionProvider,
    useWallet
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

const App = () => {
    return (
        <ConnectionProvider endpoint={clusterApiUrl('devnet')}>
            <WalletProvider wallets={[new PhantomWalletAdapter()]}>
                <WalletModalProvider>
                    <WalletMultiButton />
                    <TransferComponent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const TransferComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        const checkBalance = async () => {
            if (!publicKey) {
                return;
            }

            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            try {
                const balance = await connection.getBalance(publicKey);
                setBalance(balance / LAMPORTS_PER_SOL); // Chuyển đổi Lamports sang SOL
            } catch (error) {
                console.error('Error fetching balance:', error);
                setBalance(null);
            }
        };

        checkBalance();
    }, [publicKey]);

    const handleTransfer = useCallback(async () => {
        if (!publicKey) {
            alert('Connect your wallet first!');
            return;
        }

        let recipientPubKey;
        try {
            recipientPubKey = new PublicKey(recipient); // Validate recipient address
        } catch (e) {
            alert('Invalid recipient address');
            return;
        }

        const amountInSOL = parseFloat(amount);
        if (isNaN(amountInSOL) || amountInSOL <= 0) {
            alert('Invalid amount');
            return;
        }

        if (amountInSOL > balance) {
            alert('Insufficient balance');
            return;
        }

        const amountInLamports = amountInSOL * LAMPORTS_PER_SOL;

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

        try {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: recipientPubKey,
                    lamports: amountInLamports,
                })
            );

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');
            alert(`Transfer successful! Signature: ${signature}`);
        } catch (error) {
            console.error('Transfer failed', error);
            alert(`Transfer failed: ${error.message}`);
        }
    }, [publicKey, recipient, amount, sendTransaction, balance]);

    return (
        <div>
            <h2>Transfer SOL</h2>
            {publicKey ? (
                <p>Balance: {balance !== null ? balance + ' SOL' : 'Loading...'}</p>
            ) : (
                <p>Connect your wallet to check balance</p>
            )}
            <input
                type="text"
                placeholder="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
            />
            <input
                type="number"
                placeholder="Amount (SOL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleTransfer}>Transfer</button>
        </div>
    );
};

export default App;
