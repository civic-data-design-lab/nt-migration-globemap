const offsetInput = document.querySelector('#offset-input');
const offsetOutput = document.querySelector('#offset-output');
const arrowContainer = document.getElementsByClassName('arrowContainer')
const siteNames = ["curves c-darien","curves c-panama","curves c-guatmex"]
const sites = ['darien','panama','guatmex']


let pageName = window.location.pathname

for (let cont = 0; cont < siteNames.length; cont++) {
    const arrowPaths = document.getElementsByClassName(siteNames[cont])
    for (let i = 0; i < arrowPaths.length; i++) {
        // get the path value to assign later
        let pathway = arrowPaths[i].attributes.d.value
        // Create new graphic and assign class
        arrowContainer[cont].appendChild(
            newGx = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        )
        newGx.classList.add('rocket')

        // Create path with style to be added within graphic
        arrowSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        arrowSVG.classList.add('arrows')
        arrowSVG.classList.add(sites[cont])
        arrowSVG.setAttribute('d', 'M409.5863,285.0593 L409.5863,686.5136 L208.8591,686.5136 L208.8591,285.0593 L135.3879,285.0593 L309.2227,84.33218 L483.0575,285.0593 z')

        windSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        windSVG.classList.add('wind')
        windSVG.classList.add(sites[cont])
        windSVG.setAttribute('d', 'M409.5863,285.0593 L409.5863,686.5136 L208.8591,686.5136 L208.8591,285.0593 L135.3879,285.0593 L309.2227,84.33218 L483.0575,285.0593 z')
        // windSVG.setAttribute('transform', 'rotate(90) scale(0.02)')




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
    var fullArrowList = document.getElementsByClassName(sites[cont])
    // var windList = document.getElementsByClassName(sites[cont])
    var arrowList = []
    var windList = []

    for (let ai = 0; ai < fullArrowList.length; ai++) {
        if (fullArrowList[ai].classList.contains('wind')){
            windList.push(fullArrowList[ai])

        }else{
            arrowList.push(fullArrowList[ai])
        }
    }
    // console.log(arrowList + " : ", windList.length )

    // console.log(arrowList.length + ":" , windList.length)

    var costData = [
                    [0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009],
                    [0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.006,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009],
                    [0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.013,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.011,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009,0.009]
                ]
    for (let c = 0; c < arrowList.length; c++) {

        // scaleFactorX = getRandomArbitrary(0.005,0.0125)
        scaleFactorY = getRandomArbitrary(0.0125,0.02)
        
        if (arrowList[c] != null){
            arrowList[c].setAttribute('transform', 'rotate(90) scale(' + costData[cont][c] + ')')  
            // console.log(costData[cont][c])
            // arrowlist[c].setAttribute('transform', 'rotate(90) scale(' + 0.02 + ')')   
        }
        // }

        if (windList[c] != null){ 
            windList[c].setAttribute('transform', 'rotate(90) scale(' + costData[cont][c] + (scaleFactorY*1.3) + ')')    
            // windList[c].setAttribute('transform', 'rotate(90) scale(' + costData[cont][c] + ')') 
            // windList[c].setAttribute('transform', 'rotate(90) scale(' + 0.02 + (scaleFactorY*1.3) + ')')    
        }
    }
}

// random number function
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }