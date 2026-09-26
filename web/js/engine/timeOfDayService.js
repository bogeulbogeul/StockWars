/**
 * TimeOfDayService
 * Manages game & real-time sky day/night/twilight cycles.
 * Smoothly synchronizes OfficeStage and TownStage atmospheric backgrounds.
 */

export const TIME_OF_DAY = {
    DAWN: 'dawn',     // 05:00 - 08:59 (새벽/아침: 연보라~연핑크~연노랑)
    DAY: 'day',       // 09:00 - 17:59 (맑은 낮: 상쾌한 하늘색~화사한 톤)
    SUNSET: 'sunset', // 18:00 - 20:59 (노을/황혼: 딥 바이올렛~코랄~골드)
    NIGHT: 'night'    // 21:00 - 04:59 (별밤: 딥 네이비~별빛)
};

export const TIME_METADATA = {
    [TIME_OF_DAY.DAWN]: {
        key: TIME_OF_DAY.DAWN,
        label: '새벽 / 아침',
        icon: '🌅',
        asset: 'assets/sky/sky_dawn.png',
        ambientColor: 'rgba(255, 235, 205, 0.15)',
        desc: '상쾌한 하루의 시작, 부드러운 새벽 파스텔 하늘'
    },
    [TIME_OF_DAY.DAY]: {
        key: TIME_OF_DAY.DAY,
        label: '맑은 낮',
        icon: '☀️',
        asset: 'assets/sky/sky_day.png',
        ambientColor: 'rgba(255, 255, 255, 0.1)',
        desc: '화사하고 맑은 주식 개장 시간대'
    },
    [TIME_OF_DAY.SUNSET]: {
        key: TIME_OF_DAY.SUNSET,
        label: '저녁 노을',
        icon: '🌇',
        asset: 'assets/sky/sky_sunset.png',
        ambientColor: 'rgba(255, 140, 90, 0.2)',
        desc: '장 마감 후 붉게 물드는 황혼의 오렌지-바이올렛'
    },
    [TIME_OF_DAY.NIGHT]: {
        key: TIME_OF_DAY.NIGHT,
        label: '별빛 밤',
        icon: '🌙',
        asset: 'assets/sky/sky_night.png',
        ambientColor: 'rgba(10, 20, 50, 0.4)',
        desc: '별들이 수놓인 고요한 도심의 야경'
    }
};

class TimeOfDayService {
    constructor() {
        this.currentTime = this.calculateTimeOfDay(new Date());
        this.isManual = false;
        this.listeners = new Set();
        this.checkTimer = null;
    }

    init() {
        if (!this.isManual) {
            this.currentTime = this.calculateTimeOfDay(new Date());
        }
        
        // Auto-check time every 10 seconds for smooth transitions
        if (this.checkTimer) clearInterval(this.checkTimer);
        this.checkTimer = setInterval(() => {
            if (!this.isManual) {
                const next = this.calculateTimeOfDay(new Date());
                if (next !== this.currentTime) {
                    this.setTimeOfDay(next, false);
                }
            }
        }, 10000);

        this.notify();
    }

    calculateTimeOfDay(date = new Date()) {
        const hour = date.getHours();
        if (hour >= 5 && hour < 9) return TIME_OF_DAY.DAWN;
        if (hour >= 9 && hour < 18) return TIME_OF_DAY.DAY;
        if (hour >= 18 && hour < 21) return TIME_OF_DAY.SUNSET;
        return TIME_OF_DAY.NIGHT;
    }

    getCurrentTime() {
        return this.currentTime;
    }

    getCurrentMeta() {
        return TIME_METADATA[this.currentTime] || TIME_METADATA[TIME_OF_DAY.DAY];
    }

    setTimeOfDay(timeKey, isManual = true) {
        if (!TIME_METADATA[timeKey]) return;
        this.currentTime = timeKey;
        this.isManual = isManual;
        this.notify();
    }

    cycleNext() {
        const order = [TIME_OF_DAY.DAWN, TIME_OF_DAY.DAY, TIME_OF_DAY.SUNSET, TIME_OF_DAY.NIGHT];
        const currentIndex = order.indexOf(this.currentTime);
        const nextIndex = (currentIndex + 1) % order.length;
        this.setTimeOfDay(order[nextIndex], true);
        return this.getCurrentMeta();
    }

    resetToAuto() {
        this.isManual = false;
        this.currentTime = this.calculateTimeOfDay(new Date());
        this.notify();
        return this.getCurrentMeta();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.currentTime, this.getCurrentMeta(), this.isManual);
        return () => this.listeners.delete(listener);
    }

    notify() {
        const meta = this.getCurrentMeta();
        this.listeners.forEach(fn => fn(this.currentTime, meta, this.isManual));
    }
}

export const timeOfDayService = new TimeOfDayService();
