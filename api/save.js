import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Security check: Only allow POST requests (which are used for sending data)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        // req.body.projects contains the timeline data sent from your HTML file
        // This saves it to the KV database under the label "timeline_data"
        await kv.set('timeline_data', req.body.projects);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save data' });
    }
}
