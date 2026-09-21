/**
 * GeometricAvatar Module
 * Renders a clean, minimalist Basic White Square (기본 하얀색 네모) placeholder character
 * for Character Creation, ID Passes, UI profiles, and Isometric Office representation.
 */

export function createGeometricAvatarSVG({
    shape = 'square',
    direction = 'front',
    className = 'geometric-avatar-svg'
} = {}) {
    // Coordinate adjustments based on 4 directions
    let eyeLeftX = 76, eyeRightX = 124;
    let eyeY = 100;
    let blushLeftX = 64, blushRightX = 136;
    let mouthD = "M 92 114 Q 100 122 108 114";
    let showFace = true;

    if (direction === 'left') {
        eyeLeftX = 58; eyeRightX = 94;
        blushLeftX = 50; blushRightX = 98;
        mouthD = "M 68 114 Q 76 120 84 114";
    } else if (direction === 'right') {
        eyeLeftX = 106; eyeRightX = 142;
        blushLeftX = 102; blushRightX = 150;
        mouthD = "M 116 114 Q 124 120 132 114";
    } else if (direction === 'back') {
        showFace = false;
    }

    let faceSvg = '';
    if (showFace) {
        faceSvg = `
            <!-- Eyes -->
            <ellipse cx="${eyeLeftX}" cy="${eyeY}" rx="6" ry="8" fill="#0f172a" />
            <circle cx="${eyeLeftX - 2}" cy="${eyeY - 2.5}" r="2" fill="#ffffff" />
            
            <ellipse cx="${eyeRightX}" cy="${eyeY}" rx="6" ry="8" fill="#0f172a" />
            <circle cx="${eyeRightX - 2}" cy="${eyeY - 2.5}" r="2" fill="#ffffff" />
            
            <!-- Cute Blush -->
            <ellipse cx="${blushLeftX}" cy="112" rx="8" ry="4.5" fill="#ff7675" opacity="0.65" />
            <ellipse cx="${blushRightX}" cy="112" rx="8" ry="4.5" fill="#ff7675" opacity="0.65" />
            
            <!-- Smile -->
            <path d="${mouthD}" fill="none" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round" />
            
            <!-- Mini Trader Tag on Corner -->
            <rect x="46" y="46" width="18" height="12" rx="3" fill="#00e5ff" opacity="0.85" />
            <rect x="49" y="50" width="12" height="2" fill="#0f172a" />
        `;
    }

    return `
        <svg viewBox="0 0 200 220" class="${className}" style="width: 100%; height: 100%; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.35));" xmlns="http://www.w3.org/2000/svg">
            <!-- Stage Shadow -->
            <ellipse cx="100" cy="195" rx="60" ry="12" fill="rgba(0,0,0,0.25)" />
            
            <!-- Basic White Square Body -->
            <rect x="36" y="32" width="128" height="136" rx="20" fill="#ffffff" stroke="#1e293b" stroke-width="5" />
            
            <!-- Inner Soft Highlight -->
            <rect x="42" y="38" width="116" height="40" rx="14" fill="rgba(255,255,255,0.8)" opacity="0.6" />
            
            <!-- Minimalist Feet / Base -->
            <rect x="65" y="165" width="26" height="14" rx="6" fill="#f1f5f9" stroke="#1e293b" stroke-width="3.5" />
            <rect x="109" y="165" width="26" height="14" rx="6" fill="#f1f5f9" stroke="#1e293b" stroke-width="3.5" />
            
            ${faceSvg}
        </svg>
    `;
}
