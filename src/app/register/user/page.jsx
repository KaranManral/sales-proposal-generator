"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@app/components/Header";

export default function UserRegister() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [role, setRole] = useState("user");
  const [companies, setCompanies] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(true);
  const [fetchCompaniesError, setFetchCompaniesError] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard/profile");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchCompaniesData = async () => {
      setIsFetchingCompanies(true);
      setFetchCompaniesError(null);
      try {
        const response = await fetch("/api/company");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setCompanies(data);
        } else {
          console.error("Fetched data is not an array:", data);
          setCompanies([]);
          setFetchCompaniesError("Unexpected format for company data.");
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        setFetchCompaniesError(
          "Could not load companies. Please try again later."
        );
        setCompanies([]);
      } finally {
        setIsFetchingCompanies(false);
      }
    };

    if (status === "unauthenticated") {
      fetchCompaniesData();
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    if (!email.trim()) {
      alert("Email is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("Invalid email format");
      return;
    }
    if (!password) {
      alert("Password is required");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!selectedCompanyId) {
      alert("Please select your company");
      return;
    }
    if (!role) {
      alert("Please select a role");
      return;
    }

    setIsLoading(true);
    try {
        const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email,
          password,
          confirmPassword,
          companyId: selectedCompanyId,
          role: role
        }),
      });
      
      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please login.");
        router.push("/login");
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Something went wrong during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-white">
          <p className="text-xl text-gray-600 animate-pulse">
            {status === "loading" ? "Checking session..." : "Redirecting..."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <form
        className="container w-[90vw] md:w-[500px] mt-[25vh] ml-[5vw] md:ml-[calc((100vw-500px)/2)] grid gap-2 grid-cols-1 pb-10 items-center border border-gray-500 rounded-md shadow-2xl"
        onSubmit={handleSubmit}
      >
        <p className="w-full py-5 bg-purple-500 text-white text-4xl text-center">
          Register
        </p>

        <label htmlFor="name" className="text-sm ml-[10%] mt-6">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="John Doe"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <br />

        <label htmlFor="email" className="text-sm ml-[10%]">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="someone@example.com"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br />

        <label htmlFor="password" className="text-sm ml-[10%]">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="********"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br />

        <label htmlFor="confirmPassword" className="text-sm ml-[10%]">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          placeholder="********"
          className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <br />

        <label htmlFor="company" className="text-sm ml-[10%]">
          Company
        </label>
        {isFetchingCompanies && (
          <p className="text-sm text-gray-500">Loading companies...</p>
        )}
        {fetchCompaniesError && (
          <p className="text-sm text-red-500 p-2 w-[80%] justify-self-center">{fetchCompaniesError}</p>
        )}
        {!isFetchingCompanies &&
          !fetchCompaniesError &&
          companies.length === 0 && (
            <p className="text-sm text-yellow-600 p-2 w-[80%] justify-self-center">
              No companies available. Please contact support.
            </p>
          )}
        {!isFetchingCompanies &&
          !fetchCompaniesError &&
          companies.length > 0 && (
            <select
              name="company"
              id="company"
              key={"company"}
              className="p-2 w-[80%] justify-self-center border rounded-sm shadow-md"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              required
              disabled={
                isFetchingCompanies ||
                !!fetchCompaniesError ||
                companies.length === 0
              }
            >
              <option value="" key={"default"} disabled>
                Select your company
              </option>
              {companies.map((company,i) => (
                <option key={`${company._id}_${i}`} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}

        <br />

        <label className="text-sm ml-[10%] mt-6">
          Role
        </label>
        <div className="flex items-center space-x-6 p-2 w-[80%] justify-self-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={(e) => setRole(e.target.value)}
              className="form-radio h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">User</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === "admin"}
              onChange={(e) => setRole(e.target.value)}
              className="form-radio h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Admin</span>
          </label>
        </div>
          <br />
          <br />
        <button
          type="submit"
          className={`justify-self-center bg-purple-600 cursor-pointer hover:bg-purple-700 text-white p-3 rounded-md font-semibold text-lg transition-colors duration-150 ${
            isLoading || isFetchingCompanies
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          disabled={isLoading || isFetchingCompanies}
        >
          {isLoading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </>
  );
}
