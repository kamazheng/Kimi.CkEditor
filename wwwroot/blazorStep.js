import * as THREE from "./ThreeJs/three.module.min.js"
import { TrackballControls } from './ThreeJs/TrackballControls.module.js'
//import occtimportjs from  "/_content/Kimi.FluentUiExtension/ThreeJs/occt-import-js.js"
//import occtimportjs from 'https://cdn.skypack.dev/occt-import-js'

export async function showStepContent(divId, file) {
    let camera, scene, renderer, stats, controls, loader, lightHolder;

    init(divId, file);
    //const occtimportjs = require('occt-import-js')();
    async function init(divId, file) {
        // light
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(200, 200, 200);
        camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1e10);
        camera.add(ambientLight);
        camera.add(dirLight);

        scene = new THREE.Scene();
        scene.add(camera);

        //load step file
        const mainObject = new THREE.Object3D();
        await LoadGeometry(mainObject);
        scene.add(mainObject);

        // renderer

        var div = document.getElementById(divId)
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(div.clientWidth, div.clientHeight);
        div.appendChild(renderer.domElement);
        new ResizeObserver(resetRenderSize).observe(div);

        // controls

        createControls(camera);
        bestFit(camera, mainObject, 1.5, controls);
        controls.reset();

        window.addEventListener('resize', onWindowResize);
        animate();
    }

    function resetRenderSize() {
        var div = document.getElementById(divId)
        if (div) {
            renderer.setSize(div.clientWidth, div.clientHeight);
        }
    }

    function createControls(camera) {
        controls = new TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 4.0;
        controls.zoomSpeed = 2;
        controls.panSpeed = 1.5;
        controls.keys = ['KeyA', 'KeyS', 'KeyD'];
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // to support damping
        renderer.render(scene, camera);
        window.dispatchEvent(new Event('resize'));
    }

    function bestFit(camera, object, offset, controls) {
        offset = offset || 1.25;

        const boundingBox = new THREE.Box3();

        // get bounding box of object - this will be used to setup controls and camera
        boundingBox.setFromObject(object);

        const center = new THREE.Vector3();
        boundingBox.getCenter(center);

        const size = new THREE.Vector3();
        boundingBox.getSize(size);

        // get the max side of the bounding box (fits to width OR height as needed )
        const maxDim = Math.max(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));

        cameraZ *= offset; // zoom out a little so that objects don't fill the screen

        camera.position.z = cameraZ;
        camera.position.x = boundingBox.max.x * 3;
        camera.position.y = boundingBox.max.y * 3;

        const minZ = boundingBox.min.z;
        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

        camera.far = cameraToFarEdge * 3;
        camera.updateProjectionMatrix();

        if (controls) {
            // set camera to rotate around center of loaded object
            controls.target = center;

            // prevent camera from zooming out far enough to create far plane cutoff
            controls.maxDistance = cameraToFarEdge * 2;
            controls.target0.copy(controls.target);
            controls.position0.copy(controls.object.position);
            controls.zoom0 = controls.object.zoom;
        } else {
            camera.lookAt(center)
        }
    }

    async function LoadGeometry(targetObject) {
        // init occt-import-js
        const occt = await occtimportjs();

        // download a step file
        let fileUrl = file;
        let response = await fetch(fileUrl);
        let buffer = await response.arrayBuffer();

        // read the imported step file
        let fileBuffer = new Uint8Array(buffer);
        let result = occt.ReadStepFile(fileBuffer, null);

        // process the geometries of the result
        const group = new THREE.Group();
        for (let resultMesh of result.meshes) {
            const { mesh, edges } = BuildMesh(resultMesh, true);
            group.add(mesh);
            if (edges) {
                group.add(edges);
            }
        }
        targetObject.add(group);
    }

    function BuildMesh(geometryMesh, showEdges) {
        let geometry = new THREE.BufferGeometry();

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3));
        if (geometryMesh.attributes.normal) {
            geometry.setAttribute("normal", new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3));
        }
        geometry.name = geometryMesh.name;
        const index = Uint32Array.from(geometryMesh.index.array);
        geometry.setIndex(new THREE.BufferAttribute(index, 1));

        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const defaultMaterial = new THREE.MeshPhongMaterial({
            color: geometryMesh.color ? new THREE.Color(geometryMesh.color[0], geometryMesh.color[1], geometryMesh.color[2]) : 0xcccccc,
            specular: 0,
        });
        let materials = [defaultMaterial];
        const edges = showEdges ? new THREE.Group() : null;
        if (geometryMesh.brep_faces && geometryMesh.brep_faces.length > 0) {
            for (let faceColor of geometryMesh.brep_faces) {
                const color = faceColor.color ? new THREE.Color(faceColor.color[0], faceColor.color[1], faceColor.color[2]) : defaultMaterial.color;
                materials.push(new THREE.MeshPhongMaterial({ color: color, specular: 0 }));
            }
            const triangleCount = geometryMesh.index.array.length / 3;
            let triangleIndex = 0;
            let faceColorGroupIndex = 0;
            while (triangleIndex < triangleCount) {
                const firstIndex = triangleIndex;
                let lastIndex = null;
                let materialIndex = null;
                if (faceColorGroupIndex >= geometryMesh.brep_faces.length) {
                    lastIndex = triangleCount;
                    materialIndex = 0;
                } else if (triangleIndex < geometryMesh.brep_faces[faceColorGroupIndex].first) {
                    lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].first;
                    materialIndex = 0;
                } else {
                    lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].last + 1;
                    materialIndex = faceColorGroupIndex + 1;
                    faceColorGroupIndex++;
                }
                geometry.addGroup(firstIndex * 3, (lastIndex - firstIndex) * 3, materialIndex);
                triangleIndex = lastIndex;

                if (edges) {
                    const innerGeometry = new THREE.BufferGeometry();
                    innerGeometry.setAttribute("position", geometry.attributes.position);
                    if (geometryMesh.attributes.normal) {
                        innerGeometry.setAttribute("normal", geometry.attributes.normal);
                    }
                    innerGeometry.setIndex(new THREE.BufferAttribute(index.slice(firstIndex * 3, lastIndex * 3), 1));
                    const innerEdgesGeometry = new THREE.EdgesGeometry(innerGeometry, 180);
                    const edge = new THREE.LineSegments(innerEdgesGeometry, outlineMaterial);
                    edges.add(edge);
                }
            }
        }

        const mesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
        mesh.name = geometryMesh.name;

        if (edges) {
            edges.renderOrder = mesh.renderOrder + 1;
        }

        return { mesh, geometry, edges };
    }
}