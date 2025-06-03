import { connectToDatabase } from "@lib/mongodb";
import bcrypt from 'bcryptjs';
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
    try{
        const {name,email,password,confirmPassword,companyId,role} = await request.json();
        if (!name || !email || !password || !confirmPassword || !companyId|| !role) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }
    const {db} = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({email});
    if(existingUser){
        return NextResponse.json({message: 'User with this email already exists'},{status: 409});
    }

    const hashedPassword = await bcrypt.hash(password,12);

    const result = await usersCollection.insertOne({
        name,
        email,
        password: hashedPassword,
        companyId: new ObjectId(companyId),
        role,
        profilePicture: "",
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Registration successful!', userId: result.insertedId }, { status: 201 });

    }catch(error){
        console.error('Registration Error', error);
        return NextResponse.json({message:"An error occurred during registration",error:error.message},{status:500});
    }
}