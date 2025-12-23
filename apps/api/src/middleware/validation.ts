//ValidateAmountfunction
export function validateAmountFunction(input: string): number | null{
    const amount=Number(input);
    if(!Number.isInteger(amount))return null;
    if (amount < 10_000 || amount > 5_000_000) return null;
  return amount; 
}

//validateTenureFunction
export function validateTenureFunction(input:string):number|null{
const  tenure=Number(input);
if(!Number.isInteger(tenure))return null;
if(tenure<6 || tenure>60)return null;
return tenure;
}
//validate income 
export function validateIncomeFunction(input : string):number|null{
    const income=Number(input);
    if(!Number.isInteger(income))return null;
    if(income < 5000)return null ;  //as it is not good for person to take loan in this low income
    return income
}