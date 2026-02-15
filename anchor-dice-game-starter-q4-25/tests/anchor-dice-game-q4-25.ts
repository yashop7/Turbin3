import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorDiceGameQ425 } from "../target/types/anchor_dice_game_q4_25";
import { expect, assert } from "chai";

describe("Dice Betting Protocol Test", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const conection = provider.connection;
  const program = anchor.workspace
    .AnchorDiceGameQ425 as Program<AnchorDiceGameQ425>;

  const house = provider.wallet;
  let player = anchor.web3.Keypair.generate();

  let seed = new anchor.BN(1);
  const vaultPda = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), house.publicKey.toBuffer()],
    program.programId,
  )[0];

  const betPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("bet"),
      vaultPda.toBuffer(),
      seed.toArrayLike(Buffer, "le", 16),
    ],
    program.programId,
  )[0];

  before(async () => {
    await provider.connection.requestAirdrop(
      player.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL,
    );
  });

  it("Initialise", async () => {
    const initial_amount = new anchor.BN(
      100 * anchor.web3.LAMPORTS_PER_SOL,
    );
    await program.methods
      .initialize(initial_amount)
      .accountsStrict({
        house: house.publicKey,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const vaultBalance = await provider.connection.getBalance(vaultPda);

    assert.equal(vaultBalance, Number(initial_amount));
  });

  it("Placing bet less than 2", async () => {
    const seed = new anchor.BN(2);
    const testBetPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), vaultPda.toBuffer(), seed.toArrayLike(Buffer, "le", 16)],
      program.programId,
    )[0];
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    try {
      await program.methods
        .placeBet(seed, 1, amount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vaultPda,
          bet: testBetPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();
      assert.fail("Expected error for minimum roll");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "MinimumRoll");
    }
  });

  it("Placing bet more than 96", async () => {
    const seed = new anchor.BN(3);
    const testBetPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), vaultPda.toBuffer(), seed.toArrayLike(Buffer, "le", 16)],
      program.programId,
    )[0];
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    try {
      await program.methods
        .placeBet(seed, 97, amount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vaultPda,
          bet: testBetPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();
      assert.fail("Expected error for maximum roll");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "MaximumRoll");
    }
  });

  it("Placing amount less than 0.01", async () => {
    const seed = new anchor.BN(4);
    const testBetPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), vaultPda.toBuffer(), seed.toArrayLike(Buffer, "le", 16)],
      program.programId,
    )[0];
    const amount = new anchor.BN(
      0.005 * anchor.web3.LAMPORTS_PER_SOL,
    );
    try {
      await program.methods
        .placeBet(seed, 50, amount)
        .accountsStrict({
          player: player.publicKey,
          house: house.publicKey,
          vault: vaultPda,
          bet: testBetPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([player])
        .rpc();
      assert.fail("Expected error for minimum bet");
    } catch (error) {
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(err.error.errorCode.code, "MinimumBet");
    }
  });

  it("Placing Bet", async () => {
    const seed = new anchor.BN(1);
    const testBetPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), vaultPda.toBuffer(), seed.toArrayLike(Buffer, "le", 16)],
      program.programId,
    )[0];
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    const beforeVaultBalance = await provider.connection.getBalance(vaultPda);

    await program.methods
      .placeBet(seed, 50, amount)
      .accountsStrict({
        player: player.publicKey,
        house: house.publicKey,
        vault: vaultPda,
        bet: testBetPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const vaultBalance = await provider.connection.getBalance(vaultPda);

    assert.equal(vaultBalance - beforeVaultBalance, Number(amount));
  });


  it("Resolve a bet", async () => {
    const accountInfo = await provider.connection.getAccountInfo(betPda);
    const message = accountInfo.data.subarray(8);

    let signature = anchor.web3.Ed25519Program.createInstructionWithPrivateKey({
      privateKey: (house.payer as anchor.web3.Keypair).secretKey,
      message: message,
    });

    const resolve_tx = await program.methods
      .resolveBet(
        Buffer.from(signature.data.buffer.slice(16 + 32, 16 + 32 + 64)),
      )
      .accountsStrict({
        house: house.publicKey,
        player: player.publicKey,
        vault: vaultPda,
        bet: betPda,
        instructionSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([house.payer])
      .instruction();

    const tx = new anchor.web3.Transaction().add(signature).add(resolve_tx);

    await anchor.web3.sendAndConfirmTransaction(conection, tx, [house.payer]);
  });

  it("Refund a bet", async () => {
    const seed = new anchor.BN(6);
    const testBetPda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), vaultPda.toBuffer(), seed.toArrayLike(Buffer, "le", 16)],
      program.programId,
    )[0];
    const amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    const beforeUserBalance = await provider.connection.getBalance(
      player.publicKey,
    );
    const beforeVaultBalance = await provider.connection.getBalance(vaultPda);
    
    await program.methods
      .placeBet(seed, 50, amount)
      .accountsStrict({
        player: player.publicKey,
        house: house.publicKey,
        vault: vaultPda,
        bet: testBetPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const currentSlot = await provider.connection.getSlot();
    const targetSlot = currentSlot + 1001;
    while ((await provider.connection.getSlot()) < targetSlot) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    await program.methods
      .refundBet()
      .accountsStrict({
        player: player.publicKey,
        house: house.publicKey,
        vault: vaultPda,
        bet: testBetPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([player])
      .rpc();

    const afterUserBalance = await provider.connection.getBalance(
      player.publicKey,
    );
    const afterVaultBalance = await provider.connection.getBalance(vaultPda);

    assert(afterUserBalance - beforeUserBalance > Number(amount) * 0.98);
    assert.equal(beforeVaultBalance - afterVaultBalance, Number(amount));
  });
});
