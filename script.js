const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const predictPassButton = document.getElementById('predictPass');
const predictFailButton = document.getElementById('predictFail');
const calculateDistancesButton = document.getElementById('calculateDistances');
const okButton = document.getElementById("ok");
const nextButton = document.getElementById('nextButton');
const resultDiv = document.getElementById('result');
const scoreDiv = document.getElementById('score');
const stepDiv = document.getElementById("step");
const stepDescDiv = document.getElementById("stepDesc");
const width = canvas.width;
const height = canvas.height;
const checkButton = document.getElementById("check");
const showDataPointsButton = document.getElementById("showDataPointsButton");
const showDataPointsContainer = document.getElementById("showDataPointsContainer");
const gameControls = document.getElementById("gameControls");
const predictionIcon = document.getElementById("predictionIcon");

let dataPoints = [];
let newPoint = null;
let calculatedNeighbors = [];
let selectedNeighbors = [];
let round = 0;
const maxRounds = 5;
let score = 0;
let startTime;
let distancesCalculated = false;
let allowNeighborSelection = false;
let dataCollected = false;

// Generate random data points
function generateDataPoints() {
    const points = [
        { x: 50, y: 100, label: 'Pass' },
        { x: 200, y: 150, label: 'Pass' },
        { x: 150, y: 300, label: 'Pass' },
        { x: 100, y: 250, label: 'Pass' },
        { x: 300, y: 200, label: 'Pass' },
        { x: 250, y: 100, label: 'Pass' },
        { x: 450, y: 400, label: 'Fail' },
        { x: 400, y: 450, label: 'Fail' },
        { x: 350, y: 350, label: 'Fail' },
        { x: 500, y: 500, label: 'Fail' },
        { x: 550, y: 400, label: 'Fail' },
        { x: 600, y: 350, label: 'Fail' }
    ];
    return points;
}

function drawDataPoints(points) {
    points.forEach(point => {
        if (point.label === 'Pass') {
            // Draw green check mark
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(point.x - 5, point.y);
            ctx.lineTo(point.x, point.y + 10);
            ctx.lineTo(point.x + 10, point.y - 10);
            ctx.stroke();
        } else {
            // Draw red thick cross
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(point.x - 10, point.y - 10);
            ctx.lineTo(point.x + 10, point.y + 10);
            ctx.moveTo(point.x + 10, point.y - 10);
            ctx.lineTo(point.x - 10, point.y + 10);
            ctx.stroke();
        }
        if (distancesCalculated) {
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.fillText(distance(point, newPoint).toFixed(2), point.x + 15, point.y - 10);
        }
    });
}

ctx.lineWidth = 1;

function drawNewPoint(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', point.x, point.y);
}

function highlightCorrectNeighbors(neighbors) {
    neighbors.forEach(point => {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
    });
}

function highlightSelectedNeighbors(neighbors) {
    neighbors.forEach(point => {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
    });
}

function generateNewPoint() {
    const min = 31;
    const maxX = width - min - 10;
    const maxY = height - min - 10;

    let x = Math.floor(Math.random() * (maxX - min + 1)) + min;
    let y = Math.floor(Math.random() * (maxY - min + 1)) + min;

    return { x, y };
}

function distance(point1, point2) {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

function calculateNearestNeighbors() {
    const distances = dataPoints.map(point => ({
        point,
        dist: distance(point, newPoint)
    }));
    distances.sort((a, b) => a.dist - b.dist);

    const neighbors = [];
    let thresholdDistance = distances[2].dist;

    for (const d of distances) {
        if (d.dist <= thresholdDistance) {
            neighbors.push(d.point);
        }
    }
    calculatedNeighbors = neighbors;
}

canvas.addEventListener('click', (event) => {
    if (round >= maxRounds || !allowNeighborSelection) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    let nearestPoint = null;
    let minDistance = Infinity;
    dataPoints.forEach(point => {
        const dist = distance({ x, y }, point);
        if (dist < minDistance) {
            minDistance = dist;
            nearestPoint = point;
        }
    });

    if (nearestPoint) {
        if (selectedNeighbors.includes(nearestPoint)) {
            selectedNeighbors = selectedNeighbors.filter(point => point !== nearestPoint);
        } else if (selectedNeighbors.length < 3) {
            selectedNeighbors.push(nearestPoint);
        }
        if (selectedNeighbors.length === 3){
            checkButton.disabled = false;
        } else {
            checkButton.disabled = true;
        }
        redrawCanvas();
    }
});

function makePrediction(predictedClass) {
    if (selectedNeighbors.length !== 3) return;

    const allCorrect = selectedNeighbors.every(point => 
        calculatedNeighbors.some(neigh => neigh.x === point.x && neigh.y === point.y)
    );

    const passCount = selectedNeighbors.filter(n => n.label === 'Pass').length;
    const failCount = selectedNeighbors.filter(n => n.label === 'Fail').length;
    const actualClass = passCount > failCount ? 'Pass' : 'Fail';

    resultDiv.innerHTML = ``;
    if (predictedClass === actualClass) {
        resultDiv.innerHTML += '';
        score++;
    } else {
        resultDiv.innerHTML += '';
    }

    highlightCorrectNeighbors(calculatedNeighbors);
    nextButton.style.display = 'inline';
    disableButtons(true);

    updatePredictionIcon(predictedClass);
}

function hideCheckButton() {
    checkButton.style.display = "none";
}

function showCheckButton() {
    if (selectedNeighbors.length !== 3) {
        checkButton.disabled = true;
    } else {
        checkButton.disabled = false;     
    }
    checkButton.style.display = "inline";
}

function startRound() {
    okButton.style.display="none";
    hidePassFailButton();
    hideCheckButton();
    calculateDistancesButton.style.display="inline";
    ctx.clearRect(0, 0, width, height);
    distancesCalculated = false;
    allowNeighborSelection = false;
    selectedNeighbors = [];
    drawGrid();
    drawDataPoints(dataPoints);
    newPoint = generateNewPoint();
    drawNewPoint(newPoint);
    calculateNearestNeighbors();
    nextButton.style.display = 'none';
    disableButtons(false);
    updateProgressBar();
    stepDiv.innerHTML= "Step 1: Calculate the Distances (Euclidean Distance)";
    stepDescDiv.innerHTML = "Press the button below to calculate the distance from the new point (i.e., new student) to all other points (i.e., previous students)."
}

function stepTwo() {
    stepDiv.innerHTML = "Step 2: Select 3 Nearest Neighbors (k=3)";
    stepDescDiv.innerHTML = "On the plot below, click on the 3 previous students that are the nearest to our new student. It does not matter if it is a pass or a fail.";
    showCheckButton();
    allowNeighborSelection = true;
}

function checkNeighbors() {
    if (selectedNeighbors.length !== 3) return;

    const allCorrect = selectedNeighbors.every(point => 
        calculatedNeighbors.some(neigh => neigh.x === point.x && neigh.y === point.y)
    );

    if (!allCorrect) {
        resultDiv.innerHTML = 'Oh! These are not the closest neighbours. Let me help you: the nearest previous students to our new student are now highlighted in yellow. Please correct it.';
        highlightCorrectNeighbors(calculatedNeighbors);
        okButton.style.display = "inline";
        allowNeighborSelection = true;
        return;
    }
    stepThree();
    predictPassButton.disabled = false;
    predictFailButton.disabled = false;
}


function drawGrid() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += 20) {
        if (x % 20 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        if (x % 20 === 0) {
            ctx.save();
            ctx.translate(x + 5, height - 5); 
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(x, 0, 0);
            ctx.restore();
        }
    }

    for (let y = 0; y <= height; y += 20) {
        if (y % 20 === 0) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        if (y % 20 === 0) {
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(height - y, 5, y + 10);        
        }
    }
}

