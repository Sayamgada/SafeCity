import { getDashboardData } from '../../../lib/getDashboardData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDashboardData();
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error('Failed to load dashboard data', error);
    return Response.json({ message: 'Failed to load dashboard data' }, { status: 500 });
  }
}
