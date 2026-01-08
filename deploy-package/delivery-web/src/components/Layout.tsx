import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, User, DollarSign } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg overflow-hidden">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="max-w-md mx-auto flex justify-around items-center h-16">
                    <NavItem to="/" icon={Home} label="Home" />
                    <NavItem to="/history" icon={List} label="History" />
                    <NavItem to="/earnings" icon={DollarSign} label="Earnings" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </div>
            </div>
        </div>
    );
}

function NavItem({ to, icon: Icon, label }: any) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                clsx(
                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                    isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
                )
            }
        >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}
