const HIGH_VALUE = 0.75
const LOW_VALUE = 0.5

const viewColors = [
    [HIGH_VALUE, LOW_VALUE, LOW_VALUE], // sagittal
    [LOW_VALUE, HIGH_VALUE, LOW_VALUE], // coronal
    [LOW_VALUE, LOW_VALUE, HIGH_VALUE], // axial
]

function getColor(i) {
    return viewColors[i]
}

function getColor256(i) {
    return [
        Math.round(viewColors[i][0] * 255),
        Math.round(viewColors[i][1] * 255),
        Math.round(viewColors[i][2] * 255)
    ]
}

function getColorRGBString(i) {
    if (i < 0 || i >= 3) {
        return 'rgb(0, 0, 0)';
    }

    const colors = getColor256(i)
    return `rgb(${colors[0].toString()}, ${colors[1].toString()}, ${colors[2].toString()})`;
}

export {getColor, getColor256, getColorRGBString}
