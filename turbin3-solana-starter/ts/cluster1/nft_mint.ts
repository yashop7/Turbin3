import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../turbin3-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

const mint = generateSigner(umi);

(async () => {
    let tx = createNft(umi, {
        mint,
        name: "Yash G",
        symbol: "YG",
        uri: "https://gateway.irys.xyz/H2Ua9kX4Jz74qmTzNSJW2UsxSA9VWfzDipnmBquN24gW",
        sellerFeeBasisPoints: percentAmount(20),
    });
    
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);
    
    console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)
    // Succesfully Minted! Check out your TX here: https://explorer.solana.com/tx/5LTPW8zJjUfpCWrXpEu4zseaN5UvZLGe4SGTxabXeMS4otHvdEKAvYkX4MAfrYUMM2Ch73qSjLnXsJY7hnZCjts5?cluster=devnet

    console.log("Mint Address: ", mint.publicKey);
    // Mint Address:  BVJvvb8yTYRQgc6Hoy4UZgpcNuGgA8esne49Sqfncegh
})();