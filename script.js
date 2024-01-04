// Define html elements
const board = document.getElementbyId('game-board');

//Define game variables
let snake = [{x:10, y:10}];
let food = generateFood();
let direction ='right';
const gridSize=20;

//Draw game map, snake , food
function draw() {
    board.innerHTML = "";
    drawSnake();
    drawFood();
}


//Draw snake
function drawSnake() {
    snake.forEach((segment) => {
        const snakeElement = createGameElement('div','snake');
        setPosition(snakeElement, segment);
        board.appendChild(snakeElement);
    });
}

// Create A snake or food cube<div></div>
function createGameElement(tag, className) {
    const element = document.createElement(tag);
    element.ckassName = className;
    return element;
}

//Set the position of the snake or food
function setPosition(element, position) {
    element.style.gridColumn = position.x;
    element.style.gridRow = position.y;
}
//Testing  draw function
// draw();

//Draw Food function
function drawFood() {
    const foodElement = createGameElement('div','food');
    setPosition(foodElement, food);
    board.appendChild(foodElement);
}

//Generate Food
function generateFood() {
    const x = Math.Floor(Math.random() * gridSize) + 1;
    const y = Math.Floor(Math.random() * gridSize) + 1;
    return { x, y };
}

//Snake movement
function move(){
    const head = {...snake[0]};
    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'right':
            head.x++;
            break;
        case 'left':
            head.x--;
            break;
        case 'down':
            head.y++;
            break;       
    }

    snake.unshift(head);
    snake.pop();
}