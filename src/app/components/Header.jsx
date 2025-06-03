"use client";

import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutBtnVisibility,setLogoutBtnVisibility] = useState(false);

  const getNavLinks = () => {
    if (status === "authenticated" && session?.user) {
      const links = [
        { name: "Profile", path: "/dashboard/profile" },
      ];
      if (session.user.role === "admin") {
        links.push({ name: "Templates", path: "/dashboard/mytemplates" });
      } else {
        links.push({ name: "Proposals", path: "/dashboard/myproposals" });
      }
      return links;
    }
    return [];
  };

  const navLinks = getNavLinks();

  const handleAvatarClick = () => {
    if (status === "authenticated") {
      setLogoutBtnVisibility(!logoutBtnVisibility);
    } else {
      signIn();
    }
  };

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <header
      className={`header fixed top-0 left-0 w-full px-6 md:px-12 py-2 flex justify-between items-center z-50 transition-colors duration-300 bg-purple-400 shadow-lg`}
    >
      <button
        role="button"
        aria-label="Toggle menu"
        className="md:hidden text-white font-bold text-2xl cursor-pointer"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>
      <button
        onClick={handleLogoClick}
        className="flex items-center justify-between space-x-2 w-auto md:w-40 cursor-pointer"
        id="logo-container"
        aria-label="Go to Home"
      >
        <div className="flex text-2xl font-semibold" id="logo-text">
          <span className="text-yellow-300 mx-1">Proposal</span>
          <span className="text-white mx-1">Craft</span>
        </div>
      </button>
      <nav
        id="nav"
        className="hidden md:flex items-center justify-around min-w-40 max-lg:space-x-5 space-x-10 text-lg font-medium text-white"
      >
        {navLinks.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`nav-links relative hover:text-yellow-300 px-3 py-2 transition-all duration-100 ${
              router.pathname === item.path ? "text-yellow-300 border-b-2 border-yellow-300" : ""
            }`}
            onClick={() => setMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="flex items-center space-x-3 md:space-x-4">
        {status === 'loading' && <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-500 animate-pulse"></div>}
        {status === 'unauthenticated' && (
          <button
            onClick={handleLoginClick}
            className="max-md:hidden bg-blue-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 cursor-pointer font-semibold text-sm md:text-base"
          >
            Login
          </button>
        )}
        {status === 'authenticated' && session?.user && (
          <div
            className="max-md:hidden w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center text-purple-700 font-semibold cursor-pointer ring-2 ring-purple-300 hover:ring-yellow-300 overflow-hidden"
            onClick={handleAvatarClick}
            title={session.user.name || session.user.email}
          >
            {session.user.image ? (
              <img src={session.user.image} alt="User avatar" className="w-full h-full object-cover" />
            ) : session.user.name ? (
              session.user.name.substring(0, 2).toUpperCase()
            ) : (
              <FaUserCircle size={24}/>
            )}
            <button type="button" className={`max-md:hidden absolute ${logoutBtnVisibility?"":"hidden"} mt-24 p-2 rounded-md bg-red-400 hover:bg-red-500 cursor-pointer text-white`} onClick={e=>{signOut({callbackUrl:'/'})}}>Logout</button>
          </div>
        )}
      </div>
      <div
        className={`dropdown md:hidden ${
          menuOpen === false ? "hidden" : "flex"
        } flex-col fixed left-0 top-0 bg-purple-400/90 backdrop-blur-md w-full sm:w-10/12 h-screen text-white font-medium text-lg pt-[72px]`}
      >
        <div className="flex justify-between items-center bg-purple-500 text-white text-2xl font-bold px-5 py-3 absolute top-0 left-0 w-full">
          <span onClick={() => { handleLogoClick(); setMenuOpen(false);}} className="cursor-pointer">Krishi हल</span>
          <span role="button" aria-label="Close menu" className="cursor-pointer text-3xl" onClick={() => setMenuOpen(false)}>
            ⨯
          </span>
        </div>
        {navLinks.map((item) => (
          <Link
            key={`mobile-${item.name}`}
            href={item.path}
            className={`nav-links block border-b border-purple-500 hover:bg-purple-500 px-5 py-4 transition-all duration-100 ${ 
               router.pathname === item.path ? "bg-purple-500 text-yellow-300" : ""
            }`}
            onClick={() => setMenuOpen(false)}
          >
            {item.name}
          </Link>
        ))}
        <div className="mt-auto p-5 border-t border-purple-500">
          {status === 'unauthenticated' && (
            <button
                onClick={() => { handleLoginClick(); setMenuOpen(false); }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-md transition-colors duration-200 mb-4 cursor-pointer"
            >
                Login / Register
            </button>
          )}
          {status === 'authenticated' && session?.user && (
            <>
            <button
                onClick={() => { router.push('/dashboard/profile'); setMenuOpen(false); }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-3 rounded-md transition-colors duration-200 mb-4 cursor-pointer"
            >
                My Account ({session.user.name?.split(' ')[0] || 'User'})
            </button>
            <button
                onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-3 rounded-md transition-colors duration-200 mb-4 cursor-pointer"
            >
                Logout
            </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}