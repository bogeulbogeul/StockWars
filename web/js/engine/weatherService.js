/**
 * Weather Service & Real-time Local Weather Provider
 * Unity equivalent: RainVFXController.cs / WeatherSystem.cs
 * Fetches real-time weather using HTML5 Geolocation + Open-Meteo Open API (Free, No Key).
 * Supports WMO Weather Code translation, temperature, and day/night detection.
 */

const WMO_CODES = {
    0: { text: '맑음', dayIcon: '☀️', nightIcon: '🌙' },
    1: { text: '대체로 맑음', dayIcon: '🌤️', nightIcon: '🌤️' },
    2: { text: '구름 조금', dayIcon: '⛅', nightIcon: '☁️' },
    3: { text: '흐림', dayIcon: '☁️', nightIcon: '☁️' },
    45: { text: '안개', dayIcon: '🌫️', nightIcon: '🌫️' },
    48: { text: '짙은 안개', dayIcon: '🌫️', nightIcon: '🌫️' },
    51: { text: '이슬비', dayIcon: '🌧️', nightIcon: '🌧️' },
    53: { text: '이슬비', dayIcon: '🌧️', nightIcon: '🌧️' },
    55: { text: '강한 이슬비', dayIcon: '🌧️', nightIcon: '🌧️' },
    61: { text: '약한 비', dayIcon: '🌧️', nightIcon: '🌧️' },
    63: { text: '비', dayIcon: '🌧️', nightIcon: '🌧️' },
    65: { text: '강한 비', dayIcon: '🌧️', nightIcon: '🌧️' },
    71: { text: '약한 눈', dayIcon: '❄️', nightIcon: '❄️' },
    73: { text: '눈', dayIcon: '❄️', nightIcon: '❄️' },
    75: { text: '폭설', dayIcon: '❄️', nightIcon: '❄️' },
    77: { text: '싸락눈', dayIcon: '❄️', nightIcon: '❄️' },
    80: { text: '소나기', dayIcon: '🌦️', nightIcon: '🌦️' },
    81: { text: '강한 소나기', dayIcon: '🌧️', nightIcon: '🌧️' },
    82: { text: '폭우', dayIcon: '⛈️', nightIcon: '⛈️' },
    85: { text: '약한 눈보라', dayIcon: '🌨️', nightIcon: '🌨️' },
    86: { text: '강한 눈보라', dayIcon: '🌨️', nightIcon: '🌨️' },
    95: { text: '뇌우', dayIcon: '⛈️', nightIcon: '⛈️' },
    96: { text: '뇌우 및 우박', dayIcon: '⛈️', nightIcon: '⛈️' },
    99: { text: '강한 뇌우', dayIcon: '⛈️', nightIcon: '⛈️' }
};

class WeatherService {
    constructor() {
        this.currentWeather = {
            city: '로컬',
            temp: 22,
            weatherCode: 0,
            text: '맑음',
            icon: '☀️',
            isDay: true,
            humidity: 50
        };
        this.listeners = new Set();
        this.updateInterval = null;
    }

    async init() {
        await this.fetchLocalWeather();
        // Update weather every 20 minutes
        this.updateInterval = setInterval(() => this.fetchLocalWeather(), 20 * 60 * 1000);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.currentWeather);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(fn => fn(this.currentWeather));
    }

    async fetchLocalWeather() {
        try {
            const coords = await this.getCoordinates();
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code&timezone=auto`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

            const data = await response.json();
            const current = data.current;

            const code = current.weather_code || 0;
            const isDay = current.is_day === 1;
            const wmo = WMO_CODES[code] || { text: '맑음', dayIcon: '☀️', nightIcon: '🌙' };
            const icon = isDay ? wmo.dayIcon : wmo.nightIcon;

            this.currentWeather = {
                city: coords.city || '로컬',
                temp: Math.round(current.temperature_2m),
                humidity: current.relative_humidity_2m,
                weatherCode: code,
                text: wmo.text,
                icon: icon,
                isDay: isDay
            };

            this.notify();
        } catch (error) {
            console.warn('[WeatherService] Using fallback local weather:', error.message);
            // Fallback: estimate day/night and reasonable temp
            const now = new Date();
            const isDay = now.getHours() >= 6 && now.getHours() < 19;
            this.currentWeather = {
                city: '서울',
                temp: 21,
                humidity: 45,
                weatherCode: 0,
                text: isDay ? '맑음' : '맑은 밤',
                icon: isDay ? '☀️' : '🌙',
                isDay: isDay
            };
            this.notify();
        }
    }

    getCoordinates() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude.toFixed(4),
                            lon: position.coords.longitude.toFixed(4),
                            city: '현재 위치'
                        });
                    },
                    () => {
                        // Geolocation denied or unavailable -> Default to Seoul (37.5665, 126.9780)
                        resolve({
                            lat: '37.5665',
                            lon: '126.9780',
                            city: '서울'
                        });
                    },
                    { timeout: 5000 }
                );
            } else {
                resolve({
                    lat: '37.5665',
                    lon: '126.9780',
                    city: '서울'
                });
            }
        });
    }
}

export const weatherService = new WeatherService();
