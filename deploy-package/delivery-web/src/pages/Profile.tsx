import { useAuthStore } from '../store/authStore';
export default function Profile() {
    const { user, logout } = useAuthStore();
    return (
        <div className="p-4 space-y-4">
            <div className="bg-indigo-600 text-white p-6 rounded-xl text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3">
                    {user?.name?.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-indigo-200">{user?.phone}</p>
            </div>
            <button onClick={logout} className="w-full bg-red-100 text-red-600 py-3 rounded-xl font-bold">
                Logout
            </button>
        </div>
    )
}
