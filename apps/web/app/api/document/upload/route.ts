export const runtime = 'nodejs';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  console.log("we  are inside post request for upload")
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const loanId = formData.get('loanId') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId || !loanId) {
      return NextResponse.json(
        { error: 'Missing userId or loanId' },
        { status: 400 }
      );
    }

    // Forward the file to Express backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('userId', userId);
    backendFormData.append('loanId', loanId);
    backendFormData.append('type', type || 'DOCUMENT');

    const response = await fetch(`${process.env.Db_url}/documents/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Upload failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message,
      url: data.url,
      documentId: data.documentId
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}