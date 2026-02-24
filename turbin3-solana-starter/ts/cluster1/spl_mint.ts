import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import wallet from "../turbin3-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const token_decimals = 1_000_000n;

// Mint address
const mint = new PublicKey("BxvfEgFcL8PkFCTAAk2pn2GCkRUXn7H4QA5n2iTGmUqv");

(async () => {
    try {
        // Create an ATA
        const ata = await getOrCreateAssociatedTokenAccount(connection,keypair,
            mint,keypair.publicKey
        )
        console.log(`Your ata is: ${ata.address.toBase58()}`);
        // Your ata is: EESnuVuC8wMB9TRHxNYDtyYjjhKA1cU5rKLQmPAJAh9v

        // Mint to ATA
        const mintTx = await mintTo(connection,keypair,mint,ata.address,keypair.publicKey,token_decimals);
        console.log(`Your mint txid: ${mintTx}`);
        // Your mint txid: 4UcnSQ6QFtmi3gmGPN1L3rTTGwYg2juQbMJMz1debPTauPzG5yA99bHxQ6bERSS4iuSK7R1K9HvZK8X9EYBBmsgc
        
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
