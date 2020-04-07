import * as d3 from 'd3'

async function downloadSvgLocal(svgNode, fileName) {
  var url = this.createSvgBlobUrl(svgNode)
  //Create a temp link to download the svg
  let a = document.createElement('a')
  a.href = url
  a.download = fileName + '.svg'
  document.body.appendChild(a)
  //Downloads the link as a file
  a.click()
  //remove the temp link created
  document.body.removeChild(a)

  return 1
}

async function downloadPngLocal(svgNode, fileName) {
  var url = this.createSvgBlobUrl(svgNode)
  //Create a temp link to download the svg
  let a = document.createElement('a')
  a.href = url
  a.download = fileName + '.svg'
  document.body.appendChild(a)
  //Downloads the link as a file
  a.click()
  //remove the temp link created
  document.body.removeChild(a)

  return 1
}

// Convert the svg into a Blob which contains svg xml string format. Return as a URL.
// This URL is used to download as .svg file, or conversion into png/jpeg format.
// svgNode: d3.select('#svgId').node();
function createSvgBlobUrl(svgNode) {
  //svgNode without appended css only has default css, and does not get custom
  // vue component css. So we need to append those to the svg before converting into a blob.
  var customComponents = ['#treeSvg', '#node', 'link']
  var cssStyleText = this.getCustomCSSStyles(svgNode, customComponents)
  this.appendCss(cssStyleText, svgNode)

  // serialize our SVG XML to a string.
  var doctype =
    '<?xml version="1.0" standalone="no"?>' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
  var source = new XMLSerializer().serializeToString(svgNode)
  var blob = new Blob([doctype + source], {
    type: 'image/svg+xml;charset=utf-8',
  })

  var url = window.URL.createObjectURL(blob)
  return url
}

//Returns CSS styles for components which have custom styles, which needs to be added
// to the svg, else the render uses default css for this d3 components.
// Custom components are:
// 1. #treeSvg 2. #node-? (all node components incl. text) 3. #link-? (all link component)
//Returns a single string with all the css added.
function getCustomCSSStyles(parentElement, customElements) {
  var selectorTextArr = []
  // Add Parent element Id and Classes to the list
  selectorTextArr.push('#' + parentElement.id)

  for (var c = 0; c < parentElement.classList.length; c++)
    if (!selectorTextArr.includes('.' + parentElement.classList[c]))
      selectorTextArr.push('.' + parentElement.classList[c])

  // Add Children element Ids and Classes to the list
  var nodes = parentElement.getElementsByTagName('*')
  for (var i = 0; i < nodes.length; i++) {
    var id = nodes[i].id
    if (!selectorTextArr.includes('#' + id)) selectorTextArr.push('#' + id)

    var classes = nodes[i].classList
    for (var c = 0; c < classes.length; c++)
      if (!selectorTextArr.includes('.' + classes[c]))
        selectorTextArr.push('.' + classes[c])
  }

  // Extract CSS Rules
  var extractedCSSText = ''
  for (var i = 0; i < document.styleSheets.length; i++) {
    var s = document.styleSheets[i]
    try {
      if (!s.cssRules) continue
    } catch (e) {
      if (e.name !== 'SecurityError') throw e // for Firefox
      continue
    }

    var cssRules = s.cssRules
    for (var r = 0; r < cssRules.length; r++) {
      if (cssRules[r].selectorText) {
        customElements.forEach((ele) => {
          if (cssRules[r].selectorText.includes(ele)) {
            extractedCSSText += cssRules[r].cssText
          }
        })
      }
    }
  }
  return extractedCSSText
}

//Appends the extracted custom css to the 'element' which is svg node.
function appendCss(cssText, element) {
  var styleElement = document.createElement('style')
  styleElement.setAttribute('type', 'text/css')
  styleElement.innerHTML = cssText
  var refNode = element.hasChildNodes() ? element.children[0] : null
  element.insertBefore(styleElement, refNode)
}

function canvasToPng(img, fileName, width, height, isResize, resizedHeight) {
  var canvas = d3.select('body').append('canvas').node()
  canvas.width = width
  canvas.height = height

  var ctx = canvas.getContext('2d')
  if (!isResize) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  } else {
    ctx.drawImage(
      img,
      0,
      resizedHeight,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    )
  }

  canvas.toBlob((blob) => {
    let URLObj = window.URL || window.webkitURL
    let a = document.createElement('a')
    a.href = URLObj.createObjectURL(blob)
    a.download = fileName + '.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    let canvasNodes = d3.selectAll('canvas')
    if (canvasNodes) {
      canvasNodes.remove()
    }
  })
}

export default {
  createSvgBlobUrl,
  getCustomCSSStyles,
  appendCss,
  canvasToPng,
  downloadSvgLocal,
  downloadPngLocal,
}
