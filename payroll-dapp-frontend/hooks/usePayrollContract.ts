    // // src/hooks/usePayrollContract.ts
    // import { useReadContract, useWriteContract, useAccount, usePublicClient } from 'wagmi';
    // import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/constants/contract';
    // import { parseEther, formatEther } from 'viem';
    // import { useEffect, useState } from 'react';

    // export function usePayrollContract() {
    //     const { address, isConnected } = useAccount();
    //     // const { writeContract: wagmiWrite } = useWriteContract();
    //     const { writeContractAsync } = useWriteContract();
    //     const publicClient = usePublicClient();


    //     console.log("isConnected:", isConnected);
    //     console.log("address:", address);
    //     console.log("chainId:", publicClient?.chain?.id);

    //     const [currency, setCurrency] = useState("ETH"); // ĐỔI TÊN ĐỒNG TIỀN

    //     // === ĐỔI TÊN MẠNG + ĐƠN VỊ ===
    //     useEffect(() => {
    //         if (publicClient?.chain?.id === 31337) {
    //             setCurrency("GO"); // LOCAL → GO
    //         } else {
    //             setCurrency("ETH"); // SEPOLIA/MAINNET → ETH
    //         }
    //     }, [publicClient]);

    //     // === READ DATA ===
    //     const { data: contractOwner } = useReadContract({
    //         address: CONTRACT_ADDRESS,
    //         abi: CONTRACT_ABI,
    //         functionName: 'getOwner',
    //     });

    //     const { data: rawBalance } = useReadContract({
    //         address: CONTRACT_ADDRESS,
    //         abi: CONTRACT_ABI,
    //         functionName: 'contractBalance',
    //     });

    //     console.log("Contract Owner:", contractOwner);
    //     console.log("Your Address:", address);

    //     // === DERIVED VALUES ===
    //     const isOwner = contractOwner === address;
    //     const balance = rawBalance ? formatEther(rawBalance as bigint) : "0";

    //     // === WRITE HELPER ===
    //     const write = async (
    //         functionName: string,
    //         args: any[] = [],
    //         options: { value?: bigint } = {}
    //     ): Promise<`0x${string}`> => {
    //         return await writeContractAsync({
    //             address: CONTRACT_ADDRESS,
    //             abi: CONTRACT_ABI,
    //             functionName,
    //             args,
    //             ...options,
    //         });
    //     };

    //     // === CÁC HÀM CỤ THỂ ===
    //     const addEmployee = (empAddr: string, name: string, rate: string) => {
    //         write('addEmployee', [empAddr, name, parseEther(rate)]);
    //     };

    //     const updateRate = (empAddr: string, rate: string) => {
    //         write('updateRate', [empAddr, parseEther(rate)]);
    //     };

    //     const removeEmployee = (empAddr: string) => {
    //         write('removeEmployee', [empAddr]);
    //     };

    //     const recordWork = (hours: number) => {
    //         write('recordWork', [hours]);
    //     };

    //     const payAll = (start = 0, limit = 10) => {
    //         write('payAll', [start, limit]);
    //     };

    //     const checkIn = () => write('checkIn');
    //     const checkOut = () => write('checkOut');
    //     const withdraw = () => write('withdraw');

    //     const deposit = async (amount: string) => {
    //         if (!amount || !isConnected || !publicClient) return;

    //         try {
    //             const hash = await writeContractAsync({ 
    //                 address: CONTRACT_ADDRESS,
    //                 abi: CONTRACT_ABI,
    //                 functionName: 'deposit',
    //                 args: [],
    //                 value: parseEther(amount),
    //             });

    //             console.log("Nạp tiền thành công! Hash:", hash);
    //             await publicClient.waitForTransactionReceipt({ hash }); // ← hash là 0x...
    //             alert(`Nạp ${amount} GO thành công!`);
    //         } catch (error: any) {
    //             console.error("Nạp thất bại:", error);
    //             alert("Lỗi: " + (error.shortMessage || error.message));
    //         }
    //     };

    //     const withdrawFunds = (amount: string) => {
    //         write('withdrawFunds', [parseEther(amount)]);
    //     };

    //     return {
    //         // Auth & Info
    //         address,
    //         isOwner,
    //         balance,
    //         currency, // TRẢ VỀ ĐỂ DÙNG TRONG FE


    //         // Write functions
    //         addEmployee,
    //         updateRate,       // THÊM
    //         removeEmployee,   // THÊM
    //         recordWork,
    //         payAll,
    //         checkIn,
    //         checkOut,
    //         withdraw,
    //         deposit,
    //         withdrawFunds,    // THÊM
    //     };
    // }

    // src/hooks/usePayrollContract.ts
    'use client';
    import { useReadContract, useWriteContract, useAccount, usePublicClient } from 'wagmi';
    import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/constants/contract';
    import { parseEther, formatEther } from 'viem';
    import { useEffect, useState } from 'react';

    export function usePayrollContract() {
        const { address, isConnected } = useAccount();
        const { writeContractAsync, isPending: isWritePending } = useWriteContract();
        const publicClient = usePublicClient();

        const [currency, setCurrency] = useState("ETH");

        useEffect(() => {
            if (publicClient?.chain?.id === 31337) {
                setCurrency("GO");
            } else {
                setCurrency("ETH");
            }
        }, [publicClient]);

        // === READ DATA ===
        const { data: contractOwner } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getOwner',
        });

        const { data: rawBalance } = useReadContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'contractBalance',
        });

        const isOwner = contractOwner === address;
        const balance = rawBalance ? formatEther(rawBalance as bigint) : "0";

        // === WRITE HELPER ===
        const write = async (
            functionName: string,
            args: any[] = [],
            options: { value?: bigint } = {}
        ): Promise<`0x${string}`> => {
            try {
                const hash = await writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName,
                    args,
                    ...options,
                });
                console.log(`Gửi ${functionName} thành công! Hash:`, hash);
                return hash;
            } catch (error: any) {
                console.error(`Lỗi ${functionName}:`, error);

                let message = 'Lỗi không xác định';
                if (error.shortMessage) {
                    message = error.shortMessage;
                } else if (error.cause?.data?.message) {
                    message = error.cause.data.message;
                } else if (error.message) {
                    message = error.message;
                }

                // CẢNH BÁO RÕ RÀNG
                if (functionName === 'checkIn') {
                    if (message.includes('Employee not found')) {
                        throw new Error('Bạn chưa được thêm vào danh sách nhân viên!');
                    }
                    if (message.includes('Already checked in')) {
                        throw new Error('Bạn đã check-in rồi!');
                    }
                }

                throw new Error(message);
            }
        };

        // === CÁC HÀM CỤ THỂ ===
        const addEmployee = (empAddr: string, name: string, rate: string) => {
            write('addEmployee', [empAddr, name, parseEther(rate)]);
        };

        const updateRate = (empAddr: string, rate: string) => {
            write('updateRate', [empAddr, parseEther(rate)]);
        };

        const removeEmployee = (empAddr: string) => {
            write('removeEmployee', [empAddr]);
        };

        const checkIn = async () => {
            return await write('checkIn', []);
        };

        const checkOut = async () => {
            return await write('checkOut', []);
        };

        const withdraw = async () => {
            return await write('withdraw', []);
        };

        const payAll = (start = 0, limit = 10) => {
            write('payAll', [start, limit]);
        };

        const deposit = async (amount: string) => {
            if (!amount || !isConnected || !publicClient) return;
            try {
                const hash = await writeContractAsync({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'deposit',
                    args: [],
                    value: parseEther(amount),
                });
                await publicClient.waitForTransactionReceipt({ hash });
                alert(`Nạp ${amount} ${currency} thành công!`);
            } catch (error: any) {
                alert("Lỗi: " + (error.shortMessage || error.message));
            }
        };

        const withdrawFunds = (amount: string) => {
            write('withdrawFunds', [parseEther(amount)]);
        };

        return {
            address,
            isOwner,
            balance,
            currency,
            isPending: isWritePending,

            checkIn,
            checkOut,
            withdraw,
            updateRate,
            removeEmployee,
            addEmployee,
            payAll,
            deposit,
            withdrawFunds,
        };
    }