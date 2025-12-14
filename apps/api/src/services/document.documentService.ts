import prisma from "../prisma_client/client";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { uploadImage } from "./document.uploadDocument";


interface SaveDocumentInput {
  type: string;
  filepath: string;
  userId: number;
  loanId: number;
}
interface SaveGeneratedDocumentInput {
  type: string;      // SANCTION_LETTER
  filePath: string; // from generateSanctionLetter
  userId: number;
  loanId: number;
}

export const documentService ={
  
 async  saveUploadedDocument(input:SaveDocumentInput) {
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

  return await prisma.document.create({
    data: {
      type,
      filepath,
      status: "UPLOADED",
      userId,
      loanId,
    },
  });
},


 async  generateSanctionLetter(
  loanId: number
): Promise<string> {

  // This function ONLY generates PDF and returns the buffer
// Does NOT upload to Cloudinary
// Does NOT save to database
  // 1. Fetch loan + user + underwriting
  // 1️⃣ Fetch loan + underwriting
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      user: true,
      underwriting: true,
    },
  });

  // 2️⃣ Approval check (MANDATORY)
  if (!loan) {
    throw new Error("Loan not found");
  }

  if (!loan.underwriting || loan.underwriting.approved !== true) {
    throw new Error("Loan not approved");
  }

  // 3️⃣ Prepare local file path
  const tempDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tempDir, { recursive: true });

  const filePath = path.join(
    tempDir,
    `loan_${loan.id}_sanction_letter.pdf`
  );

  // 4️⃣ Generate PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("LOAN SANCTION LETTER", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  doc.text(`Dear ${loan.user?.name ?? "Customer"},`);
  doc.moveDown();

  doc.text(
    "We are pleased to inform you that your loan application has been approved."
  );
  doc.moveDown();

  doc.text(`Loan Amount   : ₹${loan.amount}`);
  doc.text(`Loan Type     : ${loan.type}`);
  doc.text(`Tenure        : ${loan.tenure_months} months`);
  doc.moveDown();

  doc.text("Thank you for choosing our NBFC.");
  doc.moveDown(2);

  doc.text("Authorized Signatory");

  doc.end();

  // 5️⃣ Return local file path ONLY
  return filePath;
}
,

 async  saveGeneratedDocument(input: SaveGeneratedDocumentInput){

// After generation
// Upload generated PDF to Cloudinary
// Get URL
// Save record in DB
// Status = GENERATED

  const { type, filePath, userId, loanId } = input;

  // 1️⃣ Upload PDF to Cloudinary
  const cloudinaryUrl = await uploadImage(filePath);
   // 2. Check if upload was successful
  if (!cloudinaryUrl) {
    throw new Error("Failed to upload PDF to Cloudinary");
  }

  // 3. Verify the Cloudinary URL is accessible
  let status = "UPLOADED";

  try {
    const response = await fetch(cloudinaryUrl, { method: "HEAD" });

    if (!response.ok) {
      status = "FAILED";
      console.error(
        `Cloudinary URL verification failed with status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("Error verifying Cloudinary URL:", error);
    status = "FAILED";
  }

  // 2️⃣ Save document metadata
  const document = await prisma.document.create({
    data: {
      type,
      filepath: cloudinaryUrl,
      status: status,
      userId,
      loanId,
    },
  });

  return document;
}

}
