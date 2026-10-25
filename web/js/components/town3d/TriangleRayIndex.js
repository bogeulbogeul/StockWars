import { BackSide, FrontSide, Box3, Matrix4, Ray, Sphere, Vector3 } from '../../../vendor/three/three.module.js';

// Exact triangle queries for static geometry. No simplified collision proxy and
// no change to the source mesh, its indices, materials or rendering.
export class TriangleRayIndex {
    constructor(geometry) {
        this.geometry = geometry;
        this.position = geometry.attributes.position;
        this.index = geometry.index;
        this.positionVersion = this.position.version;
        this.indexVersion = this.index?.version;
        this.positions = this.position.array;
        this.indices = this.index?.array;
        const triangles = (this.indices?.length || this.position.count) / 3;
        this.order = new Uint32Array(triangles);
        const boxes = new Float32Array(triangles * 6);
        for (let t = 0; t < triangles; t++) {
            this.order[t] = t;
            const a = this.vertexOffset(t * 3), b = this.vertexOffset(t * 3 + 1), c = this.vertexOffset(t * 3 + 2);
            for (let axis = 0; axis < 3; axis++) {
                const x = this.positions[a + axis], y = this.positions[b + axis], z = this.positions[c + axis];
                boxes[t * 6 + axis] = Math.min(x, y, z);
                boxes[t * 6 + axis + 3] = Math.max(x, y, z);
            }
        }
        this.capacity = Math.max(1, Math.ceil(triangles / 12) * 2);
        this.bounds = new Float32Array(this.capacity * 6);
        this.nodes = new Int32Array(this.capacity * 4);
        this.nodeCount = 0;
        this.build(boxes, 0, triangles, 0);
        // Per-triangle boxes are only needed during preparation; retain the
        // much smaller hierarchy and triangle order for runtime queries.
        this.box = new Box3();
        this.inverse = new Matrix4();
        this.ray = new Ray();
        this.worldRay = new Ray(); this.sphere = new Sphere();
        this.a = new Vector3(); this.b = new Vector3(); this.c = new Vector3();
        this.point = new Vector3();
        this.stack = [];
    }

    vertexOffset(index) { return (this.indices ? this.indices[index] : index) * 3; }

    build(boxes, start, count, depth) {
        const node = this.nodeCount++;
        if (node === this.capacity) {
            this.capacity *= 2;
            const bounds = new Float32Array(this.capacity * 6), nodes = new Int32Array(this.capacity * 4);
            bounds.set(this.bounds); nodes.set(this.nodes);
            this.bounds = bounds; this.nodes = nodes;
        }
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let i = start; i < start + count; i++) {
            const b = this.order[i] * 6;
            minX = Math.min(minX, boxes[b]); minY = Math.min(minY, boxes[b + 1]); minZ = Math.min(minZ, boxes[b + 2]);
            maxX = Math.max(maxX, boxes[b + 3]); maxY = Math.max(maxY, boxes[b + 4]); maxZ = Math.max(maxZ, boxes[b + 5]);
        }
        this.bounds.set([minX, minY, minZ, maxX, maxY, maxZ], node * 6);
        if (count <= 24) {
            this.nodes[node * 4 + 2] = start;
            this.nodes[node * 4 + 3] = count;
            return node;
        }
        const extents = [maxX - minX, maxY - minY, maxZ - minZ];
        const axis = extents.indexOf(Math.max(...extents));
        const middle = ([minX, minY, minZ][axis] + [maxX, maxY, maxZ][axis]) / 2;
        let split = start, end = start + count - 1;
        if (depth < 48) while (split <= end) {
            const b = this.order[split] * 6;
            if ((boxes[b + axis] + boxes[b + axis + 3]) / 2 < middle) split++;
            else { const t = this.order[split]; this.order[split] = this.order[end]; this.order[end--] = t; }
        }
        if (split === start || split === start + count || depth >= 48) split = start + Math.floor(count / 2);
        const left = this.build(boxes, start, split - start, depth + 1);
        const right = this.build(boxes, split, start + count - split, depth + 1);
        this.nodes[node * 4] = left; this.nodes[node * 4 + 1] = right;
        return node;
    }

    matches(geometry) {
        return geometry.attributes.position === this.position && geometry.index === this.index
            && this.position.version === this.positionVersion && this.index?.version === this.indexVersion;
    }

    intersects(mesh, raycaster) {
        // Preserve Mesh.raycast's native sphere/box gates too, including its
        // handling of near/far and transformed bounding spheres.
        if (!this.geometry.boundingSphere) this.geometry.computeBoundingSphere();
        this.sphere.copy(this.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
        this.worldRay.copy(raycaster.ray).recast(raycaster.near);
        if (!this.sphere.containsPoint(this.worldRay.origin)) {
            if (!this.worldRay.intersectSphere(this.sphere, this.point)) return false;
            if (this.worldRay.origin.distanceToSquared(this.point) > (raycaster.far - raycaster.near) ** 2) return false;
        }
        this.inverse.copy(mesh.matrixWorld).invert();
        this.ray.copy(raycaster.ray).applyMatrix4(this.inverse);
        if (this.geometry.boundingBox && !this.ray.intersectsBox(this.geometry.boundingBox)) return false;
        this.stack.length = 0; this.stack.push(0);
        const side = mesh.material.side;
        while (this.stack.length) {
            const node = this.stack.pop(), b = node * 6, n = node * 4;
            // Conservative padding only broadens the candidate set. The final
            // triangle test below is the same Three.js test as Mesh.raycast.
            this.box.min.fromArray(this.bounds, b); this.box.max.fromArray(this.bounds, b + 3);
            this.box.expandByScalar(1e-6);
            if (!this.ray.intersectsBox(this.box)) continue;
            const count = this.nodes[n + 3];
            if (!count) { this.stack.push(this.nodes[n], this.nodes[n + 1]); continue; }
            const start = this.nodes[n + 2];
            for (let i = start; i < start + count; i++) {
                const t = this.order[i] * 3;
                this.a.fromArray(this.positions, this.vertexOffset(t));
                this.b.fromArray(this.positions, this.vertexOffset(t + 1));
                this.c.fromArray(this.positions, this.vertexOffset(t + 2));
                const hit = side === BackSide
                    ? this.ray.intersectTriangle(this.c, this.b, this.a, true, this.point)
                    : this.ray.intersectTriangle(this.a, this.b, this.c, side === FrontSide, this.point);
                if (!hit) continue;
                this.point.applyMatrix4(mesh.matrixWorld);
                const distance = raycaster.ray.origin.distanceTo(this.point);
                if (distance >= raycaster.near && distance <= raycaster.far) return true;
            }
        }
        return false;
    }
}
