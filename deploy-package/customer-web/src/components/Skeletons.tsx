export const OrderCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
        <div className="px-6 py-4">
            <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    </div>
);

export const ProductCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    </div>
);

export const ShopCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="h-40 bg-gray-200"></div>
        <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <tr className="border-b border-gray-100 animate-pulse">
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="py-4 px-4"><div className="h-8 bg-gray-200 rounded w-16"></div></td>
    </tr>
);
