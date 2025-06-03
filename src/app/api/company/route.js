import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@lib/mongodb";

export async function GET(req){
    try{
        const query = req?.nextUrl?.searchParams?.get("id");
        const {db} = await connectToDatabase();
        const companyCollection = db.collection("company");

        if(query){
            const result = await companyCollection.findOne({_id:new ObjectId(query)},{"_id":1,"name":1,"address":0,"brand_img":0,"createdAt":0,"updatedAt":0});
            return NextResponse.json(result,{status:200});
        }

        const result = await companyCollection.find({},{"_id":1,"name":1,"address":0,"brand_img":0,"createdAt":0,"updatedAt":0}).toArray();

        return NextResponse.json(result,{status:200});
    } catch(error){
        console.error("Can't fetch company details", error);
        return NextResponse.json({message:"An error occurred while fetching company details",error:error.message},{status:500});
    }
}