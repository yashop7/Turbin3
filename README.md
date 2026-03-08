# Turbin3 Solana Development

This repository contains a comprehensive collection of Solana smart contracts developed during the Turbin3 Q1 2025 cohort. The projects demonstrate proficiency in Rust and the Anchor framework, implementing various blockchain primitives and DeFi protocols on Solana.

## About

Turbin3 is an intensive Solana development program focused on building production-ready smart contracts. Through this cohort, I developed expertise in secure program architecture using Rust and Anchor, with emphasis on PDAs, CPIs, and Solana-specific security patterns.

## Projects

### Anchor Vault Program
A foundational vault program demonstrating core Solana concepts:
- Program Derived Addresses (PDAs) for secure account management
- SOL deposit and withdrawal mechanisms
- Account initialization and closure patterns

### Anchor Escrow Program
A trustless escrow system for SPL token swaps:
- Maker/Taker swap model
- Token vault management using PDAs
- Refund mechanism for cancelled trades
- Secure token handling and account ownership patterns

### Anchor AMM (Automated Market Maker)
A decentralized exchange implementing constant product formula:
- Liquidity pool creation and management
- Token swap functionality
- LP token minting and burning
- DeFi primitives on Solana

### Anchor Dice Game
An on-chain casino game showcasing:
- Randomness in blockchain applications
- State management for game sessions
- Probability-based outcomes
- User bet and payout handling

### NFT Staking Program
A complete NFT staking platform:
- Stake NFTs to earn rewards
- Time-based reward calculation
- NFT custody and secure transfers
- Integration with Metaplex standards

### MPL Core Integration
Working with Metaplex Core for NFT operations:
- NFT minting and metadata management
- Collection handling
- Metaplex program architecture

### Quadratic Funding Contract
A public goods funding mechanism:
- Quadratic funding algorithm implementation
- Multi-contributor donation tracking
- Democratic resource allocation

## Tech Stack

- **Language**: Rust
- **Framework**: Anchor (v0.32.1+)
- **Blockchain**: Solana
- **Testing**: TypeScript/JavaScript with Anchor Test Framework
- **Tools**: Solana CLI, Anchor CLI, Surfpool
- **Token Standards**: SPL Token, Metaplex

## Project Structure

```
├── turbin3-solana-starter/     # Initial exercises and prerequisites
│   ├── ts/                     # TypeScript basics and cluster1 tasks
│   └── rs/                     # Rust fundamentals
├── anchor-vault-starter-q4-25/
├── anchor-escrow-starter-q4-25/
├── anchor-amm-starter-q4-25/
├── anchor-dice-game-starter-q4-25/
├── anchor-nft-staking-starter-q4-25/
├── anchor-mplxcore-starter-q4-25/
└── anchor-quadratic-funding-contract/
```

## Getting Started

All projects are built with Anchor and include comprehensive test suites. Navigate to any project directory to run tests.

### Testing with Surfpool
```bash
# Terminal 1: Start local validator
surfpool start

# Terminal 2: Run tests
anchor test --skip-local-validator
```

### Standard Testing
```bash
anchor test
```

## Technical Highlights

- **Security Patterns**: Implementation of secure Solana programs with protection against common vulnerabilities including missing signer checks, integer overflow, and reinitialization attacks
- **Program Derived Addresses**: Advanced use of PDAs for secure, deterministic account generation and program authority
- **Optimized State Management**: Efficient program design minimizing compute units and rent costs
- **Cross-Program Invocations**: Building composable programs through CPIs and inter-program communication
- **DeFi Primitives**: Implementation of core DeFi mechanisms including AMMs, liquidity pools, and token economics
- **Comprehensive Testing**: Full integration test suites for all programs using Anchor's testing framework

## Prerequisites

To run these projects locally:

1. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. Install Solana CLI: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`
3. Install Anchor via AVM: `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`
4. Install Node.js and Yarn
5. (Optional) Install Surfpool: `brew install surfpool`

## Resources

- [Turbin3 Program](https://turbin3.com)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Library](https://spl.solana.com/)

---

*Built during Turbin3 Q1 2025 Cohort*