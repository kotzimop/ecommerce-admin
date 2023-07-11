import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import crypto from "crypto";
import axios from "axios";

// DELETE IMAGE FROM CLOUDINARY
const createBaseForDeleteImage = (cloudinarUrl: string) => {
  const regex = /\/v\d+\/([^/]+)\.\w{3,4}$/;
  let cloudinaryUrl = cloudinarUrl;
  const getPublicIdFromUrl = (url: string) => {
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const publicId = getPublicIdFromUrl(cloudinaryUrl!);

  const generateSHA1 = (data: any) => {
    const hash = crypto.createHash("sha1");
    hash.update(data);
    return hash.digest("hex");
  };

  const generateSignature = (publicId: string, apiSecret: string) => {
    const timestamp = new Date().getTime();
    return `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  };

  const handleDeleteImage = async (publicId: string) => {
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

  handleDeleteImage(publicId!);
};

// END OF DELETE IMAGE FROM CLOUDINARY

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  const fetch_product = await prismadb.product.findUnique({
    where: {
      id: params.productId,
    },
    include: {
      images: true,
    },
  });

  try {
    const { userId } = auth();
    const body = await req.json();
    const {
      name,
      price,
      categoryId,
      colorId,
      sizeId,
      images,
      isFeatured,
      isArchived,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!price) {
      return new NextResponse("Price is required", { status: 400 });
    }

    if (!images || !images.length) {
      return new NextResponse("Image is required", { status: 400 });
    }

    if (!categoryId) {
      return new NextResponse("Category id required", { status: 400 });
    }

    if (!sizeId) {
      return new NextResponse("Size id required", { status: 400 });
    }

    if (!colorId) {
      return new NextResponse("Color id required", { status: 400 });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (fetch_product?.images.length! > images.length) {
      fetch_product?.images.forEach((obj: { url: string }) => {
        images.forEach((url: { url: string }) => {
          if (obj.url !== url.url) {
            createBaseForDeleteImage(obj.url);
          }
        });
      });
    }

    await prismadb.product.update({
      where: {
        id: params.productId,
      },
      data: {
        name,
        price,
        categoryId,
        colorId,
        sizeId,
        isFeatured,
        isArchived,
        images: {
          deleteMany: {},
        },
      },
    });

    const product = await prismadb.product.update({
      where: {
        id: params.productId,
      },
      data: {
        images: {
          createMany: {
            data: [...images.map((image: { url: string }) => image)],
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCT_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const fetch_product = await prismadb.product.findUnique({
      where: {
        id: params.productId,
      },
      include: {
        images: true,
      },
    });

    fetch_product?.images.forEach((image: { url: string }) => {
      let cloudinaryUrl = image.url;
      createBaseForDeleteImage(cloudinaryUrl);
    });

    const product = await prismadb.product.deleteMany({
      where: {
        id: params.productId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: {
        id: params.productId,
      },
      include: {
        images: true,
        category: true,
        size: true,
        color: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCT_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
