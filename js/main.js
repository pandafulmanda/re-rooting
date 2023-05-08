import { select } from "https://cdn.skypack.dev/d3-selection@3"
import { geoAzimuthalEqualArea, geoPath } from "https://cdn.jsdelivr.net/npm/d3-geo@3/+esm"

const tonesMinorScale = ['Ab1','Bb1','Cb2','Db2','Eb2','Fb2','Gb2','Ab2']

const rotation = [-95.34, 29.745].map(n => -n)
const scale = 200000
const path = geoPath().projection(geoAzimuthalEqualArea()
    .scale(scale)
    .rotate(rotation)
    .precision(0.1))

const ridesGeoJSONResponse = await fetch('./data/rides-geojson.geojson')
const ridesGeoJSON = await ridesGeoJSONResponse.json()

const generateSVG = (svgElement) => {
    const svg = select(svgElement)
    svg.selectAll('path').remove()
    
    svg.selectAll("path")
        .data(ridesGeoJSON.features)
        .enter()
        .append("path")
        .attr("class", "ride")
        .attr('data-tone', () => (tonesMinorScale[Math.floor(Math.random() * tonesMinorScale.length)]))
        .attr('data-note-length', () => (`${Math.pow(2, Math.round(Math.random() * 4))}n`))
        .attr('stroke-width', 1.25)
        .attr('stroke-dasharray', () => (
            `${Math.random() * 5}, ${Math.random() * 10}, ${Math.random() * 3}`
        ))
        .attr('stroke', () => (
            '#'+Math.floor(Math.random() * Math.pow(2,32) ^ 0xffffff).toString(16).substr(-6)
        ))
        .attr('fill', 'transparent')
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