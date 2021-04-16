// import App from './scripts/app';

let icon = [
  {name: 'center-vert', url: require('@/assets/svg/icons/icon-distribute-normal.svg')},
  {name: 'center-vert', url: require('@/assets/svg/icons/icon-distribute-squeezed-horizontally.svg')},
  {name: 'cam', url: require('@/assets/svg/icons/icon-distribute-grid2d-vertically.svg')},
  {name: 'cam', url: require('@/assets/svg/icons/icon-camera-top.svg')},
  {name: 'cam', url: require('@/assets/svg/icons/icon-camera-front.svg')},
  {name: 'cam', url: require('@/assets/svg/icons/icon-camera-left.svg')},
  {name: 'resetboxes', url: require('@/assets/svg/icons/icon-reset-boxes.svg')}
]

export default class Button {
  constructor(_options) {
    this.name = _options.name;
    this.size = 48;
    this.position = [];
    this.color = _options.color;
    this.pos = _options.pos;
    this.img = _options.img;
    this.imgIndex = _options.imgIndex;
    this.baseUrl = '../../static/svg/'
    this.parent = _options.cont
    // Run initialization
    this.init();
  }

  setup () {
    var button = document.createElement('div')
    button = document.createElement('div')
    button.setAttribute('name', this.name)
    button.classList.add('w-icon')
    this.button = button
    this.parent.appendChild(button)
    // Apply styling
    this.styling()
    // Setup eventlisteners
    // this.setupEventListeners()
  } 
  
  styling () {
    var btn = this.button
    // btn.style.backgroundColor = this.color
    btn.style.width = `${this.size}px`
    btn.style.height = `${this.size}px`
    btn.style.left = `${this.pos.x}px`
    btn.style.top = `${this.pos.y}px`
    btn.classList.add('button')
    // Set background image
    console.log('baseurl : ' + this.baseUrl)
    // btn.style.backgroundImage = `url(${this.baseUrl}${this.img}`;
    btn.style.backgroundImage = `url(${icon[parseInt(this.imgIndex)].url})`
  }
  
  // handleInteraction(evt) {
  //   evt.preventDefault()
  //   console.log('interacted')
  //   // App.testThisShit()
  // }

  // setupEventListeners () {
  //   var self = this
  //   var el = this.button
  //   el.addEventListener('touchstart', self.handleInteraction)
  //   el.addEventListener('click', self.handleInteraction)
  //   // this.button.addEventListener
  // }

  init () {
    this.setup()
  }
  
  // putPositions (text) {
  //   alert(text)
  // }
  
}
