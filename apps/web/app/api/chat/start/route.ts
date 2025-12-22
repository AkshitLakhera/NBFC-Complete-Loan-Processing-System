import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await axios.post('http://localhost:3002/chat/start');
    return NextResponse.json({ 
      sessionId: response.data.sessionId,
      userId: response.data.userId // Include userId if backend returns it
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}