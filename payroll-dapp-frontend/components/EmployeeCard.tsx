// src/components/EmployeeCard.tsx
import { memo } from 'react';

interface EmployeeCardProps {
    name: string;
    addr: string;
    rate: number;
    accrued: number;
    currency: string;
    onEdit: () => void;
    onRemove: () => void;
}

function EmployeeCard({ name, addr, rate, accrued, currency, onEdit, onRemove }: EmployeeCardProps) {
    return (
        <div className="p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-indigo-900">{name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{addr}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                        Sửa
                    </button>
                    <button onClick={onRemove} className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                        Xóa
                    </button>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500">Lương/giờ</p>
                    <p className="font-bold text-green-600">{rate.toFixed(6)} {currency}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Chờ trả</p>
                    <p className={`font-bold ${accrued > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {accrued.toFixed(6)} {currency}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default memo(EmployeeCard);