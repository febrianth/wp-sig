import { Star, Github, Settings } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Navbar() {

  return (
    <nav className="w-full bg-white border-b-4 border-black px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-6">
          <NavLink to={"/"}>
            <div className="w-8 h-8 bg-blue-500 border-2 border-black flex items-center justify-center font-bold text-white text-lg">
              W
            </div>
          </NavLink>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
              <NavLink
                to="/dashboard"
                className="text-black font-medium hover:bg-yellow-300 hover:border-2 hover:border-black px-3 py-1 transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/make-event"
                className="text-black font-medium hover:bg-yellow-300 hover:border-2 hover:border-black px-3 py-1 transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Buat Event
              </NavLink>
          </div>
        </div>

        {/* Right Side Items */}
        <div className="flex items-center space-x-3">
          
          {/* settings */}
          <div className="bg-white border-2 border-black p-2 hover:bg-gray-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <NavLink to={"/settings"}><Settings className="w-4 h-4 text-black" /></NavLink>
          </div>

          {/* GitHub Button */}
          <a className="bg-white border-2 border-black p-2 hover:bg-gray-300 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" href="https://github.com/febrianth">
            <Github className="w-4 h-4 text-black" />
          </a>
        </div>
      </div>
    </nav>
  )
}