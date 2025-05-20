import { testRunpodModels } from '../../services/runpod';

export async function GET() {
  try {
    const models = await testRunpodModels();
    return Response.json({ success: true, models });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
} 