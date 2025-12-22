import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sessionId, message } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing sessionId or message' },
        { status: 400 }
      );
    }

    const response = await axios.post('http://localhost:3002/chat/message', {
      sessionId,
      message
    });

    return NextResponse.json({ 
      reply: response.data.reply,
      loanId: response.data.loanId // Include loanId if backend returns it
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}