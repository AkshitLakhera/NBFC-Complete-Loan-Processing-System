import { client as prisma } from "@repo/db";
import axios from "axios";

//libraries installed:
//axios
//csv-parser 
// pdf-parse
//fs=file system, It is a built-in Node.js module that lets your code read, write, update, and delete files on your computer or server.

import path from "path";
import fs from "fs";
import csv from "csv-parser";
const pdfParse = require("pdf-parse");

//common functions:
async function getDocumentFromDB(loanId:number, type: string){
    const doc = await prisma.document.findFirst({
        where: {loanId, type}
    });

    if(!doc){
        throw new Error(`${type} document not found`);
    }

    return doc;
}

// cloudinary storage has a  public url for now:
async function getDocumentFromCloudinary(
    url: string
):Promise<Buffer>{
    const response = await axios.get(url,{
        responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
}

//for images only(adhaar pan salary slip maybe):
async function runOCR(filepath: string): Promise<string>{

    try{
    //download document from cloudinary.
    const fileBuffer = await getDocumentFromCloudinary(filepath);

    // 2. Convert to base64
    const base64 = fileBuffer.toString('base64')

    //ocr api:
    const ocrRes = await axios.post(
    'https://api.ocr.space/parse/image',
    new URLSearchParams({
        base64Image: `data:image/png;base64,${base64}`,
        language: 'eng',
    }),
    {
      headers: {
        apikey: process.env.OCR_API_KEY as string,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

    // 4. Return extracted text
    return ocrRes.data?.ParsedResults?.[0]?.ParsedText ?? ''
    }catch(err){
        console.log("OCR failed: ", err);
        return "";

    }

    //dummy data for now:
    // return `
    //     adhaar: 123456789120
    //     pan: ABCDE1234F
    //     name: preeti negi
    //     dob: 1975-08-12
    //     father: xyz negi
    // `
}

function extractField(text: string, regex: RegExp): string | null {
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : null;
}


//User extractor functions:
async function extractPAN(filepath: string) {
    
    const text = await runOCR(filepath);

    //can't check status of pan if active for now

    const pan =
    text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)?.[0] ?? null;

    const name =
    extractField(text, /Name\s*:?\s*(.+)/i);

    const dob =
    text.match(/(?:Date\s*of\s*Birth|DOB)\s*:?\s*(.+)/i)
      ?.[1]
      ?.trim() ?? null;

    const father =
    text.match(/Father(?:'s)?\s*Name\s*:?\s*(.+)/i)
      ?.[1]
      ?.trim() ?? null;

    return {pan, name, dob, father};
    //dummy data:
    // return {
    //     pan: "ABCDE1234F",
    //     name: "preeti negi",
    //     dob: "1975-08-12",
    //     father: "xyz negi",
    //     status: "ACTIVE"
    // }
    
}

async function extractAadhaar(filepath:string){
    const text = await runOCR(filepath);

    const aadhaar = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/)?.[0]?.replace(/\s+/g, '') ?? null;

    const name = extractField(text, /Name\s*:?\s*(.+)/i);

    //aadhaar me dus prakaar/formats se likha h dob
    const dob =
    text.match(
        /(?:Date\s*of\s*Birth|DOB|Year\s*of\s*Birth|YOB)\s*:?\s*([0-9]{2}[\/\-\.][0-9]{2}[\/\-\.][0-9]{4}|[0-9]{4})/i
    )
        ?.[1]
        ?.trim() ?? null;

    //gender bhi kr skte h:

    return {aadhaar, name, dob};

}

async function extractSalarySlip(filepath:string){
    const text = await runOCR(filepath);

    //matching results:
    const employeeName = extractField(text, /Name\s*:?\s*(.+)/i);
    const employerName = extractField(text, /Employer\s*:?\s*(.+)/i);
    const designation = extractField(text, /Designation\s*:?\s*(.+)/i);
    const incomeMatch = text.match(
    /(?:Net\s*Pay|Net\s*Salary|Salary)\s*:?\s*₹?\s*([0-9,]+)/i
    );

    //removing commas:  
    const monthlyIncome = incomeMatch
    ? Number(incomeMatch[1].replace(/,/g, ""))
    : null;

    return{
        employeeName,
        employerName,
        designation,
        monthlyIncome
    };

}


async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

async function extractBankStatement(filepath: string){
    //download pdf from cloudinary:
    const buffer = await getDocumentFromCloudinary(filepath);

    //extract text
    const text = await extractTextFromPDF(buffer);

    //to ensure pdf is text based not scanned photos for now.
    if (text.trim().length < 50) {
    throw new Error("Scanned or unreadable bank statement");
    }
   
    //account holder's name
    const accountHolderName =
    extractField(text, /Account\s*Holder\s*Name\s*:?\s*(.+)/i) ||
    extractField(text, /Customer\s*Name\s*:?\s*(.+)/i);

    // bank name (shyd nahi milega).
    // const bankName =
    // extractField(text, /Bank\s*Name\s*:?\s*(.+)/i);

    // salary credits
    const salaryMatches = [
        ...text.matchAll(/(?:SALARY|Salary|PAYROLL).*₹?\s*([0-9,]+)/g)
    ];

    const salaryCredits = salaryMatches.map(m =>
        Number(m[1].replace(/,/g, ""))
    );

    return {
    accountHolderName,
    salaryCredits
  };

}

//verifyPan -helper
//csv file must have a pan column:
async function panExistsinCSV(pan:string, csvFilePath:string):Promise<boolean>{
    return new Promise((resolve, reject)=>{
        let found = false;

        fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on(`data`, (row:{pan?: string})=>{
            if(row.pan?.trim().toUpperCase()===pan.trim().toUpperCase()){
                found = true;
            }
        })
        .on(`end`, ()=> resolve(found))
        .on(`error`, reject);
    });
}


//User verification functions:

export async function verifyPAN(loanId:number){
    //delete previous results:
    await prisma.verificationResult.deleteMany({
    where: { loanId, type: "PAN" }
    });

    //fetch document
    const doc = await getDocumentFromDB(loanId, "PAN");

    //extract info
    const extracted = await extractPAN(doc.filepath);

    let status: string= "VERIFIED";

    //check blurry  pan:
    if (!extracted.pan || !extracted.name|| !extracted.dob) {
    status= "REUPLOAD_REQUIRED";
    const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "PAN",
            status,
            result:{
                //nothing to save
            }
        }
     });
    return result;
    }

    //verify whether they are original or not from a csv file for now.
    const csvPathPan = path.join(__dirname, "../../data/original_pans.csv");

    const panExists = await panExistsinCSV(
        extracted.pan,
        csvPathPan
    );

    if(!panExists){
        status="REJECTED"
        const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "PAN",
            status,
            result:{
                //nothing to save
            }
        }
     });
    return result;    
    }

    //fetch user:
    const user = await prisma.user.findUnique({
        where: {id: doc.userId}
    });

    if(!user) throw new Error ("user not found");

    //checks:

    //ptaani yr kyu kr rahi hu m//safety check maybe agr pan trace nhi hua.
    const panFormatValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(extracted.pan);

    const nameMatch = extracted.name?.toLowerCase() === user.name?.toLowerCase();//abhi model me nahi h
    const dobMatch = extracted.dob == user.dob;//abhi model me nahi h

    //duplicate pan check:
    const duplicatePan = await prisma.user.findFirst({
        where:{
            pan_number: extracted.pan,
            id: {not: user.id}//if someone else has same pan
        }
    });

    //check blacklisted pan:


    //decision:
    if(!panFormatValid||!nameMatch || !dobMatch){
        status = "REUPLOAD_REQUIRED";
    }
    else if(duplicatePan){
        status = "ON_HOLD" //so that admin can act accordingly
    }

    //saving verfication result:
     const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "PAN",
            status,
            result:{
                pan:extracted.pan,
                panFormatValid: panFormatValid,
                panActive: true,//can't check if pan is active
                nameMatch: nameMatch,
                dobMatch: dobMatch,
                fatherName: extracted.father,
                duplicatePan: !!duplicatePan,//forcing it to be boolean
                blacklistedPan: false //for now
            }
        }
    });
    return result;
}


//csv file must have a aadhaar column:
async function aadhaarExistsinCSV(aadhaar:string, csvFilePath:string):Promise<boolean>{
    return new Promise((resolve, reject)=>{
        let found = false;

        fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on(`data`, (row:{aadhaar?: string})=>{
            if(row.aadhaar?.trim()===aadhaar.trim()){
                found = true;
            }
        })
        .on(`end`, ()=> resolve(found))
        .on(`error`, reject);
    });
}

export async function verifyAdhaar(loanId: number){
    //delete previous results:
    await prisma.verificationResult.deleteMany({
    where: { loanId, type: "AADHAAR" }
    });


    //fetch document
    const doc = await getDocumentFromDB(loanId, "AADHAAR");

    //extract info
    const extracted = await extractAadhaar(doc.filepath);

    let status: string= "VERIFIED"; 

    //check blurry aadhaar:
    if (!extracted.aadhaar || !extracted.name|| !extracted.dob) {
    status= "REUPLOAD_REQUIRED";
    const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "AADHAAR",
            status,
            result:{
                reason: "Blurry Image"
                //nothing to save
            }
        }
     });
    return result;
    };

    //verify whether they are original or not from a csv file for now.
    const csvPathAdhaar = path.join(__dirname, "original_aadhaars.csv");

    const aadhaarExists = await aadhaarExistsinCSV(
        extracted.aadhaar,
        csvPathAdhaar
    );

    if(!aadhaarExists){
        status="REJECTED";
        const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "AADHAAR",
            status,
            result:{
                reason: "INVALID AADHAAR"
                //nothing to save
            }
        }
     });
    return result;
    }


    //fetch user:
    const user = await prisma.user.findUnique({
        where: {id: doc.userId}
    });

    if(!user) throw new Error ("user not found");

    //checks:
    const aadhaarFormatValid = /^[0-9]{12}$/.test(extracted.aadhaar);
    const nameMatch = extracted.name?.toLowerCase() === user.name?.toLowerCase();//abhi model me nahi h
    const dobMatch = extracted.dob == user.dob;//abhi model me nahi h

    //decision:
    if(!aadhaarFormatValid||!nameMatch ||!dobMatch){
        status = "REUPLOAD_REQUIRED";
    }
    const result = await prisma.verificationResult.create({
        data:{
            loanId,
            type: "AADHAAR",
            status,
            result:{
                aadhaarFormatValid: aadhaarFormatValid,
                nameMatch: nameMatch,
                dobMatch: dobMatch,
            }
        }
    });
    
    if(status=="VERIFIED"){
        const aadhaarLast4 = extracted.aadhaar.slice(-4);
        await prisma.user.update({
            where: {id: user.id},
            data:{
                aadhaar_last_4: aadhaarLast4,
                aadhaar_verified: true
            }
        });
    };

    return result;

}

