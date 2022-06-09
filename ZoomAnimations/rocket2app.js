const offsetInput = document.querySelector('#offset-input');
const offsetOutput = document.querySelector('#offset-output');

const arrowContainer = document.getElementById('arrowContainer')
const arrowPaths = document.getElementsByClassName('curves')

for (let i = 0; i < arrowPaths.length; i++) {
    // get the path value to assign later
    let pathway = arrowPaths[i].attributes.d.value
    // Create new graphic and assign class
    arrowContainer.appendChild(
        newGx = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    )
    newGx.classList.add('rocket')

    // Create path with style to be added within graphic
    arrowSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    arrowSVG.classList.add('arrows')
    arrowSVG.setAttribute('d', 'M409.5863,285.0593 L409.5863,686.5136 L208.8591,686.5136 L208.8591,285.0593 L135.3879,285.0593 L309.2227,84.33218 L483.0575,285.0593 z')

    windSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    windSVG.classList.add('wind')
    windSVG.setAttribute('d', 'M409.5863,285.0593 L409.5863,686.5136 L208.8591,686.5136 L208.8591,285.0593 L135.3879,285.0593 L309.2227,84.33218 L483.0575,285.0593 z')
    windSVG.setAttribute('transform', 'rotate(90) scale(0.02)')

    newGx.appendChild(windSVG)
    newGx.appendChild(arrowSVG)

    // Offset graphic along path
    newGx.style.offsetPath = "path('" + String(pathway) + "')"
}

// adjust start time
gxList = document.getElementsByClassName('rocket')
for (let i = 0; i < gxList.length; i++) {
    delay = getRandomArbitrary(0,20)
    gxList[i].style.animationDelay= delay + 's'    
}

// adjust scale (need to update with data)
arrowlist = document.getElementsByClassName('arrows')
windList = document.getElementsByClassName('wind')

for (let i = 0; i < arrowlist.length; i++) {
    scaleFactorX = getRandomArbitrary(0.005,0.0125)
    scaleFactorY = getRandomArbitrary(0.0125,0.02)

    arrowlist[i].setAttribute('transform', 'rotate(90) scale(' + scaleFactorX + ')')    
    windList[i].setAttribute('transform', 'rotate(90) scale(' + scaleFactorX + (scaleFactorY*1.3) + ')')    
}
// random number function
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }