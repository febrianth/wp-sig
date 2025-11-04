import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Daftar rute pengaturan kita
const settingRoutes = [
	{ path: '/settings', label: 'Umum & Peta' },
	{ path: '/settings/import', label: 'Import Data' },
	// Tambahkan rute pengaturan lain di sini jika perlu
];

// Helper function untuk styling link sidebar (desktop)
const getSidebarLinkClass = ({ isActive }) => {
	const baseClasses = "block border-b-4 border-r-4 border-border p-4 pl-7 text-mtext font-base hover:bg-main/70 hover:text-main-foreground";
	const activeClasses = "bg-main text-md"; // Anda bisa tambahkan text-main-foreground di sini jika perlu
	const inactiveClasses = "bg-bg";
	return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
};

function SettingsLayout() {
	const location = useLocation();
	const navigate = useNavigate();

	// Tentukan tab/rute mana yang aktif
	const currentTabValue = location.pathname;

	// Handler untuk mengubah rute saat tab mobile diklik
	const onTabChange = (value) => {
		navigate(value);
	};

	return (
		<>
			{/* --- 1. TAMPILAN DESKTOP (md ke atas) --- */}
			<div className="hidden md:grid md:grid-cols-4 h-[80vh] w-full gap-6">
				{/* Panel Kiri (Sidebar) */}
				<div className="col-span-1 flex flex-col h-full border-2 border-foreground bg-card rounded-lg border-border">
					<div className="p-4 border-b-4 border-border">
						<h2 className="text-xl font-bold">Pengaturan</h2>
					</div>
					<div className="flex-grow overflow-y-auto">
						{settingRoutes.map(route => (
							<NavLink
								to={route.path}
								key={route.path}
								end={route.path === '/settings'} // 'end' prop untuk rute 'Umum'
								className={getSidebarLinkClass}
							>
								{route.label}
							</NavLink>
						))}
					</div>
				</div>

				{/* Panel Kanan (Konten Utama) */}
				<div className="col-span-3 h-full overflow-y-auto p-8 bg-card border-2 border-foreground rounded-lg border-border">
					<Outlet />
				</div>
			</div>

			{/* --- 2. TAMPILAN MOBILE (di bawah md) --- */}
			<div className="block md:hidden">
				<Tabs value={currentTabValue} onValueChange={onTabChange} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="/settings">Umum & Peta</TabsTrigger>
						<TabsTrigger value="/settings/import">Import Data</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="mt-4 p-4 border-2 border-foreground rounded-lg bg-card shadow-neo">
					<Outlet />
				</div>
			</div>
		</>
	);
}

export default SettingsLayout;