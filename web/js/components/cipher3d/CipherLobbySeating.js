import * as THREE from '../../../vendor/three/three.module.js';
import { LOBBY } from '../../data/cipherLobbyRoom.js';
import { LOBBY_COLORS } from './CipherLobbyArchitecture.js';
import { addCipherSingleSofas } from './CipherSingleSofas.js';

export function addLobbySeating(room, box) {
    const { cream, darkBlue } = LOBBY_COLORS;
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x3d7657, roughness: .85 });
    const lightLeaf = new THREE.MeshStandardMaterial({ color: 0x67915c, roughness: .85 });
    const potMaterial = new THREE.MeshStandardMaterial({ color: cream, roughness: .9 });
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x544439, roughness: 1 });
    const mesh = (group, name, geometry, material, position) => {
        const object = new THREE.Mesh(geometry, material);
        object.name = name;
        object.position.set(...position);
        object.castShadow = object.receiveShadow = true;
        group.add(object);
        return object;
    };
    for (const { side, plantX, plantZ } of LOBBY.waitingAreas) {
        const plant = new THREE.Group();
        plant.name = `waiting-planter-${side}`;
        plant.position.set(plantX,0,plantZ);
        room.add(plant);
        // An open vessel: the old cylinder lid and soil shared y=38, causing flicker.
        const potProfile = [[0,0],[19,0],[25,36],[25,38],[22,38],[21.5,33],[0,33]]
            .map(([r,y]) => new THREE.Vector2(r,y));
        mesh(plant, 'planter-pot', new THREE.LatheGeometry(potProfile,32), potMaterial, [0,0,0]);
        mesh(plant, 'planter-soil', new THREE.CylinderGeometry(21.8,21.8,1,32), soilMaterial, [0,34.5,0]);
        mesh(plant, 'planter-blue-band', new THREE.CylinderGeometry(25.5,25.5,6,32,1,true),
            new THREE.MeshStandardMaterial({ color: darkBlue, roughness: .9 }), [0,32,0]);
        mesh(plant, 'plant-stem', new THREE.CylinderGeometry(2.2,3.2,65,10), leafMaterial, [0,69,0]);
        for (let i=0; i<7; i++) {
            const angle = i*2.4;
            const direction = new THREE.Vector3(Math.cos(angle)*.8, .65+i*.06, Math.sin(angle)*.8).normalize();
            const leaf = mesh(plant, 'plant-leaf', new THREE.SphereGeometry(1,16,8),
                i%2 ? leafMaterial : lightLeaf, [direction.x*22,67+i*5+direction.y*18,direction.z*22]);
            leaf.scale.set(10,29,5);
            leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
        }
    }
    return addCipherSingleSofas(room);
}
