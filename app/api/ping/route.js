import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json(
    { status: 'Success', message: 'CenterInsider backend is awake' },
    { status: 200 }
  );
}
