// CSS supplies continuous motion; negative delays start at the local wall time.
export function getVivianClockHandsHtml(now = new Date()) {
    const seconds=now.getSeconds()+now.getMilliseconds()/1000;
    const minutes=now.getMinutes()*60+seconds;
    const hours=(now.getHours()%12)*3600+minutes;
    return `<g class="vivian-clock-face" transform="matrix(.7 -.27 0 1 666 612)">
        <g class="vivian-clock-hand" style="--clock-period:43200s;--clock-delay:-${hours}s"><path d="M0 22V-175" stroke="#103955" stroke-width="26" stroke-linecap="round"/></g>
        <g class="vivian-clock-hand" style="--clock-period:3600s;--clock-delay:-${minutes}s"><path d="M0 28V-242" stroke="#103955" stroke-width="17" stroke-linecap="round"/></g>
        <g class="vivian-clock-hand" style="--clock-period:60s;--clock-delay:-${seconds}s"><path d="M0 45V-257" stroke="#df7427" stroke-width="8" stroke-linecap="round"/></g>
        <circle r="23" fill="#ffb91d" stroke="#103955" stroke-width="8"/>
    </g>`;
}
