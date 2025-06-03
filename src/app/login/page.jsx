"use client";

import { useEffect, useState } from "react";
import {signIn, useSession} from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@app/components/Header";

export default function Login() {
    const {data:session,status} = useSession();
    const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(()=>{
    if(status === 'authenticated'){
        router.replace("/dashboard/profile");
    }
  },[status,router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) alert("Email is required");
    else if (!/^\S+@\S+\.\S+$/.test(email))
      alert("Invalid email format");
    if (!password) alert("Password is required");

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email,
        password: password,
      });

      if (result.error) {
        alert("Login failed. Please check your credentials.");
      } else if (result.ok) {
        const callbackUrl = new URLSearchParams(window.location.search).get(
          "callbackUrl"
        );
        router.push(callbackUrl || "/dashboard/profile");
      } else {
        alert("Login failed. Unknown error." );
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Something went wrong. Please try again." );
    } finally {
      setIsLoading(false);
    }
  };
  
  if(status === 'loading' || status === 'authenticated') {
    return(
        <>
            <Header />
            <div className="min-h-screen flex items-center justify-center pt-20 bg-white">
                <p className="text-xl text-gray-600 animate-pulse">
                    {status === 'loading' ? 'Checking session...' : 'Redirecting...'}
                </p>
            </div>
        </>
    )
  }

  return (
    <>
    <Header />
      <form
        action={"#"}
        className="container w-[90vw] md:w-[500px] mt-[25vh] ml-[5vw] md:ml-[calc((100vw-500px)/2)] grid gap-2 grid-cols-1 pb-10 items-center border border-gray-500 rounded-md shadow-2xl"
        onSubmit={handleSubmit}
      >
        <p className="w-full py-5 bg-purple-500 text-white text-4xl text-center">
          Login
        </p>
        <label htmlFor="email" className="text-sm ml-[10%] mt-6">
          Email
        </label>
        <input
          type="email"
          maxLength={50}
          name="email"
          id="email"
          placeholder="someone@example.com"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="password" className="text-sm ml-[10%]">
          Password
        </label>
        <input
          type="password"
          maxLength={50}
          name="password"
          id="password"
          placeholder="*******"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <p className="text-sm text-blue-500 ml-[10%]">Don't Have an account? <Link href={"/register/user"}>Sign Up</Link></p>
        <br />
        <button
          type="submit"
          name="submit"
          id="submit"
          className="justify-self-center bg-red-400 cursor-pointer hover:bg-red-500 text-white p-2 rounded-sm shadow-md"
        >
          Login
        </button>
      </form>
    </>
  );
}
