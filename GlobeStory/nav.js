// import {chapterData} from './app.js';

// const chapterData = require('./mapChapters.json'); 

// const {counter} = require('./app.js')

// console.log({counter})
// import {counter} from "./app.js"
// console.log(counter)

temp = [1,1,1,1,1]
gridLayout = temp.length + 2

const parent = document.getElementById('btnContainer')
// console.log(parent)

// parent.style.border = '3px solid red'
parent.style.gridTemplateColumns = 'repeat(' + gridLayout + ', 1fr)' 



for (let i = 0; i < temp.length; i++) {
    yolo = document.createElement('div')
    // yolo.onclick = console.log('yolooooo!')
    yolo.classList.add('btn', 'progress')
    yolo.innerHTML = '■'
    // parent.appendChild(yolo)
    parent.insertBefore(yolo,parent.children[i+1])
    
}