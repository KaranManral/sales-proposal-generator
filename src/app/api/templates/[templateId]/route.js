import { NextResponse } from "next/server";
import { connectToDatabase } from "@lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@lib/authOptions";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const { templateId } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id || !session.user.companyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json({ message: "Invalid template ID provided." }, { status: 400 });
    }

    const { db } = await connectToDatabase();


    let templateObjectId;
    try {
        templateObjectId = new ObjectId(templateId);
    } catch (e) {
        return NextResponse.json({ message: "Invalid template ID format." }, { status: 400 });
    }


    const template = await db.collection('templates').findOne({
      _id: templateObjectId,
      company_id: new ObjectId(session.user.companyId)
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found or access denied." }, { status: 404 });
    }

    return NextResponse.json(template, { status: 200 });

  } catch (error) {
    console.error("API Error - Get Single Template:", error);
    return NextResponse.json({ message: "Failed to fetch template.", error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
    const { templateId } = await params;

    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id || !session.user.companyId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        if (!templateId) {
            return NextResponse.json({ message: "Template ID is required." }, { status: 400 });
        }

        const { db } = await connectToDatabase();

        let templateObjectId;
        try {
            templateObjectId = new ObjectId(templateId);
        } catch (e) {
            return NextResponse.json({ message: "Invalid template ID format." }, { status: 400 });
        }

        const result = await db.collection('templates').deleteOne({
            _id: templateObjectId,
            company_id: new ObjectId(session.user.companyId)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Template not found or you do not have permission to delete it." }, { status: 404 });
        }

        return NextResponse.json({ message: "Template deleted successfully." }, { status: 200 });

    } catch (error) {
        console.error("API Error - Delete Template:", error);
        return NextResponse.json({ message: "Failed to delete template.", error: error.message }, { status: 500 });
    }
}