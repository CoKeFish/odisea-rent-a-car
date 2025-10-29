# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Scaffold Stellar project - a modern toolkit for building Stellar smart contract frontends. It combines Rust-based Soroban smart contracts with a React + TypeScript + Vite frontend.

## Architecture

### Contract Development (Rust/Soroban)

- **Workspace**: Cargo workspace with contracts in `contracts/` directory
- **Contract Structure**: Each contract has its own subdirectory with `src/lib.rs` and `Cargo.toml`
- **Example Contracts**:
  - `guess-the-number`: Game contract demonstrating admin functions, XLM transfers, and PRNG
  - `fungible-allowlist`: Token with allowlist functionality
  - `nft-enumerable`: NFT implementation with enumeration
- **Dependencies**: Uses OpenZeppelin Stellar contracts (v0.3.0-v0.5.0) for access control, tokens, and pausable functionality
- **Build Target**: Rust 1.89.0 with `wasm32v1-none` target for WASM compilation
- **Testing**: Unit tests use `soroban-sdk` testutils with mock auth and cross-contract calls

### Frontend (React + TypeScript)

- **Framework**: React 19 with Vite 7 for development and building
- **Routing**: React Router DOM for client-side routing
- **State Management**: TanStack Query (React Query) for async state
- **Wallet Integration**: `@creit.tech/stellar-wallets-kit` for Stellar wallet connections
- **UI Components**: `@stellar/design-system` for consistent Stellar UI
- **Contract Clients**: Auto-generated TypeScript clients from contracts placed in `packages/` directory

### Development Workflow

- **Auto-generated Clients**: `stellar scaffold watch --build-clients` rebuilds contract clients on changes
- **Contract Configuration**: `environments.toml` defines contracts, constructor args, and initialization scripts per environment
- **Environment Setup**: `.env` file controls network (local/testnet/mainnet) and configuration paths
- **Hot Reload**: Vite dev server with concurrent contract watching for rapid development

### Key Patterns

- **Contract Client Generation**: Contracts with `client = true` in `environments.toml` get TypeScript bindings auto-generated to `packages/*`
- **Constructor Args**: Contracts can specify `constructor_args` for deployment initialization
- **Post-Deploy Scripts**: `after_deploy` field allows running contract methods after deployment
- **Cross-Contract Calls**: Test utilities demonstrate mocking auth for cross-contract interactions (see `guess-the-number/src/test.rs`)
- **Environment Variables**: Prefix with `PUBLIC_` to expose to frontend (e.g., `PUBLIC_STELLAR_NETWORK`)

## Development Commands

### Initial Setup

```bash
# Copy environment configuration
cp .env.example .env

# Install dependencies
npm install
```

### Development

```bash
# Start development server with contract watching and auto-rebuild
npm run dev
# or
npm start

# Both commands run: concurrently "stellar scaffold watch --build-clients" "vite"
```

### Building

```bash
# Build TypeScript clients from contracts
npm run install:contracts

# Build frontend for production
npm run build

# Build contracts with clients (development/testing only)
stellar-scaffold build --build-clients
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting without changes
npx prettier . --check
```

### Testing

```bash
# Run Rust contract tests
cargo test

# Run tests for specific contract
cargo test -p guess-the-number

# Frontend tests (if configured)
npm test --if-present
```

### Contract Deployment

#### Local Development

Contracts are automatically deployed when using `npm run dev` with the `development` environment.

#### Testnet/Mainnet

```bash
# Set environment in .env
STELLAR_SCAFFOLD_ENV=staging  # or production

# Publish contract to registry
stellar registry publish

# Deploy with constructor parameters
stellar registry deploy \
  --deployed-name my-contract \
  --published-name my-contract \
  -- \
  --param1 value1

# Get help for constructor parameters
stellar registry deploy \
  --deployed-name my-contract \
  --published-name my-contract \
  -- \
  --help

# Create local alias for deployed contract
stellar registry create-alias my-contract
```

### Environment Management

Three environments configured in `environments.toml`:

- **development**: Local network with auto-start container
- **staging**: Testnet with test accounts
- **production**: Mainnet with official accounts

Switch environments via `.env`:

```bash
STELLAR_SCAFFOLD_ENV=development  # or staging, production
```

## Technical Notes

### Contract Testing

- Tests use `#[cfg(test)]` modules
- `env.mock_all_auths()` for cross-contract call testing
- `StellarAssetClient` for testing native token interactions
- `env.as_contract()` to call internal functions from test context
- Random seed is deterministic in tests (always same PRNG sequence)

### Build Configuration

- **Release Profile**: Optimized for WASM size (`opt-level = "z"`, LTO enabled, debug stripped)
- **Release-with-logs Profile**: Same optimizations but keeps debug assertions
- **Vite Config**: Node polyfills for Buffer, WASM plugin, Tailwind CSS, ESNext target
- **Environment Prefix**: Only `PUBLIC_` prefixed env vars are exposed to frontend

### Linting & Formatting

- Husky pre-commit hooks run ESLint and Prettier via `lint-staged`
- ESLint config includes React, TypeScript, and React Hooks rules
- Prettier auto-formats on commit for all file types

### Contract Naming Convention

Contract names in `environments.toml` must match the underscored version of the `name` in the contract's `Cargo.toml` (e.g., `guess-the-number` matches `name = "guess-the-number"`).
