/**
 * Extract city from address string
 * Handles various address formats common in West Bengal
 */
export function extractCityFromAddress(address: string): string {
    if (!address) return 'Unknown';

    // Clean the address
    const cleaned = address.trim();

    // Common West Bengal cities
    const wbCities = [
        'Kolkata', 'Siliguri', 'Durgapur', 'Asansol', 'Bardhaman', 'Burdwan',
        'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Raiganj',
        'Jalpaiguri', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Haldia',
        'Howrah', 'Barrackpore', 'Barasat', 'Bhatpara', 'Chandannagar',
        'Serampore', 'Ranaghat', 'Bankura', 'Purulia', 'Cooch Behar',
        'Alipurduar', 'Darjeeling', 'Kalimpong', 'Balurghat', 'English Bazar',
        'Jangipur', 'Tamluk', 'Contai', 'Egra', 'Ghatal', 'Jhargram',
        'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad' // Major cities
    ];

    // Try to find city name in address (case-insensitive)
    for (const city of wbCities) {
        const regex = new RegExp(`\\b${city}\\b`, 'i');
        if (regex.test(cleaned)) {
            return city;
        }
    }

    // Try to extract from comma-separated format
    // Format: "Street, Area, City, State PIN"
    const parts = cleaned.split(',').map(p => p.trim());

    if (parts.length >= 2) {
        // Usually city is second-to-last part (before state/PIN)
        const cityPart = parts[parts.length - 2];
        // Remove PIN code if present
        const cityWithoutPin = cityPart.replace(/\d{6}/, '').trim();

        // Check if extracted part matches known cities
        for (const city of wbCities) {
            if (cityWithoutPin.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }

        // If no match, return the extracted part
        if (cityWithoutPin && cityWithoutPin.length > 2) {
            return cityWithoutPin;
        }
    }

    // Last resort: return first part if it looks like a city name
    if (parts.length > 0) {
        const firstPart = parts[0].replace(/\d{6}/, '').trim();
        if (firstPart.length > 3 && !/^\d+/.test(firstPart)) {
            return firstPart;
        }
    }

    return 'Unknown';
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}
