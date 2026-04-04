import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Retrieve the data from Vercel KV
        const data = await kv.get('timeline_data');
        
        if (!data) {
            // Return 404 if no data has ever been saved
            return res.status(404).json({ error: 'No data found' });
        }
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('KV Load Error:', error);
        return res.status(500).json({ error: 'Failed to load data' });
    }
}
