import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AnchorAmmQ425 } from "../target/types/anchor_amm_q4_25";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { SystemProgram } from "@solana/web3.js";

describe("Anchor AMM", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorAmmQ425 as Program<AnchorAmmQ425>;
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  let config: anchor.web3.PublicKey;
  let mintX: anchor.web3.PublicKey;
  let mintY: anchor.web3.PublicKey;
  let vaultX: anchor.web3.PublicKey;
  let vaultY: anchor.web3.PublicKey;
  let userXAccount: anchor.web3.PublicKey;
  let userYAccount: anchor.web3.PublicKey;
  let mintLp: anchor.web3.PublicKey;
  let userLp: anchor.web3.PublicKey;

  const seed = new BN(Math.floor(Math.random() * 1000000));
  const fee = 30;
  const initialMintAmount = 1_000_000_000

  before(async () => {
    mintX = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6,
    );

    mintY = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6,
    );

    const userXAta = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      mintX,
      wallet.publicKey,
    );
    userXAccount = userXAta.address;

    const userYAta = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      mintY,
      wallet.publicKey,
    );
    userYAccount = userYAta.address;

    await mintTo(
      connection,
      wallet.payer,
      mintX,
      userXAccount,
      wallet.publicKey,
      initialMintAmount,
    );

    await mintTo(
      connection,
      wallet.payer,
      mintY,
      userYAccount,
      wallet.publicKey,
      initialMintAmount,
    );

    [config] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
      program.programId,
    );

    [mintLp] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), config.toBuffer()],
      program.programId,
    );

    vaultX = await getAssociatedTokenAddress(mintX, config, true);
    vaultY = await getAssociatedTokenAddress(mintY, config, true);
  });

  describe("Initialize Pool", () => {
    it("Initializing AMM pool", async () => {
      await program.methods
        .initialize(seed, fee, null)
        .accounts({
          initializer: wallet.publicKey,
          mintX,
          mintY,
          config,
          mintLp,
          vaultX,
          vaultY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const configAccount = await program.account.config.fetch(config);
      assert.equal(configAccount.seed.toString(), seed.toString());
      assert.equal(configAccount.fee, fee);
      assert.equal(configAccount.locked, false);
    });
  });

  describe("Deposit in AMM", () => {
    it("First deposit", async () => {
      const LpAmount = new BN(100_000000);
      const maxX = new BN(100_000000);
      const maxY = new BN(100_000000);

      const userLpAta = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet.payer,
        mintLp,
        wallet.publicKey,
      );
      userLp = userLpAta.address;

      await program.methods
        .deposit(LpAmount, maxX, maxY)
        .accounts({
          user: wallet.publicKey,
          config,
          mintLp,
          vaultX,
          vaultY,
          userX: userXAccount,
          userY: userYAccount,
          userLp,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const userLpAccount = await getAccount(connection, userLp);
      const vaultXAccount = await getAccount(connection, vaultX);
      const vaultYAccount = await getAccount(connection, vaultY);
      assert.equal(userLpAccount.amount.toString(), LpAmount.toString());
      assert.equal(vaultXAccount.amount.toString(), maxX.toString());
      assert.equal(vaultYAccount.amount.toString(), maxY.toString());
    });
  });

  describe("Subsequent Deposit", () => {
    it("Subsequent deposits", async () => {
      const depositAmount = new BN(50_000000);
      const maxX = new BN(60_000000);
      const maxY = new BN(60_000000);

      const userLpBefore = await getAccount(connection, userLp);

      await program.methods
        .deposit(depositAmount, maxX, maxY)
        .accounts({
          user: wallet.publicKey,
          config,
          mintLp,
          vaultX,
          vaultY,
          userX: userXAccount,
          userY: userYAccount,
          userLp,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const userLpAfter = await getAccount(connection, userLp);
      const lpDiff = Number(userLpAfter.amount) - Number(userLpBefore.amount);
      assert.equal(lpDiff, Number(depositAmount));
    });
  });

  describe("Swapping Tokens", () => {
    it("Swapping Token X for Token Y", async () => {
      const swapAmount = new BN(10_000000);
      const minAmountOut = new BN(9_000000);

      const userXBefore = await getAccount(connection, userXAccount);
      const userYBefore = await getAccount(connection, userYAccount);

      await program.methods
        .swap(true, swapAmount, minAmountOut)
        .accounts({
          user: wallet.publicKey,
          mintX,
          mintY,
          config,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          mintLp,
          vaultX,
          vaultY,
          userX: userXAccount,
          userY: userYAccount,
          userLp,
        })
        .rpc();

      const userXAfter = await getAccount(connection, userXAccount);
      const userYAfter = await getAccount(connection, userYAccount);
      const xDiff = Number(userXBefore.amount) - Number(userXAfter.amount);
      const yDiff = Number(userYAfter.amount) - Number(userYBefore.amount);

      assert.equal(xDiff, Number(swapAmount));
      assert(yDiff > Number(minAmountOut));
    });

    it("Swapping Token Y for Token X", async () => {
      const swapAmount = new BN(10_000000);
      const minAmountOut = new BN(9_000000);
  
      const userXBefore = await getAccount(connection, userXAccount);
      const userYBefore = await getAccount(connection, userYAccount);
  
      await program.methods
        .swap(false, swapAmount, minAmountOut)
        .accounts({
          user: wallet.publicKey,
          mintX,
          mintY,
          config,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          mintLp,
          vaultX,
          vaultY,
          userX: userXAccount,
          userY: userYAccount,
          userLp,
        })
        .rpc();
  
      const userXAfter = await getAccount(connection, userXAccount);
      const userYAfter = await getAccount(connection, userYAccount);
      const xDiff = Number(userXAfter.amount) - Number(userXBefore.amount);
      const yDiff = Number(userYBefore.amount) - Number(userYAfter.amount);
  
      assert.equal(yDiff, Number(swapAmount));
      assert(xDiff > Number(minAmountOut));
    });
  });


  describe("Withdraw Liquidity", () => {
    it("Should withdraw partial liquidity", async () => {
      const withdrawAmount = new BN(50_000000);
      const minX = new BN(30_000000);
      const minY = new BN(30_000000);

      const userLpBefore = await getAccount(connection, userLp);
      const userXBefore = await getAccount(connection, userXAccount);
      const userYBefore = await getAccount(connection, userYAccount);

      await program.methods
        .withdraw(withdrawAmount, minX, minY)
        .accounts({
          user: wallet.publicKey,
          mintX,
          mintY,
          config,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          mintLp,
          vaultX,
          vaultY,
          userX: userXAccount,
          userY: userYAccount,
          userLp,
        })
        .rpc();

      const userLpAfter = await getAccount(connection, userLp);
      const lpBurned = Number(userLpBefore.amount) - Number(userLpAfter.amount);
      
      const userXAfter = await getAccount(connection, userXAccount);
      const userYAfter = await getAccount(connection, userYAccount);
      
      const xReceived = Number(userXAfter.amount) - Number(userXBefore.amount);
      const yReceived = Number(userYAfter.amount) - Number(userYBefore.amount);
      
      assert.equal(lpBurned, Number(withdrawAmount));
      assert(xReceived > Number(minX));
      assert(yReceived > Number(minY));
    });
  });

  describe("Error Cases", () => {
    it("Should fail when swapping with insufficient slippage tolerance", async () => {
      const swapAmount = new BN(50_000000);
      const minAmountOut = new BN(1_000_000_000000);

      try {
        await program.methods
          .swap(true, swapAmount, minAmountOut)
          .accounts({
            user: wallet.publicKey,
            mintX,
            mintY,
            config,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mintLp,
            vaultX,
            vaultY,
            userX: userXAccount,
            userY: userYAccount,
            userLp,
          })
          .rpc();
        assert.fail("Should have thrown slippage error");
      } catch (error) {}
    });

    it("Should fail on depositing zero amount", async () => {
      try {
        await program.methods
          .deposit(new BN(0), new BN(100), new BN(100))
          .accounts({
            user: wallet.publicKey,
            mintX,
            mintY,
            config,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mintLp,
            vaultX,
            vaultY,
            userX: userXAccount,
            userY: userYAccount,
            userLp,
          })
          .rpc();
        assert.fail("Should have thrown invalid amount error");
      } catch (error) {}
    });

    it("Should fail when withdrawing LP tokens", async () => {
      const userLpAccount = await getAccount(connection, userLp);
      const LpAmount_exceed = new BN(Number(userLpAccount.amount) + 1000000);

      try {
        await program.methods
          .withdraw(LpAmount_exceed, new BN(0), new BN(0))
          .accounts({
            user: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mintX,
            mintY,
            config,
            mintLp,
            vaultX,
            vaultY,
            userX: userXAccount,
            userY: userYAccount,
            userLp,
          })
          .rpc();
        assert.fail("Insufficient balance error");
      } catch (error) {}
    });
  });

});
