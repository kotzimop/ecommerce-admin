import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import crypto from "crypto";
import axios from "axios";

export async function PATCH(
    req: Request,
    {params} : {params: {storeId:string, billboardId: string}}
) {
    try {
        const {userId} = auth()
        const body = await req.json();
        const {label, imageUrl} = body

        if(!userId) {
           return new NextResponse("Unauthenticated", {status: 401}) 
        }

        if(!label) {
            return new NextResponse("Label is required", {status: 400})
        }

        if(!imageUrl) {
            return new NextResponse("Image URL is required", {status: 400})
        }

        if(!params.billboardId) {
            return new NextResponse("Billboard id is required", {status: 400})
        }

        const storeByUserId = await prismadb.store.findFirst({
            where:{
                id: params.storeId,
                userId
            }
        })

        if(!storeByUserId) {
            return new NextResponse('Unauthorized', {status:403})
        }

        const billboard = await prismadb.billboard.updateMany({
            where: {
                id: params.billboardId,
            },
            data:{
                label,
                imageUrl
            }
        })

        return NextResponse.json(billboard)
        
    } catch (error) {
        console.log("[BILLBOARD_PATCH]", error);
        return new NextResponse("Internal Server Error", {status:500})
    }
}

export async function DELETE(
    req: Request,
    {params}: {params: {storeId:string, billboardId: string}}
) {
    try {
        const {userId} = auth()

        if(!userId) {
           return new NextResponse("Unauthenticated", {status: 401}) 
        }

        if(!params.billboardId) {
            return new NextResponse("Billboard id is required", {status: 400})
        }

        const storeByUserId = await prismadb.store.findFirst({
            where:{
                id: params.storeId,
                userId
            }
        })

        if(!storeByUserId) {
            return new NextResponse('Unauthorized', {status:403})
        }

        const fetch_billboard = await prismadb.billboard.findUnique({
            where: {
                id: params.billboardId,
            },
        })

        // DELETE IMAGE FROM CLOUDINARY

        const regex = /\/v\d+\/([^/]+)\.\w{3,4}$/;
        const cloudinaryUrl = fetch_billboard?.imageUrl
        const getPublicIdFromUrl = (url:string) => {

        const match = url.match(regex);
            return match ? match[1] : null;
          };
          
        const publicId = getPublicIdFromUrl(cloudinaryUrl!);

        const generateSHA1 =(data: any) => {
            const hash = crypto.createHash("sha1");
            hash.update(data);
            return hash.digest("hex");
        }
        
        const generateSignature = (publicId: string, apiSecret: string) => {
            const timestamp = new Date().getTime();
            return `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
        };

        const handleDeleteImage = async (publicId:string) => {
            const cloudName = process.env.CLOUDINARY_NAME;
            const timestamp = new Date().getTime();
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            const signature = generateSHA1(generateSignature(publicId, apiSecret!));
            const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
          
            try {
              const response = await axios.post(url, {
                public_id: publicId,
                signature: signature,
                api_key: apiKey,
                timestamp: timestamp,
              });
          
              console.error(response);
          
            } catch (error) {
              console.error(error);
            }
          };

        // END OF DELETE IMAGE FROM CLOUDINARY



        const billboard = await prismadb.billboard.deleteMany({
            where: {
                id: params.billboardId,
            },
        })
        handleDeleteImage(publicId!)
        return NextResponse.json(billboard)
        
    } catch (error) {
        console.log("[BILLBOARD_DELETE]", error);
        return new NextResponse("Internal Server Error", {status:500})
    }

   
}

export async function GET(
    req: Request,
    {params}: {params: {billboardId: string}}
) {
    try {

        if(!params.billboardId) {
            return new NextResponse("Billboard id is required", {status: 400})
        }

        const billboard = await prismadb.billboard.findUnique({
            where: {
                id: params.billboardId,
            },
        })

        return NextResponse.json(billboard)
        
    } catch (error) {
        console.log("[BILLBOARD_GET]", error);
        return new NextResponse("Internal Server Error", {status:500})
    }
}