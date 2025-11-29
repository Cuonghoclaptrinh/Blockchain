// import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { sepolia } from 'wagmi/chains';
// import { http } from 'viem';

// export const wagmiConfig = getDefaultConfig({
//     appName: 'Payroll DApp',
//     projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'fallback',
//     chains: [sepolia],
//     transports: {
//         [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
//     },
// });



// import { getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { sepolia } from 'wagmi/chains';
// import { http } from 'viem';

// export const wagmiConfig = getDefaultConfig({
//     appName: 'Payroll DApp',
//     projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'fallback',
//     chains: [sepolia],
//     transports: {
//         [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL!),
//         // [sepolia.id]: http('https://rpc.sepolia.org'),
//     },
//     ssr: true,
// });

import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export const wagmiConfig = createConfig({
    chains: [sepolia],
    ssr: true,
    transports: {
        [sepolia.id]: http(
            process.env.NEXT_PUBLIC_RPC_URL ||
            'https://eth-sepolia.g.alchemy.com/v2/dDhavrxVmta_1pw2peUmd'
        ),
    },
});