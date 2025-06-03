import { NextResponse } from "next/server";
import { connectToDatabase } from "@lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@lib/authOptions";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || !session.user.companyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sections,
      placeholders,
      tags
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ message: "Template name is required." }, { status: 400 });
    }
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ message: "Template content (sections) is required." }, { status: 400 });
    }
    for (const section of sections) {
        if (!section.content || (section.content_type === 'quill_delta' && (!section.content.ops || section.content.ops.length === 0))) {
            return NextResponse.json({ message: "Section content cannot be empty." }, { status: 400 });
        }
    }

    const { db } = await connectToDatabase();

    const companyIdAsObjectId = new ObjectId(session.user.companyId);
    const userIdAsObjectId = new ObjectId(session.user.id);

    const newTemplateDocument = {
      name,
      description: description || "",
      company_id: companyIdAsObjectId,
      created_by_user_id: userIdAsObjectId,
      sections: sections.map(section => ({
        _id: new ObjectId(),
        title: section.title || null,
        order: section.order || 0,
        content_type: section.content_type || "quill_delta",
        content: section.content,
      })),
      placeholders: placeholders || [],
      tags: tags || [],
      version: 1,
      is_default_for_company: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('templates').insertOne(newTemplateDocument);

    if (!result.insertedId) {
        throw new Error("Failed to insert template into database.");
    }

    const savedTemplate = await db.collection('templates').findOne({ _id: result.insertedId });

    return NextResponse.json({ message: "Template saved successfully!", data: savedTemplate }, { status: 201 });

  } catch (error) {
    console.error("API Error - Save Template:", error);
    return NextResponse.json({ message: "Failed to save template.", error: error.message }, { status: 500 });
  }
}


export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    const companyIdAsObjectId = new ObjectId(session.user.companyId);

    const templates = await db.collection('templates')
                              .find({ company_id: companyIdAsObjectId })
                              .sort({ updated_at: -1 })
                              .toArray();

    return NextResponse.json(templates, { status: 200 });

  } catch (error) {
    console.error("API Error - Get Templates:", error);
    return NextResponse.json({ message: "Failed to fetch templates.", error: error.message }, { status: 500 });
  }
}