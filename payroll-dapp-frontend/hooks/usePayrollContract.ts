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

    const { data: contractOwner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getOwner',
    });

    const { data: rawBalance, refetch: refetchBalance } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'contractBalance',
    });

    const isOwner = contractOwner === address;
    const balance = rawBalance ? formatEther(rawBalance as bigint) : "0";

    const write = async (
        functionName: string,
        args: any[] = [],
        options: { value?: bigint } = {}
    ) => {
        try {
            return await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName,
                args,
                gas: 3_000_000n,
                ...options,
            });
        } catch (error: any) {
            const msg = error.shortMessage || error.message || 'Giao dịch thất bại';
            alert(msg);
            throw error;
        }
    };

    const addEmployee = (empAddr: string, name: string, rate: string) => {
        write('addEmployee', [empAddr, name, parseEther(rate)]);
    };

    const updateRate = (empAddr: string, rate: string) => {
        write('updateRate', [empAddr, parseEther(rate)]);
    };

    const removeEmployee = (empAddr: string) => {
        write('removeEmployee', [empAddr]);
    };

    const payAll = (start = 0, limit = 10) => {
        return write('payAll', [start, limit]);
    };

    const payBatch = (employees: `0x${string}`[]) => {
        return write('payBatch', [employees]);
    };

    const checkIn = async () => await write('checkIn');
    const checkOut = async () => await write('checkOut');
    const withdraw = async () => await write('withdraw');

    const deposit = async (amount: string) => {
        if (!amount || !isConnected) return;
        try {
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'deposit',
                args: [],
                gas: 3_000_000n,
                value: parseEther(amount),
            });
            await publicClient?.waitForTransactionReceipt({ hash });
        } catch (error: any) {
            alert("Lỗi nạp: " + (error.shortMessage || error.message));
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
        refetchBalance,
        addEmployee,
        updateRate,
        removeEmployee,
        payAll,
        checkIn,
        checkOut,
        withdraw,
        deposit,
        withdrawFunds,
        payBatch,
    };
}