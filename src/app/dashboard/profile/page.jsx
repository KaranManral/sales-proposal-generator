"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { FaPencilAlt } from "react-icons/fa";
import Image from "next/image";
import Header from "@app/components/Header";
import Link from "next/link";


export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const [companyName, setCompanyName] = useState("Loading...");
  const [allCompanies, setAllCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [currentValueToEdit, setCurrentValueToEdit] = useState("");

  useEffect(() => {
    if (session?.user?.companyId) {
      fetch(`/api/company?id=${session.user.companyId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch company");
          return res.json();
        })
        .then((data) => {console.log(data);setCompanyName(data.name || "N/A")})
        .catch(() => setCompanyName("Error loading company"));
    } else if (session?.user && !session?.user?.companyId) {
        setCompanyName("N/A");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-100">
        <p className="text-xl text-gray-600 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-100">
        <p className="text-xl text-red-600">Access Denied. Please <Link className="text-blue-500" href={"/login"}>Login</Link></p>
      </div>
    );
  }

  const user = session.user;

  const handleEditClick = (field, currentValue, type = "text", options = []) => {
    
  };


  const ProfileField = ({ label, value, onEdit, isEditable = true }) => (
    <div className="mb-4 group">
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <div className="mt-1 text-lg text-gray-800 flex items-center justify-between">
        <span>{value}</span>
        {isEditable && onEdit && (
          <button
            onClick={onEdit}
            className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-800"
            aria-label={`Edit ${label}`}
          >
            <FaPencilAlt size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
    <Header />
      <div className="max-w-3xl mx-auto mt-[10vh]">
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-10">
          <div className="flex flex-col items-center md:flex-row md:items-start mb-8">
            
            
            <div className="w-24 h-24 md:w-32 md:h-32 bg-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-semibold cursor-pointer hover:bg-purple-200" 
                onMouseEnter={()=>{
                        document.getElementById("editImage").style.display="block";
                    }
                }
                onMouseLeave={()=>{
                        document.getElementById("editImage").style.display="none";
                    }
                }
            >
                <FaPencilAlt id="editImage" size={20} className="hidden absolute text-black z-40" />
                {user.image ? (
              <Image
                src={user.image}
                alt="User avatar"
                width={100}
                height={100}
                className="rounded-full object-cover w-24 h-24 md:w-32 md:h-32 border-4 border-purple-200 hover:opacity-10"
              />) : user.name ? user.name.charAt(0).toUpperCase() : "U"
                }
              </div>
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-md text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Profile Details
            </h2>
            <ProfileField
              label="Full Name"
              value={user.name || "N/A"}
              onEdit={() => handleEditClick("Name", user.name || "")}
            />
            <ProfileField
              label="Email Address"
              value={user.email || "N/A"}
              isEditable={false}
            />
            <ProfileField
              label="Company"
              value={companyName}
              onEdit={() =>
                handleEditClick(
                  "Company",
                  user.companyId || "",
                  "select",
                  allCompanies.map(c => ({ id: c.id, name: c.name }))
                )
              }
              isEditable={!isLoadingCompanies && allCompanies.length > 0}
            />
            <ProfileField
              label="Role"
              value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "N/A"}
              onEdit={() =>
                handleEditClick(
                  "Role",
                  user.role || "user",
                  "select",
                  [{id: "user", name: "User"}, {id: "admin", name: "Admin"}]
                )
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}