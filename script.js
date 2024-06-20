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
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const width = canvas.width;
const height = canvas.height;
const checkButton = document.getElementById("check");

let dataPoints = [];
let newPoint = null;
let calculatedNeighbors = [];
let selectedNeighbors = [];
let round = 0;
const maxRounds = 5;
let score = 0;
let startTime;
let distancesCalculated = false;

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
            ctx.lineWidth = 5; // Thicker line for the check mark
            ctx.beginPath();
            ctx.moveTo(point.x - 5, point.y);
            ctx.lineTo(point.x, point.y + 10);
            ctx.lineTo(point.x + 10, point.y - 10);
            ctx.stroke();
        } else {
            // Draw red thick cross
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 5; // Thicker line for the cross
            ctx.beginPath();
            ctx.moveTo(point.x - 10, point.y - 10);
            ctx.lineTo(point.x + 10, point.y + 10);
            ctx.moveTo(point.x + 10, point.y - 10);
            ctx.lineTo(point.x - 10, point.y + 10);
            ctx.stroke();
        }
        if (distancesCalculated) {
            ctx.fillStyle = 'black';
            ctx.fillText(distance(point, newPoint).toFixed(2), point.x + 15, point.y - 10);
        }
    });
}

// Reset the line width back to 1 after drawing the points
ctx.lineWidth = 1;

// Draw the new point
function drawNewPoint(point) {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, 15, 0, Math.PI * 2); // Adjust the radius as needed
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    
    // Draw the question mark
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', point.x, point.y);
}

// Highlight the correct neighbors with a golden edge
function highlightCorrectNeighbors(neighbors) {
    neighbors.forEach(point => {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1; // reset line width
    });
}

// Highlight the selected neighbors with a black edge
function highlightSelectedNeighbors(neighbors) {
    neighbors.forEach(point => {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1; // reset line width
    });
}

function generateNewPoint() {
    const min = 31; // Minimum value after excluding 0 to 20
    const maxX = width - min-10;
    const maxY = height - min-10;

    // Generate x and y values ensuring they are not between 0 and 20
    let x = Math.floor(Math.random() * (maxX - min + 1)) + min;
    let y = Math.floor(Math.random() * (maxY - min + 1)) + min;

    return { x, y };
}

// Calculate distance between two points
function distance(point1, point2) {
    return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
}

// Calculate and store the nearest neighbors, accounting for ties
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

// Handle canvas click
canvas.addEventListener('click', (event) => {
    if (round >= maxRounds) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find the nearest data point
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
            // Deselect the point if already selected
            selectedNeighbors = selectedNeighbors.filter(point => point !== nearestPoint);
        } else if (selectedNeighbors.length < 3) {
            // Select the point if not already selected and less than 3 selected
            selectedNeighbors.push(nearestPoint);
        }
        if (selectedNeighbors.length == 3){
            checkButton.disabled=false;
        };
        if (selectedNeighbors.length <3){
            checkButton.disabled=true;
        };
        redrawCanvas();
    }
});



// Predict the class based on k-nearest neighbors
function makePrediction(predictedClass) {
    if (selectedNeighbors.length !== 3) return;

    const allCorrect = selectedNeighbors.every(point => 
        calculatedNeighbors.some(neigh => neigh.x === point.x && neigh.y === point.y)
    );

    const passCount = selectedNeighbors.filter(n => n.label === 'Pass').length;
    const failCount = selectedNeighbors.filter(n => n.label === 'Fail').length;
    const actualClass = passCount > failCount ? 'Pass' : 'Fail';

    resultDiv.innerHTML = `You classified that the student will: ${actualClass}<br>`;
    if (predictedClass === actualClass) {
        resultDiv.innerHTML += 'You were correct!';
        score++;
    } else {
        resultDiv.innerHTML += 'You were incorrect.';
    }

    highlightCorrectNeighbors(calculatedNeighbors);  // Highlight correct neighbors with golden edge
    nextButton.style.display = 'inline';
    disableButtons(true);
}

function hideCheckButton(){
    checkButton.style.display = "none";
}

function showCheckButton(){
    if(selectedNeighbors.length !== 3){
        checkButton.disabled = true;
    }
    else{
        checkButton.disabled = false;     
    }
    checkButton.style.display = "inline";
}

