import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    try {
        // Fetch the project data from the "timeline_data" label in your database
        const data = await kv.get('timeline_data');
        res.status(200).json({ projects: data || null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load data' });
    }
}
