import { weatherService } from '../engine/weatherService.js';

export const TOWN_WEATHER_PROFILES = {
    clear: { tint: '#9faeb9', blend: 0, precipitation: 0 },
    partly_cloudy: { tint: '#aab9c5', blend: .12, precipitation: 0 },
    overcast: { tint: '#8d9eac', blend: .55, precipitation: 0 },
    rain: { tint: '#778b9f', blend: .65, precipitation: 1 },
    snow: { tint: '#b1becb', blend: .62, precipitation: 2 }
};

export function townWeather(scene) {
    const category = scene.userData.townWeather ?? weatherService.currentWeather.category;
    if (category === 'thunderstorm') return 'rain';
    return TOWN_WEATHER_PROFILES[category] ? category : 'clear';
}
