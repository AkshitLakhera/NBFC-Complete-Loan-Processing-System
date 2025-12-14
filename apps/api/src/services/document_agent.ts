import prisma from "../prisma_client/client";
interface SaveDocumentInput {
  type: string;
  filepath: string;
  userId: number;
  loanId: number;
}

export async function saveDocument(input:SaveDocumentInput) {
//     It does NOT upload file ❌
//     It ONLY saves record in DB
//     It saves:
//     document type (PAN)
//     Cloudinary URL
//     userId
//     loanId
//     status = UPLOADED
//     👉 Meaning:
//  “This document exists, and this is where it is stored.”

const { type, filepath, userId, loanId } = input;
 // Verify the Cloudinary URL is accessible
  let status = "UPLOADED";
  
  try {
    const response = await fetch(filepath, { method: 'HEAD' });
    
    if (!response.ok) {
      status = "FAILED";
      console.error(`Cloudinary URL verification failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error verifying Cloudinary URL:", error);
    status = "FAILED";
  }
  
  const document = await prisma.document.create({
    data: {
      type,
      filepath,
      status,
      userId,
      loanId,
    },
  });
  
  return document;
  


}

interface SaveSanctionLetterInput {
  filepath: string;
  userId: number;
  loanId: number;
}

export async function generateSanctionLetter(input: SaveSanctionLetterInput){
//     What happens here?
// Fetch loan + user data from DB
// Create a PDF file (using PDFKit)
// Upload that PDF to Cloudinary
// Cloudinary returns a URL


}

export async function storeGeneratedDocument(){

//  What this function does
// It:
// takes Cloudinary URL from generated doc
// saves it in DB
// status = GENERATED
// type = SANCTION_LETTER

}