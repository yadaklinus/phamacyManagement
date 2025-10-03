import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      code,
      name,
      category,
      manufacturer,
      description,
      activeIngredient,
      strength,
      dosageForm,
      quantity,
      reorderLevel,
      price,
      cost,
      expiryDate,
      batchNumber,
      unit,
      storageConditions,
      prescriptionRequired,
      
      createdBy
    } = data;

    // Validate required fields
    if (!name || !category || !manufacturer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, category, manufacturer are required' 
      }, { status: 400 });
    }

    // Check if warehouse exists
    

   

    // Generate code if not provided
    let drugCode = code;
    if (!drugCode) {
      const prefix = category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      drugCode = `${prefix}${timestamp}`;
    }

    // Check if drug code already exists in this warehouse
    const existingDrug = await prisma.drug.findFirst({
      where: {
        code: drugCode,
       
        isDeleted: false
      }
    });

    if (existingDrug) {
      return NextResponse.json({ 
        success: false, 
        message: 'Drug code already exists in this warehouse' 
      }, { status: 409 });
    }

    // Create the drug
    const drug = await prisma.drug.create({
      data: {
        code: drugCode,
        name,
        category,
        manufacturer,
        description: description || '',
        activeIngredient: activeIngredient || '',
        strength: strength || '',
        dosageForm: dosageForm || '',
        quantity: parseInt(quantity) || 0,
        reorderLevel: parseInt(reorderLevel) || 0,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        expiryDate: new Date(expiryDate),
        batchNumber: batchNumber || '',
        unit: unit || 'Pieces',
        storageConditions: storageConditions || '',
        prescriptionRequired: prescriptionRequired || false,
       
        createdBy: createdBy || 'system',
        sync: false,
        syncedAt: null
      }
    });

    return NextResponse.json({ success: true, drug }, { status: 201 });
  } catch (error:any) {
    console.error('Error creating drug:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create drug: ' + error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}