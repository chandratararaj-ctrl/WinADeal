import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { RefreshCw, UserCircle, Briefcase } from 'lucide-react';

export default function RoleSwitcher() {
    const { user, setAuth } = useAuthStore();
    const [isSwitching, setIsSwitching] = useState(false);

    if (!user || !user.roles || user.roles.length <= 1) return null;

    const handleRoleSwitch = async (newRole: string) => {
        if (newRole === user.selectedRole) return;

        setIsSwitching(true);
        try {
            const res = await authService.switchRole(newRole);
            const { accessToken, refreshToken, selectedRole } = res.data;

            setAuth({ ...user, selectedRole }, accessToken, refreshToken);
            window.location.reload();
        } catch (error) {
            console.error('Failed to switch role:', error);
            alert('Failed to switch role. Please try again.');
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <div className="flex items-center gap-2 mr-4 bg-gray-100 rounded-lg p-1">
            {user.selectedRole === 'VENDOR' ? (
                <Briefcase size={16} className="text-purple-600 ml-2" />
            ) : (
                <UserCircle size={16} className="text-blue-600 ml-2" />
            )}

            <select
                value={user.selectedRole}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                disabled={isSwitching}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer py-1 pr-2"
            >
                {user.roles.map((role) => (
                    <option key={role} value={role}>
                        View as {role.charAt(0) + role.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>

            {isSwitching && <RefreshCw size={14} className="animate-spin text-gray-500 mr-2" />}
        </div>
    );
}
