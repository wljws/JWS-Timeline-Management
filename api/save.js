import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const payload = req.body;
        
        // Save the JSON payload to Vercel KV under the key 'timeline_data'
        // If you want multi-user support later, you can make this key dynamic (e.g., based on a session token)
        await kv.set('timeline_data', payload);
        
        return res.status(200).json({ success: true, message: 'Saved successfully' });
    } catch (error) {
        console.error('KV Save Error:', error);
        return res.status(500).json({ error: 'Failed to save data' });
    }
}
