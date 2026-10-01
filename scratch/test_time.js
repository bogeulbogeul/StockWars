import { timeOfDayService } from '../web/js/engine/timeOfDayService.js';

const testDate = new Date('2026-10-01T19:34:37+09:00');
const calculated = timeOfDayService.calculateTimeOfDay(testDate);
const sunTimes = timeOfDayService.getSunTimes(testDate);

console.log('--- Time Of Day Test ---');
console.log('Test Date:', testDate.toLocaleString());
console.log('Sunrise (approx):', Math.floor(sunTimes.sunrise) + ':' + Math.round((sunTimes.sunrise % 1) * 60));
console.log('Sunset (approx):', Math.floor(sunTimes.sunset) + ':' + Math.round((sunTimes.sunset % 1) * 60));
console.log('Calculated Stage:', calculated);
