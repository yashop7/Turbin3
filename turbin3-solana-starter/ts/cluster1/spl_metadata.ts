import wallet from "../turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
    createMetadataAccountV3, 
    CreateMetadataAccountV3InstructionAccounts, 
    CreateMetadataAccountV3InstructionArgs,
    DataV2Args
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// Define our Mint address
const mint = publicKey("BxvfEgFcL8PkFCTAAk2pn2GCkRUXn7H4QA5n2iTGmUqv")

// Create a UMI connection
const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
    try {

        let accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint,
            mintAuthority : signer,
        }

        let data: DataV2Args = {
            name : "YASH",
            symbol : "YS",
            uri : "https://devnet.irys.xyz/5YdHo8vFMFwPDpiiDyjpCPTy6NvRdH8ed5KnHwWLE5py",
            sellerFeeBasisPoints: 20,
            creators : null,
            collection: null,
            uses : null
        }

        let args: CreateMetadataAccountV3InstructionArgs = {
            data,
            isMutable : true,
            collectionDetails : null
        }

        let tx = createMetadataAccountV3(
            umi,
            {
                ...accounts,
                ...args
            }
        )

        let result = await tx.sendAndConfirm(umi);
        console.log(bs58.encode(result.signature));
        // 92o48jgv6jDHtVqj9tkLoG2rcYWZmG5dK3wbp4dev2E7bvJzzW7Ed2izabTmodrjh1A6HScMuPwDVSzw6sFdjYS
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
