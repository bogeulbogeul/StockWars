import * as THREE from '../../../vendor/three/three.module.js';
import { TOWN_WEATHER_PROFILES, townWeather } from '../../data/townWeatherProfiles.js';

// Screen-space precipitation belongs to the outdoor scene, so hiding the town
// also hides the weather. It cannot intercept input or appear over indoor UI.
export class TownWeather {
    constructor(scene) {
        this.scene = scene;
        this.uniforms = { time: { value: 0 }, mode: { value: 0 }, amount: { value: 0 },
            aspect: { value: 1 } };
        const material = new THREE.ShaderMaterial({
            transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
            uniforms: this.uniforms,
            vertexShader: `varying vec2 weatherUv;
                void main(){ weatherUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
            fragmentShader: `
                varying vec2 weatherUv;
                uniform float time,mode,amount,aspect;
                float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
                void main(){
                    if(amount<.001 || mode<.5){gl_FragColor=vec4(0.0);return;}
                    vec2 uv=weatherUv; float alpha=0.0;
                    if(mode<1.5){
                        vec2 p=vec2((uv.x+uv.y*.085)*aspect*70.0,uv.y*24.0+time*16.0);
                        vec2 cell=floor(p),f=fract(p);float seed=hash(cell);
                        float line=(1.0-smoothstep(.025,.09,abs(f.x-.5)));
                        float tail=smoothstep(.04,.18,f.y)*(1.0-smoothstep(.65,.98,f.y));
                        alpha=line*tail*step(.68,seed)*(.2+seed*.25);
                        gl_FragColor=vec4(.73,.84,.94,alpha*amount);
                    }else{
                        for(int layer=0;layer<2;layer++){
                            float l=float(layer),density=20.0+l*9.0;
                            vec2 p=vec2(uv.x*aspect*density,uv.y*density+time*(.72+l*.35));
                            p.x+=sin(p.y*.38+time*.3+l*3.0)*.22;
                            vec2 cell=floor(p),f=fract(p);float seed=hash(cell+vec2(l*30.0));
                            vec2 center=vec2(.25+seed*.5,.2+hash(cell+8.0)*.6);
                            float radius=.045+seed*.042;
                            alpha+=(1.0-smoothstep(radius*.45,radius,length(f-center)))*step(.6,seed)*(.45+l*.18);
                        }
                        gl_FragColor=vec4(.94,.97,1.0,min(alpha,.8)*amount);
                    }
                }`
        });
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        this.mesh.name = 'town-outdoor-precipitation';
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 10000;
        scene.add(this.mesh);
    }

    update(now = performance.now(), immediate = false) {
        const category = townWeather(this.scene);
        const mode = TOWN_WEATHER_PROFILES[category].precipitation;
        const elapsed = this.lastUpdate === undefined ? 0 : Math.max(0, Math.min(1000, now - this.lastUpdate));
        this.lastUpdate = now;
        const target = mode ? 1 : 0;
        this.uniforms.amount.value = immediate ? target : THREE.MathUtils.damp(this.uniforms.amount.value, target, 2, elapsed / 1000);
        if (mode) this.uniforms.mode.value = mode;
        this.mesh.visible = this.uniforms.amount.value > .001;
        this.uniforms.time.value = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : now / 1000;
        this.uniforms.aspect.value = this.scene.userData.weatherAspect || innerWidth / Math.max(1, innerHeight);
        this.category = category;
    }
}
