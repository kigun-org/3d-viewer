const viewColors = [
    [0.67, 0.33, 0.33], // sagittal
    [0.33, 0.67, 0.33], // coronal
    [0.33, 0.33, 0.67], // axial
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
