import { Scene } from 'three/src/scenes/Scene'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Color } from 'three/src/math/Color'
import { Vector2 } from 'three/src/math/Vector2'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Clock } from 'three/src/core/clock'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import Tweakpane from 'tweakpane'

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._addListeners()
    this._createControls()
    this._createDebugPanel()
    this._createClock()
    this._createPostProcess()

    this._loadModel().then(() => {
      this.renderer.setAnimationLoop(() => {
        this._update()
        this._render()
      })
    })

    console.log(this)
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    this.fillMesh.material.uniforms.uTime.value = this.clock.getElapsedTime()
    this.fillMesh.material.uniformsNeedUpdate = true

    this.wireframeMesh.material.uniforms.uTime.value = this.clock.getElapsedTime()
    this.wireframeMesh.material.uniformsNeedUpdate = true
  }

  _render() {
    this.composer.render()
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 2)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(0x121212)
    this.renderer.gammaOutput = true
    this.renderer.physicallyCorrectLights = true
  }

  _createBox() {
    const geom = new BoxBufferGeometry(1, 1, 1, 20, 20, 20).toNonIndexed()
    this._setGeometryCentroid(geom)

    return geom
  }

  _setGeometryCentroid(geometry) {
    const centroid = new Float32Array(geometry.getAttribute('position').count*3)
    const position = geometry.getAttribute('position').array

    for (let i = 0; i < centroid.length; i+=9) {
      const x = (position[i] + position[i+3] + position[i+6]) / 3
      const y = (position[i+1] + position[i+1+3] + position[i+1+6]) / 3
      const z = (position[i+2] + position[i+2+3] + position[i+2+6]) / 3

      centroid.set([x, y, z], i);
      centroid.set([x, y, z], i+3);
      centroid.set([x, y, z], i+6);
    }

    geometry.setAttribute('aCentroid', new BufferAttribute(centroid, 3, false))
  }

  _getWireframeMaterial() {
    return new ShaderMaterial({
      vertexShader: require('./shaders/effect.vertex.glsl'),
      fragmentShader: require('./shaders/wireframe.fragment.glsl'),
      transparent: true,
      wireframe: true,
      side: 2, // THREE:DoubleSide
      uniforms: {
        uDistortionPosition: {
          type: '1f',
          value: 0
        },
        uDistortionAmount: {
          type: '1f',
          value: 0.2
        },
        uDistortionThickness: {
          type: '1f',
          value: 0.5
        },
        uTime: {
          type: '1f',
          value: 0
        }
      }
    })
  }

  _getFillMaterial() {
    return new ShaderMaterial({
      vertexShader: require('./shaders/effect.vertex.glsl'),
      fragmentShader: require('./shaders/fill.fragment.glsl'),
      transparent: true,
      wireframe: false,
      side: 2, // THREE:DoubleSide
      uniforms: {
        uDistortionPosition: {
          type: '1f',
          value: 0
        },
        uDistortionAmount: {
          type: '1f',
          value: 0.2
        },
        uDistortionThickness: {
          type: '1f',
          value: 0.5
        },
        uTime: {
          type: '1f',
          value: 0
        }
      }
    })
  }

  /**
   * Load a 3D model and append it to the scene
   */
  _loadModel() {
    return new Promise(resolve => {
      this.loader = new GLTFLoader()

      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/')

      this.loader.setDRACOLoader(dracoLoader)

      // Model URL: https://www.turbosquid.com/it/3d-models/3d-stan-lee-1348558
      this.loader.load('./stan.glb', gltf => {
        this.wireframeMesh = gltf.scene.children[0].clone()
        this.fillMesh = gltf.scene.children[0].clone()

        const geom = this.wireframeMesh.geometry.toNonIndexed()

        this._setGeometryCentroid(geom)

        this.wireframeMesh.geometry = geom
        this.fillMesh.geometry = geom

        this.wireframeMesh.position.x = 0
        this.fillMesh.position.x = 0

        this.wireframeMesh.material = this._getWireframeMaterial()
        this.fillMesh.material = this._getFillMaterial()

        this.scene.add(this.fillMesh)
        this.scene.add(this.wireframeMesh)

        resolve()
      })
    })
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  _createClock() {
    this.clock = new Clock()
  }

  _createPostProcess() {
    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      0.7,
      0.45,
      0.2
    )
    this.composer.addPass(this.bloomPass)
  }

  _createDebugPanel() {
    this.pane = new Tweakpane()

    /**
     * Scene configuration
     */
    const sceneFolder = this.pane.addFolder({ title: 'Scene' })

    let params = { background: { r: 18, g: 18, b: 18 } }

    sceneFolder.addInput(params, 'background', { label: 'Background Color' }).on('change', value => {
      this.renderer.setClearColor(new Color(`rgb(${parseInt(value.r)}, ${parseInt(value.g)}, ${parseInt(value.b)})`))
    })

    /**
     * Distortion configuration
     */
    const distortionFolder = this.pane.addFolder({ title: 'Distortion' })

    params = {
      distortionPosition: 0,
      distortionAmount: 0.2,
      distortionThickness: 0.5
    }

    distortionFolder.addInput(params, 'distortionPosition', { label: 'Position', min: -1, max: 1 }).on('change', value => {
      this.fillMesh.material.uniforms.uDistortionPosition.value = value
      this.fillMesh.material.uniformsNeedUpdate = true

      this.wireframeMesh.material.uniforms.uDistortionPosition.value = value
      this.wireframeMesh.material.uniformsNeedUpdate = true
    })

    distortionFolder.addInput(params, 'distortionAmount', { label: 'Amount', min: -0.5, max: 0.5 }).on('change', value => {
      this.fillMesh.material.uniforms.uDistortionAmount.value = value
      this.fillMesh.material.uniformsNeedUpdate = true

      this.wireframeMesh.material.uniforms.uDistortionAmount.value = value
      this.wireframeMesh.material.uniformsNeedUpdate = true
    })

    distortionFolder.addInput(params, 'distortionThickness', { label: 'Thickness', min: 0, max: 1 }).on('change', value => {
      this.fillMesh.material.uniforms.uDistortionThickness.value = value
      this.fillMesh.material.uniformsNeedUpdate = true

      this.wireframeMesh.material.uniforms.uDistortionThickness.value = value
      this.wireframeMesh.material.uniformsNeedUpdate = true
    })

    /**
     * Bloom configuration
     */
    const bloomFolder = this.pane.addFolder({ title: 'Bloom' })

    params = {
      strength: 0.7,
      threshold: 0.45,
      radius: 0.2
    }

    bloomFolder.addInput(params, 'strength', { label: 'Strength', min: 0, max: 1 }).on('change', value => {
      this.bloomPass.strength = value
    })

    bloomFolder.addInput(params, 'threshold', { label: 'Threshold', min: 0.1, max: 0.7 }).on('change', value => {
      this.bloomPass.threshold = value
    })

    bloomFolder.addInput(params, 'radius', { label: 'Radius', min: 0, max: 1 }).on('change', value => {
      this.bloomPass.radius = value
    })
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
}

const app = new App('#app')
app.init()