export async function verifySalarySlip(loanId: number){

    //delete previous:
    await prisma.verificationResult.deleteMany({
        where: {loanId, type: "SALARY_SLIP"}
    });

    //fetching salary slip from db
    const doc = await getDocumentFromDB(loanId, "SALARY_SLIP");

    //extract data via ocr api:
    const extracted = await extractSalarySlip(doc.filepath);

    //status can be only these three and initially it is verified.
    let status: "VERIFIED" | "REUPLOAD_REQUIRED" | "ON_HOLD" = "VERIFIED";


    if(!extracted.employeeName || !extracted.employerName|| !extracted.monthlyIncome){
        status = "REUPLOAD_REQUIRED";

    return prisma.verificationResult.create({
        data:{
            loanId,
            type: "SALARY_SLIP",
            status,
            result:{
                reason: "Missing/ unreadable fields"
            }
        }
    });
    }

    //fetch user
    const user = await prisma.user.findUnique({
        where: {id: doc.userId}
    });

    if(!user) throw new Error("User not found");

    //name check:
    const nameMatch = extracted.employeeName.toLowerCase() === user.name?.toLowerCase();
    if (!nameMatch) {
    status = "REUPLOAD_REQUIRED";
    }
    // save verification result
    const result = await prisma.verificationResult.create({
        data: {
        loanId,
        type: "SALARY_SLIP",
        status,
        result: {
            employeeName: extracted.employeeName,
            employerName: extracted.employerName,
            designation: extracted.designation,
            monthlyIncome: extracted.monthlyIncome,
        }
        }
    });

    //employer name and income save krna tha pr schema me nahi h.
    //to be used by bank statement later on

  return result;

}


