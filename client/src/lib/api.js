const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fetchApplications = async () => {
    try {
        const response = await fetch(`${API_URL}/api/all`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
};
