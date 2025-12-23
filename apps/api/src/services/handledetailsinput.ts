import {prisma} from "../prisma_client/client";
import { KycStep, LoanStatus } from "@prisma/client";
import { validateAmountFunction ,validateIncomeFunction ,validateTenureFunction } from "../middleware/validation";
export type DetailsResult =
  | { success: true }
  | { success: false; error: string };
export async function handleDetailsInput(
    loandId:number,
    subState: "AMOUNT_PENDING" | "TENURE_PENDING" | "INCOME_PENDING",
    message: string
):Promise<DetailsResult>{  


if(subState=="AMOUNT_PENDING"){
    const amount=validateAmountFunction(message);
    if(!amount){
        return {success:false,error:"Please enter right amount"};
}
//now update loan
await prisma.loan.update({
    where:{id:loandId},
    data:{
        amount  
    },
})
return { success : true};
}

if(subState=="TENURE_PENDING"){
    const tenure=validateTenureFunction(message);
    if(!tenure){
        return {success:false,error:"Please enter the tenure  in  correct format"};
    }
    //if correct format
    await prisma.loan.update({
        where:{id:loandId},
        data:{
            tenure_months:tenure
        },
    })
    return {success:true};
}
if(subState=="INCOME_PENDING"){
    const income=validateIncomeFunction(message);
    if(!income){
        return {success:false,error:"Please enter the the income in correct format"};
    }
    //if correct
    await prisma.loan.update({
        where:{id:loandId},
        data:{
            monthly_income:income,
        }  
    })
    return { success: true};
}
return { success: false, error: "Unexpected input." };

}