
// 'use client';
// import { CONTRACT_ABI, CONTRACT_ADDRESS } from './abi';
// import { ConnectButton } from '@rainbow-me/rainbowkit';
// import { useAccount, useReadContract, useWriteContract } from 'wagmi';
// import { parseEther, formatEther } from 'viem';
// import { useState } from 'react';
// import Providers from './providers';


// export default function Home() {
//   return (
//     <Providers>
//       <PayrollApp />
//     </Providers>
//   );
// }

// function PayrollApp() {
//   const { address, isConnected } = useAccount();
//   const [hours, setHours] = useState('');
//   const [employeeAddr, setEmployeeAddr] = useState('');
//   const [rate, setRate] = useState('');

//   const { data: balance } = useReadContract({
//     address: CONTRACT_ADDRESS,
//     abi: CONTRACT_ABI,
//     functionName: 'contractBalance',
//   });

//   const { writeContract } = useWriteContract();

//   const addEmployee = () => {
//     if (!employeeAddr || !rate || isNaN(Number(rate))) return;
//     writeContract({
//       address: CONTRACT_ADDRESS,
//       abi: CONTRACT_ABI,
//       functionName: 'addEmployee',
//       args: [employeeAddr, parseEther(rate)], // ← DÙNG viem
//     });
//   };

//   const recordWork = () => {
//     const hoursNum = Number(hours);
//     if (!hours || isNaN(hoursNum) || hoursNum <= 0) return;
//     writeContract({
//       address: CONTRACT_ADDRESS,
//       abi: CONTRACT_ABI,
//       functionName: 'recordWork',
//       args: [hoursNum],
//     });
//   };

//   const payAll = () => {
//     writeContract({
//       address: CONTRACT_ADDRESS,
//       abi: CONTRACT_ABI,
//       functionName: 'payAll',
//       args: [],
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="flex justify-between items-center mb-8">
//           <h1 className="text-4xl font-bold text-indigo-900">Payroll DApp</h1>
//           <ConnectButton />
//         </div>

//         {isConnected ? (
//           <div className="grid gap-6">
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <h2 className="text-2xl font-semibold mb-4">Contract Info</h2>
//               <p>Address: <code className="bg-gray-100 px-2 py-1 rounded">{CONTRACT_ADDRESS}</code></p>
//               <p>
//                 Balance: <strong>
//                   {balance ? formatEther(balance as bigint) : '0'} ETH
//                 </strong>
//               </p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-4">
//               <div className="bg-white rounded-xl shadow p-6">
//                 <h3 className="font-bold mb-3">Add Employee</h3>
//                 <input placeholder="Address" className="input" onChange={e => setEmployeeAddr(e.target.value)} />
//                 <input placeholder="Rate (ETH/h)" className="input mt-2" onChange={e => setRate(e.target.value)} />
//                 <button onClick={addEmployee} className="btn mt-3 w-full">Add</button>
//               </div>

//               <div className="bg-white rounded-xl shadow p-6">
//                 <h3 className="font-bold mb-3">Record Work</h3>
//                 <input placeholder="Hours" className="input" onChange={e => setHours(e.target.value)} />
//                 <button onClick={recordWork} className="btn mt-3 w-full">Record</button>
//               </div>

//               <div className="bg-white rounded-xl shadow p-6">
//                 <h3 className="font-bold mb-3">Pay All</h3>
//                 <button onClick={payAll} className="btn w-full">Pay All Employees</button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="text-center py-20">
//             <h2 className="text-2xl mb-4">Connect your wallet to start</h2>
//             <ConnectButton />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push('/employee');
    }
  }, [isConnected, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-xl font-medium text-indigo-900">Đang kết nối ví...</p>
    </div>
  );
}