import { select } from "https://cdn.skypack.dev/d3-selection@3"
import { geoAzimuthalEqualArea, geoPath } from "https://cdn.jsdelivr.net/npm/d3-geo@3/+esm"

const tonesMinorScale = ['Ab1','Bb1','Cb2','Db2','Eb2','Fb2','Gb2','Ab2', 'Bb2', 'Cb3','Db3','Eb3','Fb3','Gb3','Ab3']

const rotation = [-95.34, 29.745].map(n => -n)
const scale = 200000
const path = geoPath().projection(geoAzimuthalEqualArea()
    .scale(scale)
    .rotate(rotation)
    .precision(0.1))

const ridesGeoJSONResponse = await fetch('./data/rides-geojson.geojson')
const ridesGeoJSON = await ridesGeoJSONResponse.json()

const pathLengths = ridesGeoJSON.features.map((feature) => (feature.coordinates.length))
const pathLenMin = Math.min(...pathLengths)
const pathLenMax = Math.max(...pathLengths)

const generateRandomHue = () => (Math.floor(Math.random() * 360))
const generateMatchingTone = (hue) => (tonesMinorScale[hue % tonesMinorScale.length])

const generateRandom = (feature) => {
    const randomHue = generateRandomHue()
    const matchingTone = generateMatchingTone(randomHue)
    const toneLength = Math.ceil( ( feature.coordinates.length - pathLenMin ) / ( pathLenMax - pathLenMin ) * 16 )

    return {
        'data-tone': matchingTone,
        'data-note-length': toneLength,
        'stroke': `hsla(${randomHue}, ${Math.round(Math.random() * 50) + 50}%, 65%)`,
    }
}

const geoAttrs = ridesGeoJSON.features.map((feature) => generateRandom(feature))

const generateSVG = (svgElement) => {
    const svg = select(svgElement)
    svg.selectAll('path').remove()
    
    svg.selectAll("path")
        .data(ridesGeoJSON.features)
        .enter()
        .append("path")
        .attr("class", "ride")

        .attr('stroke-width', 1.25)
        .attr('fill', 'transparent')

        .attr('data-tone', (d, i) => (geoAttrs[i]['data-tone']))
        .attr('data-note-length', (d, i) => (geoAttrs[i]['data-note-length']))
        .attr('stroke', (d, i) => (geoAttrs[i]['stroke']))

        .attr('stroke-dasharray', () => (
            `${Math.random() * 5}, ${Math.random() * 10}, ${Math.random() * 3}`
        ))
        .style('transform', () => (
            `rotate(${Math.random() * Math.PI * 2 - Math.PI}rad)
             translateX(${Math.random() * 200 - 100}px)
             translateY(${Math.random() * 200 - 100}px)
            `))
        .style('transform-origin', 'center')
        .attr("d", path)
    
    return svg.node()
}

generateSVG(document.querySelector('#playground'))

document.querySelector('#randomize').addEventListener('click', (clickEvent) => {
    clickEvent.preventDefault()
    generateSVG(document.querySelector('#playground'))
})

let soundOn = false

document.querySelector('#sound').addEventListener('click', async (clickEvent) => {
    clickEvent.preventDefault()
    await Tone.start()
    soundOn = !soundOn
    clickEvent.target.classList.toggle('not-link')
})

const sampler = new Tone.Sampler({
    urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/casio/",
}).toDestination()
const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start()
const synth = new Tone.PolySynth().connect(chorus)

document.addEventListener('mouseover', (hoverEvent) => {
    if (hoverEvent.target.dataset.tone && soundOn) {
        sampler.triggerAttackRelease(
          hoverEvent.target.dataset.tone,
          hoverEvent.target.dataset.noteLength
        )
    }
})