# Sosomi - Onchain Scanner

A mobile-first blockchain explorer built with Quasar Framework (Vue 3 + TypeScript), Capacitor for Android, and viem for direct on-chain interactions. Supports both Bitcoin and EVM-compatible chains.

![Sosomi Scanner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6) ![Quasar](https://img.shields.io/badge/Quasar-2.18-1976D2) ![Capacitor](https://img.shields.io/badge/Capacitor-6.x-119EFF)

## ✨ Features

- 🔍 **Universal Search**: Search for transactions and addresses across multiple blockchains
- ⛓️ **Multi-Chain Support**: 
  - **Bitcoin**: Mainnet support via Mempool.space API
  - **EVM Chains**: Ethereum, BNB Chain, Base, Arbitrum, Optimism, Polygon
- 💰 **Comprehensive Wallet Tracking**: 
  - Native balances with USD conversion
  - ERC20 token holdings
  - Bitcoin UTXO tracking
  - Transaction history with pagination
- 📱 **Mobile-Native Design**: 
  - Android APK build via Capacitor
  - Clean, minimalist UI optimized for mobile
  - Touch-friendly interactions
- ⚡ **Direct On-Chain Access**: 
  - No backend, no indexer for EVM chains
  - Direct RPC calls using viem with fallback support
  - Bitcoin data from Mempool.space API with rate limiting
- 🎨 **Modern UI/UX**: 
  - Animated loading states with custom "Loading Monster"
  - QR code display for addresses with chain logos
  - Smooth page transitions
  - Toast notifications
- 💾 **Smart Caching**:
  - Recent searches storage
  - Custom token persistence
  - Queue-based Bitcoin API requests with rate limiting
- 🔄 **Live Price Data**: Real-time cryptocurrency prices from CoinGecko

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (recommended package manager)
- Node.js 20+ (alternative)
- Android Studio (for Android builds)
- Java JDK 17+ (for Android builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/zororaka00/sosomi-app.git
cd onchain-scanner

# Install dependencies
bun install

# Start development server
bun dev
# or
quasar dev

# For Android development
quasar dev -m capacitor -T android

# Build Android APK
quasar build -m capacitor -T android
```

The web app will be available at `http://localhost:9000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BaseCard.vue             # Base card wrapper
│   ├── LoadingMonster.vue       # Animated loading component
│   ├── TokenRow.vue             # Token balance row
│   ├── WalletAddressChip.vue    # Address display chip with copy
│   ├── NetworkSelector.vue      # Chain switcher dropdown
│   ├── QrCodeDialog.vue         # QR code display with chain logo
│   ├── PillButton.vue           # Styled button component
│   └── PillInput.vue            # Styled input component
├── stores/              # Pinia state management
│   ├── chain-store.ts           # EVM chain config & RPC clients
│   ├── bitcoin-store.ts         # Bitcoin API with rate limiting
│   ├── price-store.ts           # Crypto price tracking
│   └── search-store.ts          # Recent searches
├── pages/               # Route pages
│   ├── IndexPage.vue            # Search page (home)
│   ├── AddressDetail.vue        # EVM wallet/contract details
│   ├── TransactionDetail.vue    # EVM transaction details
│   ├── BitcoinAddressDetail.vue # Bitcoin address details
│   └── BitcoinTransactionDetail.vue # Bitcoin transaction details
├── router/              # Vue Router configuration
│   ├── index.ts
│   └── routes.ts
├── css/                 # Global styles & animations
│   ├── app.css                  # Main styles
│   ├── animations.css           # Reusable animations
│   └── transitions.css          # Page transitions
├── assets/              # Static assets (SVG chain logos)
└── boot/                # Quasar boot files
    └── axios.ts                 # Axios instances for APIs

src-capacitor/           # Capacitor native wrapper
├── android/             # Android project files
└── capacitor.config.json
```

## 🎨 Design System

### Color Palette

- **Primary**: `#1976d2` (Blue)
- **Success**: `#21BA45` (Green)
- **Negative**: `#C10015` (Red)
- **Background**: `#fafafa` (Light Gray)
- **Text**: `#111827` (Near Black)

### Typography

- **Font Family**: Roboto (UI), Roboto Mono (Addresses/Hashes)
- **Base Size**: 16px (desktop), 14px (mobile)
- **Headings**: Bold, tight letter-spacing (-0.01em to -0.02em)

### Animations

All animations are defined in `/src/css/animations.css` and `/src/css/transitions.css`:

- `.fade-in` - Smooth fade in
- `.slide-up-soft` - Slide up with fade
- `.scale-on-press` - Interactive button press
- `.hover-lift` - Lift on hover
- `.pulse-light` - Loading pulse effect
- `.stagger-*` - Staggered animations for lists

## 🔧 Configuration

### Supported Chains

#### EVM Chains (Mainnet)
Configured in `src/stores/chain-store.ts`:

```typescript
export const SUPPORTED_CHAINS = {
  ethereum: { 
    chain: mainnet, 
    rpcUrls: ['https://eth.llamarpc.com', ...],
    iconUrl: ethereumIcon 
  },
  bnb: { 
    chain: bsc, 
    rpcUrls: ['https://bsc-dataseed.bnbchain.org', ...],
    iconUrl: bnbIcon 
  },
  base: { chain: base, rpcUrls: [...], iconUrl: baseIcon },
  arbitrum: { chain: arbitrum, rpcUrls: [...], iconUrl: arbitrumIcon },
  optimism: { chain: optimism, rpcUrls: [...], iconUrl: optimismIcon },
  polygon: { chain: polygon, rpcUrls: [...], iconUrl: polygonIcon },
  bitcoin: { 
    rpcUrls: ['https://mempool.space/api'],
    iconUrl: bitcoinIcon 
  }
}
```

**Features**:
- Multiple RPC URLs per chain for failover
- Fallback transport with race mode (fastest response wins)
- Local SVG chain logos in `src/assets/`

#### Bitcoin Configuration
Configured in `src/stores/bitcoin-store.ts`:

```typescript
// Rate limiting
const RATE_LIMIT_DELAY = 3000; // 3 seconds between requests
const RATE_LIMIT_ERROR_DELAY = 5000; // 5 second delay after rate limit error

// Queue-based API requests
// Automatic retry on rate limit (HTTP 429)
```

### Price Data

CoinGecko API integration in `src/stores/price-store.ts`:
- Supported coins: BTC, ETH, BNB, MATIC, ARB, OP
- Auto-refresh every 60 seconds
- USD price conversion

### Quasar Configuration

`quasar.config.ts` includes:
- Capacitor mode for Android builds
- Material Design Icons (MDI)
- Axios plugin for HTTP requests
- LocalStorage plugin for data persistence

## 📱 Usage Examples

### Search for Transaction

Navigate to home and enter a transaction hash:
```
# EVM Transaction
0x1234567890abcdef...

# Bitcoin Transaction
abc123def456...
```

The app auto-detects the format and routes to the appropriate detail page.

### Check Wallet Balance

Enter an address:
```
# EVM Address (starts with 0x)
0xabcdef1234567890...

# Bitcoin Address
bc1q... or 1... or 3...
```

### Add Custom ERC20 Tokens

1. Navigate to any EVM wallet address page
2. Scroll to "Custom Tokens" section
3. Enter ERC20 contract address
4. Click "Add Token"
5. Token will be saved and persist across sessions

### View QR Code

Click the QR icon next to any address to display:
- Scannable QR code
- Chain logo overlay in center
- Full address text below

### Switch Networks

Use the network selector in the header:
- Automatically redirects to home if on detail pages
- Persists selection in LocalStorage

## 🛠️ Development

### Architecture

**State Management**: Pinia stores with composition API
- `chain-store`: EVM chain configuration, RPC clients, transaction/wallet logic
- `bitcoin-store`: Bitcoin API with queue-based rate limiting
- `price-store`: Cryptocurrency price tracking
- `search-store`: Recent search history with LocalStorage

**Component Pattern**: 
- Composition API with `<script setup lang="ts">`
- Props validation with TypeScript interfaces
- Emit events for parent communication

**Routing**:
- Vue Router with hash mode
- Auto-detection for Bitcoin vs EVM addresses
- Navigation guards for chain switching

### Component Guidelines

1. **Use `<script setup lang="ts">`** for all components
2. **Separate concerns**: 
   - UI components in `/src/components/`
   - Business logic in Pinia stores
   - Page logic in `/src/pages/`
3. **Strong typing**: 
   - Define interfaces for all props
   - Use viem types for blockchain data
   - Avoid `any` type
4. **Reusable animations**: Use CSS classes from `animations.css`

### Adding New Features

#### Add New EVM Chain
1. Import chain from `viem/chains` in `chain-store.ts`
2. Import or create SVG logo in `src/assets/`
3. Add to `SUPPORTED_CHAINS` with RPC URLs
4. Chain will appear in network selector automatically

#### Add New Bitcoin Features
1. Check Mempool.space API documentation
2. Add API call in `bitcoin-store.ts` with queue support
3. Update UI in relevant pages

### Rate Limiting Strategy

Bitcoin API uses intelligent queue system:
```typescript
// Minimum 3 seconds between requests
// 5 second delay after rate limit error
// FIFO queue for pending requests
// Automatic retry mechanism
```

### Code Style

- 2-space indentation
- Single quotes for strings
- Semicolons required
- ESLint + Prettier (auto-configured by Quasar)
- TypeScript strict mode enabled

## 📦 Build & Deploy

### Web Build (SPA)

```bash
# Build for production
bun run build
# or
quasar build

# Preview production build
quasar serve dist/spa

# Output: /dist/spa/
```

Deploy to static hosting:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

### Android Build (APK)

```bash
# Development build
quasar dev -m capacitor -T android

# Production build
quasar build -m capacitor -T android

# Open in Android Studio
quasar build -m capacitor -T android --ide

# Output: /src-capacitor/android/app/build/outputs/apk/
```

**Requirements**:
- Android Studio installed
- Java JDK 17+
- Android SDK Platform 34+
- Gradle configured

**Build variants**:
- `debug`: Development APK with debugging enabled
- `release`: Production APK (requires signing)

### Build Output

```
dist/
└── spa/                 # Web build output
    ├── index.html
    ├── assets/
    └── icons/

src-capacitor/
└── android/
    └── app/
        └── build/
            └── outputs/
                └── apk/  # Android APK files
```

## 🧪 Testing

```bash
# Run linting
bun run lint

# Format code
bun run format

# Type checking
vue-tsc --noEmit
```

## 🔐 Security & Privacy

- ✅ **No Private Keys**: Read-only blockchain access
- ✅ **No Backend**: All data fetched directly from public APIs/RPCs
- ✅ **Local Storage Only**: User preferences stored locally
- ✅ **No Analytics**: No tracking or data collection
- ✅ **HTTPS Recommended**: For production deployments
- ⚠️ **Rate Limiting**: Bitcoin API implements queue-based rate limiting
- ⚠️ **RPC Failover**: Multiple RPC endpoints for redundancy

## 🐛 Known Issues & Limitations

1. **Bitcoin Rate Limiting**: Mempool.space API has rate limits
   - Mitigation: Queue system with 3-second minimum interval
   - Auto-retry on HTTP 429 with 5-second delay

2. **EVM Token Detection**: Only displays tokens manually added
   - No automatic token discovery
   - User must add ERC20 contract addresses

3. **Transaction History**: Limited to recent transactions
   - Bitcoin: Last transactions from Mempool.space
   - EVM: Requires manual log querying

4. **Mobile Performance**: Large transaction lists may lag
   - Pagination helps but not implemented everywhere

## 📊 Performance Optimizations

- **RPC Fallback**: Race mode picks fastest RPC response
- **Queue System**: Prevents API rate limit errors for Bitcoin
- **Local Caching**: Recent searches and custom tokens cached
- **Lazy Loading**: Components loaded on-demand
- **Minimal Dependencies**: Lightweight bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/zororaka00/sosomi-app.git
cd onchain-scanner
bun install
bun dev
```

### Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commits format
- Test before committing

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Quasar Framework](https://quasar.dev/) - Vue.js framework for building apps
- [viem](https://viem.sh/) - TypeScript Ethereum library
- [Capacitor](https://capacitorjs.com/) - Native mobile runtime
- [Mempool.space](https://mempool.space/) - Bitcoin blockchain API
- [CoinGecko](https://www.coingecko.com/) - Cryptocurrency price data
- [LlamaNodes](https://llamanodes.com/) - Public RPC infrastructure
- [qrcode.vue](https://github.com/scopewu/qrcode.vue) - QR code generation

## 📞 Support

For issues or questions:
- Create an issue on [GitHub](https://github.com/zororaka00/sosomi-app/issues)
- Email: rakawidhiantoro@gmail.com

## 🗺️ Roadmap

- [ ] NFT display support
- [ ] Transaction history pagination
- [ ] Contract interaction UI
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export transaction history
- [ ] Push notifications for address monitoring
- [ ] iOS build support

---

**Built with ❤️ by [zororaka00](https://github.com/zororaka00)**