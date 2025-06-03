"use client";

import { FaUser, FaUserAstronaut } from "react-icons/fa";
import Header from "./components/Header";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <>
      <Header />
      <div className="container h-screen mt-24 flex flex-row flex-wrap gap-x-10 mx-auto justify-center">
        <h1 className="text-5xl text-center text-transparent bg-linear-to-r from-amber-300 to-purple-400 w-screen h-fit bg-clip-text">Sales Proposal Generator</h1>
        <div className="card bg-white shadow-lg rounded-md cursor-pointer w-72 h-48" onClick={()=>{router.push('/login?type=user')}}>
          <FaUser className="w-30 h-fit mx-auto" />
          <br />
          <h1 className="text-2xl text-center">User</h1>
        </div>
        <div className="card bg-white shadow-lg rounded-md cursor-pointer w-72 h-48" onClick={()=>{router.push('/login?type=admin')}}>
          <FaUserAstronaut className="w-30 h-fit mx-auto" />
          <br />
          <h1 className="text-2xl text-center">Admin</h1>
        </div>
      </div>
    </>
  );
}
