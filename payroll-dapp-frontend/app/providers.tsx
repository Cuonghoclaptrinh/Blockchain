'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat } from 'wagmi/chains';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

// const config = getDefaultConfig({
//     appName: 'Payroll DApp',
//     projectId: 'YOUR_PROJECT_ID', 
//     chains: [hardhat],
//     transports: {
//         [hardhat.id]: http('http://127.0.0.1:8545'), // ← RPC LOCAL
//     },
// });

const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/dDhavrxVmta_1pw2peUmd'),
    },
    ssr: true,
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