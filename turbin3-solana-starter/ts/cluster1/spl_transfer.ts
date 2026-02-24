import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "../turbin3-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("BxvfEgFcL8PkFCTAAk2pn2GCkRUXn7H4QA5n2iTGmUqv");

// Recipient address
const to = new PublicKey("2hM8rU9Cu7g3cSfC7C76t41sMcceWUgnxCgmjznMnwJc");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromATA = await getOrCreateAssociatedTokenAccount(
            connection,keypair,mint,keypair.publicKey
        )
        // Get the token account of the toWallet address, and if it does not exist, create it
        const toATA = await getOrCreateAssociatedTokenAccount(
            connection,keypair,mint,to
        )
        // Transfer the new token to the "toTokenAccount" we just created
        const signature = await transfer(
            connection,
            keypair,
            fromATA.address,
            toATA.address,
            keypair.publicKey,
            100000n
        )
        console.log(`Transfer transaction signature: ${signature}`);
        // Transfer transaction signature: 22hG7tCWNGr8XfuvGYipvnU1jJS7VmuR2zX8fBK52RN5NRgbBMzLgUXqg39kM3oaBgBxvpeiU8Me5pPYUt6ad5G6
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();