// Start a new round
function startRound() {
    step1.style.color="black";
    step3.style.color="grey";
    step2.style.color="grey";
    okButton.style.display="none";
    hidePassFailButton();
    hideCheckButton();
    calculateDistancesButton.style.display="inline";
    ctx.clearRect(0, 0, width, height);
    distancesCalculated = false;
    selectedNeighbors = []; // Reset selected neighbors for the new round
    drawGrid();
    drawDataPoints(dataPoints);
    newPoint = generateNewPoint();
    drawNewPoint(newPoint);
    calculateNearestNeighbors();
    // resultDiv.innerHTML = `Will this student pass or fail?`;
    nextButton.style.display = 'none';
    disableButtons(false);
    updateProgressBar();
    stepDiv.innerHTML= "Step 1: Calculate the Distances";
    stepDescDiv.innerHTML = "Press the button below to calculate the distance from the new point to all other points."
}

function stepTwo(){
    step2.style.color="black";
    step1.style.color="grey";
    stepDiv.innerHTML = "Step 2: Select 3 Nearest Neighbors (k=3)";
    stepDescDiv.innerHTML = "On the plot above, click on the 3 data points that are the nearest to our new student. It does not matter if it is a pass or a fail.";
    showCheckButton();
}

function checkNeighbors(){
    if (selectedNeighbors.length !== 3) return;

    const allCorrect = selectedNeighbors.every(point => 
        calculatedNeighbors.some(neigh => neigh.x === point.x && neigh.y === point.y)
    );

    if (!allCorrect) {
        resultDiv.innerHTML = 'You selected incorrect neighbors. The nearest neighbors are now marked with yellow.';
        highlightCorrectNeighbors(calculatedNeighbors); // Highlight correct neighbors with golden edge
        okButton.style.display="inline";
        return;
    }
    stepThree();
}

function drawGrid() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    // Vertical lines (x-axis)
    for (let x = 0; x <= width; x += 20) {
        if (x % 20 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        if (x % 20 === 0) {
            // Add vertical text labels for x-coordinates
            ctx.save();
            ctx.translate(x + 5, height - 5); // Adjusted position for x-coordinate labels
            ctx.rotate(-Math.PI / 2); // Rotate text vertically
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(x, 0, 0);
            ctx.restore();
        }
    }

    // Horizontal lines (y-axis)
    for (let y = 0; y <= height; y += 20) {
        if (y % 20 === 0) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        if (y % 20 === 0) {
            // Add text labels for y-coordinates
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(height - y, 5, y + 10); // Adjusted to display y-coordinate labels on the left side
        }
    }
}

// Disable or enable buttons
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

// Redraw canvas including grid
function redrawCanvas() {
    ctx.clearRect(0, 0, width, height);
    drawGrid(); // Draw grid first
    drawDataPoints(dataPoints);
    drawNewPoint(newPoint);
    highlightSelectedNeighbors(selectedNeighbors);
}

// Initialize game
function init() {
    
    dataPoints = generateDataPoints();
    startTime = new Date().getTime();
    drawGrid();
    startRound();
}

// Function to update progress bar
function updateProgressBar() {
    const progress = ((round + 1) / maxRounds) * 100;
    progressBar.style.width = `${progress}%`;
}

function stepThree(){
    stepDiv.innerHTML = "Step 3: Count and Make Prediction";
    stepDescDiv.innerHTML = "Among the 3 selected neighbors, are there more passes or fails?";
    predictPassButton.style.display="inline";
    predictFailButton.style.display="inline";
    step3.style.color="black";
    step2.style.color="grey";
}

okButton.addEventListener("click",()=>{
    okButton.style.display="none";
    resultDiv.innerHTML="";
    stepThree();
})

checkButton.addEventListener('click', () =>{
    checkButton.style.display="none";
    checkNeighbors();
});

nextButton.addEventListener('click', () => {

});



// Event listeners for prediction buttons
predictPassButton.addEventListener('click', () => makePrediction('Pass'));
predictFailButton.addEventListener('click', () => makePrediction('Fail'));
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
    if (round < maxRounds - 1) { // Adjusted to maxRounds - 1 to allow for correct round count
        startRound();
    } else {
        const endTime = new Date().getTime();
        const timeTaken = Math.round((endTime - startTime) / 1000);
        scoreDiv.innerHTML = `Game Over! Your score: ${score}/${maxRounds}. Time taken: ${timeTaken} seconds.`;
        nextButton.style.display = 'none'; // Hide the Next button
        viewResultsButton.style.display = 'inline'; // Show the View Results button
        End.style.display = 'inline'; // Show the End button
    }

});

// Start the game


init();

