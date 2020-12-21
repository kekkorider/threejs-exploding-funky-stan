import { Scene } from 'three/src/scenes/Scene'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { BoxBufferGeometry } from 'three/src/geometries/BoxBufferGeometry'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Color } from 'three/src/math/Color'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Clock } from 'three/src/core/clock'
import { Mesh } from 'three/src/objects/Mesh'
import { BufferAttribute } from 'three/src/core/BufferAttribute'

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
    this._createWireframeBox()
    this._createFillBox()
    this._createControls()
    this._createDebugPanel()
    this._createClock()

    // this._loadModel().then(() => {
    //   console.log(this)
    //   this.renderer.setAnimationLoop(() => {
    //     this._update()
    //     this._render()
    //   })
    // })

    console.log(this)

    this.renderer.setAnimationLoop(() => {
      this._update()
      this._render()
    })
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    this.wireframeBox.material.uniforms.uTime.value = this.clock.getElapsedTime()
    this.wireframeBox.material.uniformsNeedUpdate = true

    this.fillBox.material.uniforms.uTime.value = this.clock.getElapsedTime()
    this.fillBox.material.uniformsNeedUpdate = true
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
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
    const centroid = new Float32Array(geom.getAttribute('position').count*3)
    const position = geom.getAttribute('position').array

    for (let i = 0; i < centroid.length; i+=9) {
      const x = (position[i] + position[i+3] + position[i+6]) / 3
      const y = (position[i+1] + position[i+1+3] + position[i+1+6]) / 3
      const z = (position[i+2] + position[i+2+3] + position[i+2+6]) / 3

      centroid.set([x, y, z], i);
      centroid.set([x, y, z], i+3);
      centroid.set([x, y, z], i+6);
    }

    geom.setAttribute('aCentroid', new BufferAttribute(centroid, 3, false))

    return geom
  }

  _createWireframeBox() {
    const geom = this._createBox()
    const mat = this._getWireframeMaterial()

    this.wireframeBox = new Mesh(geom, mat)
    // this.wireframeBox.position.x = -1
    this.scene.add(this.wireframeBox)
  }

  _createFillBox() {
    const geom = this._createBox()
    const mat = this._getFillMaterial()

    this.fillBox = new Mesh(geom, mat)
    // this.fillBox.position.x = 1
    this.scene.add(this.fillBox)
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

      this.loader.load('./model.glb', gltf => {
        this.scene.add(gltf.scene)

        this.mesh = gltf.scene.children[0]

        this.mesh.material = this._getWireframeMaterial()

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
      distortionAmount: 0.2
    }

    distortionFolder.addInput(params, 'distortionPosition', { label: 'Position', min: -1, max: 1 }).on('change', value => {
      this.wireframeBox.material.uniforms.uDistortionPosition.value = value
      this.wireframeBox.material.uniformsNeedUpdate = true

      this.fillBox.material.uniforms.uDistortionPosition.value = value
      this.fillBox.material.uniformsNeedUpdate = true
    })

    distortionFolder.addInput(params, 'distortionAmount', { label: 'Amount', min: -0.5, max: 0.5 }).on('change', value => {
      this.wireframeBox.material.uniforms.uDistortionAmount.value = value
      this.wireframeBox.material.uniformsNeedUpdate = true

      this.fillBox.material.uniforms.uDistortionAmount.value = value
      this.fillBox.material.uniformsNeedUpdate = true
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
