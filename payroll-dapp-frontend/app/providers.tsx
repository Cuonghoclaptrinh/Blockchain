// 'use client';

// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { WagmiProvider, createConfig, http } from 'wagmi';
// import { sepolia } from 'wagmi/chains';
// import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
// import '@rainbow-me/rainbowkit/styles.css';

// Cấu hình ví (WalletConnect + Alchemy)
// const config = getDefaultConfig({
//     appName: 'Payroll DApp',
//     projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Tạo tại: https://cloud.walletconnect.com
//     chains: [sepolia],
//     transports: {
//         [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY'), // Tạo tại: https://alchemy.com
//     },
// });

// const queryClient = new QueryClient();

// export default function Providers({ children }: { children: React.ReactNode }) {
//     return (
//         <WagmiProvider config={config}>
//             <QueryClientProvider client={queryClient}>
//                 <RainbowKitProvider>{children}</RainbowKitProvider>
//             </QueryClientProvider>
//         </WagmiProvider>
//     );
// }

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat } from 'wagmi/chains';
import { http } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

const config = getDefaultConfig({
    appName: 'Payroll DApp',
    projectId: 'YOUR_PROJECT_ID', // Bỏ qua cũng được
    chains: [hardhat],
    transports: {
        [hardhat.id]: http('http://127.0.0.1:8545'), // ← RPC LOCAL
    },
});

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        // <WagmiProvider config={wagmiConfig}>
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}