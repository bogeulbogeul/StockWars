import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { LOBBY_COLORS } from './CipherLobbyArchitecture.js';

export function addCipherDoorSign(room, box, door) {
    const { blue, cream } = LOBBY_COLORS;
    const sign = new THREE.Group();
    sign.name = `door-${door.id}-sign`;
    sign.userData.label = door.label;
    const side = door.wall === 'left' ? -1 : 1;
    sign.position.set(side*LOBBY.width/2,239,door.z);
    sign.rotation.y = -side*Math.PI/2;
    room.add(sign);
    const materials = [cream,blue].map(color => new THREE.MeshStandardMaterial({ color, roughness:.9 }));
    for (const [radius, depth, z, index] of [[35,6,5,0],[29,2,9,1]]) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,48),materials[index]);
        disc.rotation.x=Math.PI/2;
        disc.position.z=z;
        disc.castShadow=disc.receiveShadow=true;
        sign.add(disc);
    }
    const part = (name,size,position) => {
        const mesh=box(`sign-${door.id}-${name}`,size,position,cream);
        sign.add(mesh);
    };
    const line = (name,points) => {
        const path = new THREE.CurvePath();
        for(let i=1;i<points.length;i++) {
            path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1],12),new THREE.Vector3(...points[i],12)));
        }
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(path,24,1.7,6,false),materials[0]);
        mesh.name=`sign-${door.id}-${name}`;
        sign.add(mesh);
    };
    if(door.id === 'training') {
        // Broad bars stay legible when the wall badge is viewed at a steep angle.
        for(const [x,h] of [[-12,12],[0,22],[12,32]]) {
            part('chart-bar',[8,h,3],[x,-16+h/2,12]);
        }
        part('chart-baseline',[38,3,3],[0,-18,12]);
    } else {
        const cup = new THREE.Shape();
        cup.moveTo(-13,15); cup.lineTo(13,15); cup.lineTo(10,3);
        cup.quadraticCurveTo(0,-9,-10,3); cup.closePath();
        const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(cup,{ depth:2,bevelEnabled:false }),materials[0]);
        mesh.name='sign-competition-trophy'; mesh.position.z=11; sign.add(mesh);
        part('stem',[4,11,2],[0,-7,12]);
        part('base',[22,4,2],[0,-14,12]);
        for(const side of [-1,1]) line('cup-handle',[[side*13,12],[side*20,12],[side*19,4],[side*14,0],[side*9,0]]);
    }
}