function disableButtons(disable) {
    predictPassButton.disabled = disable;
    predictFailButton.disabled = disable;
    calculateDistancesButton.disabled = disable;
}

function hideDistanceButton() {
    calculateDistancesButton.style.display = 'none';
}

function hidePassFailButton() {
    predictFailButton.style.display = 'none';
    predictPassButton.style.display = 'none';
}

function redrawCanvas() {
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawDataPoints(dataPoints);
    drawNewPoint(newPoint);
    highlightSelectedNeighbors(selectedNeighbors);
}

function init() {
    dataPoints = generateDataPoints();
    startTime = new Date().getTime();
    drawGrid();
    if (dataCollected) {
        startRound();
    }
}

function updateProgressBar() {
    const progress = ((round + 1) / maxRounds) * 100;
    progressBar.style.width = `${progress}%`;
}

function stepThree() {
    stepDiv.innerHTML = "Step 3: Count and Make Prediction";
    stepDescDiv.innerHTML = "Among the three closest neighbours (i.e., selected students), are there more students that passed or failed?";
    predictPassButton.style.display="inline";
    predictFailButton.style.display="inline";
}

okButton.addEventListener("click", () => {
    okButton.style.display="none";
    resultDiv.innerHTML="";
    stepThree();
})

checkButton.addEventListener('click', () => {
    checkButton.style.display="none";
    checkNeighbors();
});

nextButton.addEventListener('click', () => {

});

predictPassButton.addEventListener('click', () => {
    makePrediction('Pass');
    updatePredictionIcon('Pass');
});

predictFailButton.addEventListener('click', () => {
    makePrediction('Fail');
    updatePredictionIcon('Fail');
});

calculateDistancesButton.addEventListener('click', () => {
    distancesCalculated = true;
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawDataPoints(dataPoints);
    drawNewPoint(newPoint);
    highlightSelectedNeighbors(selectedNeighbors);
    hideDistanceButton();
    stepTwo();
});

nextButton.addEventListener('click', () => {
    resultDiv.innerHTML="";
    round++;
    if (round < maxRounds - 1) {
        startRound();
    } else {
        const endTime = new Date().getTime();
        const timeTaken = Math.round((endTime - startTime) / 1000);
        scoreDiv.innerHTML = `Thank you! Your classified ${score} students correctly. You classified all students in ${timeTaken} seconds.`;
        nextButton.style.display = 'none';
        End.style.display = 'inline';
        hideGameControls(); 
    }
});

showDataPointsButton.addEventListener('click', () => {
    drawDataPoints(dataPoints);
    showDataPointsContainer.style.display = 'none';
    gameControls.style.display = 'block';
    dataCollected = true;
    startRound();
});

function updatePredictionIcon(predictedClass) {
    if (predictedClass === 'Pass') {
        predictionIcon.classList.remove('fa-question-circle', 'fa-times');
        predictionIcon.classList.add('fa-check');
        predictionIcon.style.color = 'green';
    } else if (predictedClass === 'Fail') {
        predictionIcon.classList.remove('fa-question-circle', 'fa-check');
        predictionIcon.classList.add('fa-times');
        predictionIcon.style.color = 'red';
    }
}

function hideGameControls() {
    document.getElementById('step').style.display = 'none';
    document.getElementById('stepDesc').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('ok').style.display = 'none';
    document.getElementById('progressBarContainer').style.display = 'none';
}

init();
