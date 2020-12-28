import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { SphereBuilder } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { GroundBuilder } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { AmmoJSPlugin } from "@babylonjs/core/Physics/Plugins/ammoJSPlugin";
import "@babylonjs/core/Physics/physicsEngineComponent";

// If you don't need the standard material you will still need to import it since the scene requires it.
import "@babylonjs/core/Materials/standardMaterial";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { ammoModule, ammoReadyPromise } from "../externals/ammo";
import { CreateSceneClass } from "../createScene";
import { StandardMaterial } from "@babylonjs/core/Materials";
import { CubeTexture, Texture } from "@babylonjs/core/Materials/Textures";
import grassTextureUrl from "../../assets/grass.jpg";
import wackPic1Url from "../../assets/wack1.jpg";
import wackPic2Url from "../../assets/wack2.jpg";
import {
    ActionEvent,
    ActionManager,
    Color3,
    EnvironmentHelper,
    ExecuteCodeAction,
    FollowCamera,
    MeshBuilder,
} from "@babylonjs/core";
import roomEnvironment from "../../assets/environment/room.env";

class PhysicsSceneWithAmmo implements CreateSceneClass {
    preTasks = [ammoReadyPromise];

    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        scene.enablePhysics(null, new AmmoJSPlugin(true, ammoModule));

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            scene
        );

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        var skybox = MeshBuilder.CreateBox("skybox", { size: 150.0 }, scene);
        var skyboxMaterial = new StandardMaterial("skybox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture(
            "textures/skybox",
            scene
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        // Our built-in 'sphere' shape.
        const sphere1 = SphereBuilder.CreateSphere(
            "sphere1",
            { diameter: 3, segments: 2 },
            scene
        );

        const sphere1Material = new StandardMaterial("ground material", scene);
        sphere1Material.diffuseTexture = new Texture(wackPic1Url, scene);
        sphere1.material = sphere1Material;

        const sphere2 = SphereBuilder.CreateSphere(
            "sphere2",
            { diameter: 3, segments: 32 },
            scene
        );

        // Coloring Sphere2
        const sphere2Material = new StandardMaterial("ground material", scene);
        sphere2Material.diffuseTexture = new Texture(wackPic2Url, scene);
        sphere2.material = sphere2Material;

        sphere1.physicsImpostor = new PhysicsImpostor(
            sphere1,
            PhysicsImpostor.SphereImpostor,
            {
                mass: 5,
                restitution: 0.8,
                pressure: 0,
                friction: 0.5,
            },
            scene
        );
        sphere2.physicsImpostor = new PhysicsImpostor(
            sphere2,
            PhysicsImpostor.SphereImpostor,
            {
                mass: 0.2,
                restitution: 0.5,
                pressure: 0,
                friction: 0.2,
            },
            scene
        );

        // sphere2.applyImpulse(new Vector3(1, 1, 1), sphere2.position);

        // Move the sphere upward 1/2 its height
        sphere1.position.y = 2;
        sphere2.position.y = 2;

        // Move spheres to their sides
        sphere1.position.x = 0;
        sphere2.position.x = 5;
        sphere1.position.z = 10;

        // Sphere Movement
        const inputMap: { [index: string]: any } = {};
        scene.actionManager = new ActionManager(scene);
        scene.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnKeyDownTrigger,
                function (evt) {
                    inputMap[evt.sourceEvent.key] =
                        evt.sourceEvent.type == "keydown";
                }
            )
        );
        scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, function (evt) {
                inputMap[evt.sourceEvent.key] =
                    evt.sourceEvent.type == "keydown";
            })
        );

        scene.onBeforeRenderObservable.add(() => {
            if (inputMap["w"]) {
                sphere1.position.z -= 0.5;
            }
            if (inputMap["a"]) {
                sphere1.position.x += 0.5;
            }
            if (inputMap["s"]) {
                sphere1.position.z += 0.5;
            }
            if (inputMap["d"]) {
                sphere1.position.x -= 0.5;
            }
            if (inputMap["spacebar"]) {
                sphere1.position.y += 2;
            }
        });

        // Our built-in 'ground' shape.
        const ground = GroundBuilder.CreateGround(
            "ground",
            { width: 60, height: 60 },
            scene
        );

        /* OLD CAM
        
        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera("my first camera", 0, Math.PI / 3, 10, new Vector3(0, 60, -60), scene);
        
        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());
        
        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);
        
        */

        // This creates and positions a free camera (non-mesh)
        const camera = new FollowCamera(
            "my first camera",
            new Vector3(0, 60, 0),
            scene,
            sphere1
        );
        camera.radius = 20;
        camera.rotationQuaternion = new Quaternion(100, 100, 100);

        // This targets the camera to scene origin
        // camera.setTarget(Vector3.Zero());

        // // This attaches the camera to the canvas
        // camera.attachControl(canvas, true);

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;

        ground.physicsImpostor = new PhysicsImpostor(
            ground,
            PhysicsImpostor.BoxImpostor,
            { mass: 0, restitution: 0.6 }
        );

        return scene;
    };
    static inputMap: {};
}

export default new PhysicsSceneWithAmmo();