export async function verifyBankStatement(loanId:number){
    //delete old entries
    await prisma.verificationResult.deleteMany({
        where: {loanId, type: "BANK_STATEMENT"}
    });

    const doc = await getDocumentFromDB(loanId, "BANK_STATEMENT");

    let extracted;
    try{
        extracted = await extractBankStatement(doc.filepath);
    }catch(err){
        return prisma.verificationResult.create({
            data: {
                loanId,
                type:"BANK_STATEMENT",
                status:"REUPLOAD_REQUIRED",
                result:{
                    reason: "Uploaded pdf is unreadable"
                }
            }
        });
    }

    let status: "VERIFIED"|"REUPLOAD_REQUIRED"|"ON_HOLD" = "VERIFIED";

    //if enough salary credits weren't found or 
    if(!extracted.accountHolderName|| extracted.salaryCredits.length ===0){
        status = "REUPLOAD_REQUIRED";
         return prisma.verificationResult.create({
            data: {
                loanId,
                type:"BANK_STATEMENT",
                status:"REUPLOAD_REQUIRED",
                result:{
                    reason: "Unable to extract account holder or salary credits"
                }
            }
        });

    }

    const user = await prisma.user.findUnique({
        where: { id: doc.userId }
        });
    if (!user) throw new Error("User not found");

    //name match not so strict.
   const nameMatch = extracted.accountHolderName.toLowerCase().includes(user.name?.toLowerCase() ?? "");

    if (!nameMatch) {
        status = "REUPLOAD_REQUIRED";
    }

    const salaried = extracted.salaryCredits.length >= 2;
    if (!salaried) {
         return prisma.verificationResult.create({
            data: {
                loanId,
                type:"BANK_STATEMENT",
                status:"ON_HOLD",
                result:{
                    reason: "not enough salary credits"
                }
            }
        });
  }
    //average salary:
    const avgSalary = extracted.salaryCredits.reduce((a, b) => a + b, 0) / extracted.salaryCredits.length;

    //store results:
    return prisma.verificationResult.create({
        data: {
        loanId,
        type: "BANK_STATEMENT",
        status,
        result: {
            accountHolderName: extracted.accountHolderName,
            salaryCredits: extracted.salaryCredits,
            averageSalary: Math.round(avgSalary),
            salaried: true,
            nameMatch: nameMatch
        }
        }
    });

}


export async function emailVerification(){

}

export async function phoneVerification(){

}

export async function cibilVerification(){
//idk how yet
}

export async function EmployerVerification(){
//not now
}


//verification status:

export async function verificationStatus(loanId:number){

}


//Admin functions:

export async function verifyPendingsList(){

}

export async function verificationSummaryList() {
    
}

export async function verficationStatus(){

}

export async function verificationOverride(){

}

export async function viewUserDocument(){

}

//also verifies employment status and salary slip via contacting employer.
export async function verifyEmployer() {
    //checks if employer verification is done from db
}