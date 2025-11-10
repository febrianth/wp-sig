import { Github, Settings, Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
	// 3. Buat state untuk mengontrol menu mobile
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const closeMobileMenu = () => setIsMobileMenuOpen(false);

	const getNavLinkClasses = ({ isActive }) => {
		const baseClasses = "text-black font-medium px-3 py-1 transition-all duration-200 border-border";
		const activeClasses = "bg-main border-2";
		const inactiveClasses = "hover:bg-main hover:border-2";

		return cn(baseClasses, isActive ? activeClasses : inactiveClasses);
	};

	return (
		<nav className="w-full bg-white border-b-4 border-black px-4 py-3">
			<div className="flex items-center justify-between max-w-7xl mx-auto">
				{/* Logo */}
				<div className="flex items-center space-x-6">
					<NavLink to={"/"} onClick={closeMobileMenu}>
						<div className="w-8 h-8 bg-blue-500 border-2 border-black flex items-center justify-center font-bold text-white text-lg">
							W
						</div>
					</NavLink>

					{/* Navigasi Desktop */}
					<div className="hidden md:flex items-center space-x-6">
						<NavLink to="/dashboard" className={getNavLinkClasses}>
							Dashboard
						</NavLink>
						<NavLink to="/make-event" className={getNavLinkClasses}>
							Buat Event
						</NavLink>
					</div>
				</div>

				{/* Ikon Kanan (Desktop) */}
				<div className="hidden md:flex items-center space-x-3">
					<div className="bg-white border-2 border-black p-2 hover:bg-gray-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<NavLink to={"/settings"}><Settings className="w-4 h-4 text-black" /></NavLink>
					</div>
					<a className="bg-white border-2 border-black p-2 hover:bg-gray-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" href="https://github.com/febrianth">
						<Github className="w-4 h-4 text-black" />
					</a>
				</div>

				{/* Tombol Burger Menu (Mobile) */}
				<div className="md:hidden">
					<button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black">
						{isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
					</button>
				</div>
			</div>

			{/* Menu Dropdown Mobile */}
			{isMobileMenuOpen && (
				<div className="md:hidden mt-4 pt-4 border-t-2 border-black">
					<div className="flex flex-col space-y-4">
						<NavLink to="/dashboard" className="text-black font-medium text-lg" onClick={closeMobileMenu}>
							Dashboard
						</NavLink>
						<NavLink to="/make-event" className="text-black font-medium text-lg" onClick={closeMobileMenu}>
							Buat Event
						</NavLink>
						<div className="border-t border-gray-300 my-2"></div>
						<div className="flex items-center space-x-4">
							<NavLink to={"/settings"} className="text-black font-medium" onClick={closeMobileMenu}>
								<Settings className="w-6 h-6" />
							</NavLink>
							<a href="https://github.com/febrianth" className="text-black font-medium">
								<Github className="w-6 h-6" />
							</a>
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}