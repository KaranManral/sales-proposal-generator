"use client";

import Header from "@app/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaPage4 } from "react-icons/fa";

const MyProposals = () => {
    const router = useRouter();
    const {data:session,status} = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [myProposals,setMyProposals] = useState(null);

    useEffect(()=>{

        const fetchProposals = async () => {
            try{
                const response = await fetch("/api/proposals");
                const data = await response.json();
                setMyProposals(data);
            }catch(error){
                console.error("Failed to fetch proposals:", error);
                setError(error.message);
            }finally {
                setIsLoading(false);
            }
        }

        if(status === "authenticated"){
            setIsLoading(true);
            setError(null);
            fetchProposals();
        }
        else if(status === "unauthenticated"){
            setIsLoading(false);
            alert("Unauthorized")
        }
    },[status])
    if(session.user.role != "user"){
        return <h1 className="text-red-500">You are not authorized to view this page.<a className="text-blue-500" href="/dashboard/profile">Go Back</a></h1>
    }
    return (
        <>
        <Header />
        <div className="container flex flex-row flex-wrap gap-5 mt-32 p-10">
            <button type="button" className="w-fit h-fit p-3 bg-blue-400 hover:bg-blue-500 cursor-pointer text-white" onClick={()=>{router.push('/create-proposal')}}>Create New Proposal</button>
            <p className="w-full invisible"></p>
            {myProposals && myProposals.length>0 ?
            (
                myProposals.map((x,i)=>{
                    return (
                        <div className="card items-center max-w-72 w-48 max-h-72 h-40 bg-white shadow-xl rounded-md cursor-pointer overflow-hidden" key={`card_${i}`} onClick={()=>{router.push(`/dashboard/myproposals/${x._id}`)}}>
                            <FaPage4 className="mx-auto" key={`img_${i}`} size={48} />
                            <br />
                            <div className="title mx-auto" key={`card_title_${i}`}>
                                <h3 className="text-xl font-bold text-center" key={`card_title_heading_${i}`}>{x.name}</h3>
                            </div>
                            <div className="description mt-1 p-1 overflow-hidden break-after-all" key={`card_description_${i}`}>
                                <p className="text-center text-gray-600" key={`card_description_text_${i}`}>{x.description}</p>
                            </div>
                        </div>
                    );
                })
            )
            :
            (
                <h1 className="text-4xl mt-32">No Proposals to Display! Generate one <a className="text-blue-500 underline" href="/create-proposal">here.</a></h1>
            )
            }
        </div>
        </>
    )
}

export default MyProposals;