// import axios from 'axios';
// import { NextResponse } from 'next/server';

// export async function GET(
//   req: Request,
//   { params }: { params: { loanId: string } }
// ) {
//   try {
//     const { loanId } = params;

//     if (!loanId) {
//       return NextResponse.json(
//         { error: 'Loan ID is required' },
//         { status: 400 }
//       );
//     }

//     const response = await axios.get(`http://localhost:3001/documents/${loanId}`);
    
//     return NextResponse.json({
//       documents: response.data.documents || [],
//       loanId: loanId
//     });
//   } catch (error: any) {
//     console.error('Error fetching documents:', error);
    
//     if (error.response?.status === 404) {
//       return NextResponse.json(
//         { error: 'Loan not found', documents: [] },
//         { status: 404 }
//       );
//     }
    
//     return NextResponse.json(
//       { error: 'Failed to fetch documents' },
//       { status: 500 }
//     );
//   }
// }