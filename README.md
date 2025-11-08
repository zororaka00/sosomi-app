# Sosomi - Onchain Scanner# Sosomi (onchain-scanner-app)



A mobile-first, lightweight blockchain explorer built with Quasar Framework (Vue 3 + TypeScript) and viem for direct on-chain interactions.Sosomi is onchain scanner



![Sosomi Scanner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6) ![Quasar](https://img.shields.io/badge/Quasar-2.x-1976D2)## Install the dependencies

```bash

## ✨ Featuresyarn

# or

- 🔍 **Universal Search**: Search for transactions, wallets, and smart contracts by hash or addressnpm install

- ⛓️ **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base, and Sepolia testnet```

- 💰 **Wallet Tracking**: View native balances and ERC20 token holdings

- 📱 **Mobile-First Design**: Clean, minimalist UI optimized for mobile devices### Start the app in development mode (hot-code reloading, error reporting, etc.)

- ⚡ **Direct On-Chain**: No backend, no indexer - reads directly from RPC nodes using viem```bash

- 🎨 **Modern UI/UX**: Inspired by Coinbase and Stripe design principlesquasar dev

```

## 🚀 Quick Start



### Prerequisites### Build the app for production

```bash

- [Bun](https://bun.sh/) v1.0+ (recommended package manager)quasar build

- Node.js 20+ (alternative)```



### Installation### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

```bash
# Clone the repository
git clone <your-repo-url>
cd onchain-scanner

# Install dependencies
bun install

# Start development server
bun dev
```

The app will be available at `http://localhost:9000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BaseCard.vue             # Base card wrapper
│   ├── TokenRow.vue             # Token balance row
│   ├── WalletAddressChip.vue    # Address display chip
│   └── NetworkSelector.vue      # Chain switcher
├── composables/         # Business logic & blockchain interactions
│   ├── useChain.ts              # Chain configuration & RPC clients
│   ├── useWallet.ts             # Wallet & token balance logic
│   └── useTransaction.ts        # Transaction details logic
├── css/                 # Global styles & animations
│   ├── app.css                  # Main styles
│   ├── animations.css           # Reusable animations
│   └── transitions.css          # Page transitions
├── layouts/             # Layout components
│   └── MainLayout.vue           # Main app layout with header
├── pages/               # Route pages
│   ├── IndexPage.vue            # Search page (home)
│   ├── TransactionDetail.vue   # Transaction details
│   └── AddressDetail.vue        # Wallet/contract details
└── router/              # Vue Router configuration
    └── routes.ts
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

## 🔧 Configuration

### Supported Chains

Edit `src/composables/useChain.ts` to add or modify chains:

```typescript
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chain: mainnet,
    rpcUrl: 'https://eth.llamarpc.com',
    name: 'Ethereum',
    icon: 'token'
  },
  // Add more chains...
}
```

### Quasar Configuration

Customize `quasar.config.ts` for:
- Build targets
- PWA settings
- Color themes
- Plugins

## 📱 Usage Examples

### Search for Transaction

Navigate to home and enter a transaction hash:
```
0x1234567890abcdef...
```

### Check Wallet Balance

Enter an Ethereum address:
```
0xabcdef1234567890...
```

### Add Custom Tokens

On any wallet page, scroll to "Add Custom Token" and enter an ERC20 contract address.

## 🛠️ Development

### Component Guidelines

1. **Use `<script setup lang="ts">`** for all components
2. **Separate concerns**: UI in components, logic in composables
3. **Strong typing**: Avoid `any`, define proper interfaces
4. **Reusable animations**: Use CSS classes from `animations.css`

### Adding New Features

1. **New composable**: Place blockchain logic in `/src/composables/`
2. **New component**: Create reusable UI in `/src/components/`
3. **New page**: Add route pages in `/src/pages/` and update `routes.ts`

### Code Style

- 2-space indentation
- Single quotes for strings
- Semicolons required
- ESLint + Prettier (auto-configured by Quasar)

## 📦 Build & Deploy

```bash
# Build for production
bun run build

# Preview production build
bun run preview

# Lint files
bun run lint
```

### Build Output

Production files are generated in `/dist/spa/`

Deploy to any static hosting:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🧪 Testing

```bash
# Run tests (when implemented)
bun test
```

## 🔐 Security

- No private keys stored
- Read-only RPC interactions
- Client-side only (no backend)
- HTTPS recommended for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Quasar Framework](https://quasar.dev/) - Vue.js framework
- [viem](https://viem.sh/) - TypeScript Ethereum library
- [LlamaNodes](https://llamanodes.com/) - Public RPC infrastructure

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Contact: rakawidhiantoro@gmail.com

---

**Built with ❤️ by zororaka00**
