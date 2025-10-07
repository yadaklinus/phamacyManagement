import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/oflinePrisma";

export async function POST(
  req: NextRequest
  
) {
   const {id} = await req.json()
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: id,isDeleted:false
      },
      include: {
        warehouses: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest
  
) {
  try {
    const {
      productName: name,
      productDescription: description,
      productQuantity: quantity,
      productTaxRate: taxRate,
      productUnit: unit,
      wholeSalePrice,
      retailPrice,
      costPrice: cost,
      id
    } = await req.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id,isDeleted:false },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: id,isDeleted:false },
      data: {
        name,
        wholeSalePrice: parseFloat(wholeSalePrice),
        retailPrice: parseFloat(retailPrice),
        cost: parseFloat(cost),
        taxRate: parseInt(taxRate),
        unit,
        quantity: parseInt(quantity),
        description,
        sync:false
      },
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // Check if product exists
//     const product = await prisma.product.findUnique({
//       where: { id: params?.id },
//     });

//     if (!product) {
//       return NextResponse.json(
//         { error: "Product not found" },
//         { status: 404 }
//       );
//     }

//     // Check if product is used in any sales or purchases
//     const saleItems = await prisma.saleItem.findMany({
//       where: { productId: product.barcode }, // Using barcode as foreign key
//     });

//     const purchaseItems = await prisma.purchaseItem.findMany({
//       where: { productId: product.barcode }, // Using barcode as foreign key
//     });

//     if (saleItems.length > 0 || purchaseItems.length > 0) {
//       return NextResponse.json(
//         { error: "Cannot delete product. It has associated sales or purchase records." },
//         { status: 400 }
//       );
//     }

//     const deletedProduct = await prisma.product.delete({
//       where: { id: params?.id },
//     });

//     return NextResponse.json(deletedProduct, { status: 200 });
//   } catch (error) {
//     console.error("Error deleting product:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }