import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../../components/ui/resizable";

// Helper function untuk styling link sidebar
const getSidebarLinkClass = ({ isActive }) => {
	const baseClasses = "block w-full text-left px-4 py-2 rounded-md transition-colors";
	const activeClasses = "bg-primary text-primary-foreground border-left";
	const inactiveClasses = "hover:bg-muted";
	return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
};

function SettingsLayout() {
	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="w-full h-full rounded-lg border-2 border-foreground"
		>
			{/* Panel Kiri (Sidebar) */}
			<ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
				<div className="flex h-full flex-col p-4">
					<h2 className="text-xl font-bold mb-4 px-4">Pengaturan</h2>
					<nav className="flex flex-col gap-1">
						<NavLink to="/settings" end className={getSidebarLinkClass}>
							Umum & Peta
						</NavLink>
						<NavLink to="/settings/import" className={getSidebarLinkClass}>
							Import Data
						</NavLink>
					</nav>
				</div>
			</ResizablePanel>

			{/* <ResizableHandle withHandle /> */}

			{/* Panel Kanan (Konten Utama) */}
			<ResizablePanel defaultSize={80}>
				<div className="h-full overflow-y-auto p-8">
					{/* Di sinilah komponen halaman (Umum, Peta, dll) akan dirender */}
					<Outlet />
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default SettingsLayout;