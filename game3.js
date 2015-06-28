//set up the canvas
var canvas = document.getElementById("gameTest");
var gameProportion;
if(window.innerHeight > window.innerWidth){
  gameProportion = innerWidth;
}else{
  gameProportion = innerHeight;
}

canvas.width = canvas.height = gameProportion;
var ctx = canvas.getContext("2d");
/*
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
  //canvas.width = screen.width - 22;
  //canvas.height = screen.height - 192;

canvas.height = window.innerHeight - 67;
canvas.width = canvas.height;
document.body.appendChild(canvas);*/

//background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function(){ bgReady = true; };
bgImage.src = "background.png";

//wall objects
var wallReady = false;
var wallPNG = new Image();
wallPNG.onload = function(){wallReady = true;};
wallPNG.src = "wall.png";

var floorReady = false;
var floorPNG = new Image();
floorPNG.onload = function(){floorReady = true;};
floorPNG.src = "floor.png";

//floor objects
var fillReady = false;
var fillPNG = new Image();
fillPNG.onload = function(){fillReady = true;};
fillPNG.src = "fill.png";

//map
var map = [];
var mapSet = false;
var walls = [];
var rows = Math.floor(canvas.height / 32);
var cols = rows;

//game objects
var player = {
  speed : 15,  
  x : 3, 
  y : 3
};
var playerReady = false;
var playerPNG = new Image();
playerPNG.onload = function(){playerReady = true;};
playerPNG.src = "player.png";

var npc = {
  speed : player.speed,  
  x : 8, 
  y : 8
};
var npcReady = false;
var npcPNG = new Image();
npcPNG.onload = function(){npcReady = true;};
npcPNG.src = "npc.png";

//ai
var frontier = [];
var start = [npc.x, npc.y];
frontier.push(start);
var closedCells = [];
closedCells.push(start);
var index = 0;
var parents = [];


//input variables 
var moveKey = null;
var npcCanMove = false;

var tapMove = true;
var holdMove = false;

var canMove = false;
var speedTime;

var upKey = 38;
var downKey = 40;
var leftKey = 37;
var rightKey = 39;

//handle user input
function switchHands(value){
  if(value == "arrows"){
    upKey = 38;
    downKey = 40;
    leftKey = 37;
    rightKey = 39;
  }else if(value == "WASD"){
    upKey = 87;
    downKey = 83;
    leftKey = 65;
    rightKey = 68;
  }
  canvas.focus();
}
function switchMove(value){
  if(value == "tap"){
    tapMove = true;
    holdMove = false;
  }else{
    tapMove = false;
    holdMove = true;
  }
}

var counter = 0;
function moveType(e){
  if(tapMove && moveKey === null){
    canMove = true;
    move(e);
  }else if(holdMove){
    //if first step
    if(moveKey === null){
      //canMove = true;
      move(e);
    }
    //if one of the movement keys pressed
    if(e.keyCode == upKey || e.keyCode == downKey || e.keyCode == leftKey || e.keyCode == rightKey){
      counter++;
    }
    //every interval, move another step then restart counter
    if(counter % player.speed === 0 && counter !== 0){
      canMove = true;
      move(e);
      counter = 0;
    }
  }
}


function move(e){
  if(canMove){
    moveKey = e.keyCode;
    
    if(e.keyCode == upKey && moveNext(player, "up")){
      player.y -= 1;
      moveKey = upKey;
      canMove = false;
    }else if(e.keyCode == downKey && moveNext(player, "down")){
      player.y += 1;
      moveKey = downKey;
      canMove = false;
    }else if(e.keyCode == leftKey && moveNext(player, "left")){
      player.x -= 1;
      moveKey = leftKey;
      canMove = false;
    }else if(e.keyCode == rightKey && moveNext(player, "right")){
      player.x += 1;
      moveKey = rightKey;
      canMove = false;
    }
  }
}

function resetKey(e){
  if(moveKey == e.keyCode){
    moveKey = null;
    counter = 0;
    npcCanMove = false;
    canMove = false;
  }
}

function moveNext(entity, dir){
  var playX = entity.x;
  var playY = entity.y;
  
  //console.log(playX + " " + playY);
  //console.log(map[playY][playX]);
  
  if(dir == "up"){
    if(map[playY - 1][playX] === 0){
      return true;
    }else{
      return false;
    }
  }
  if(dir == "down"){
    if(map[playY + 1][playX] === 0){
      return true;
    }else{
      return false;
    }
  }
  if(dir == "left"){
    if(map[playY][playX - 1] === 0){
      return true;
    }else{
      return false;
    }
  }
  if(dir == "right"){
    if(map[playY][playX + 1] === 0){
      return true;
    }else{
      return false;
    }
  }
}


//prevent other interactions when arrow keys or wasd keys down 
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([87, 83, 65, 68, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);


///////////////////////////////////  NPCS  /////////////////////////////////////

/*
  the ratio of the player's speed [counting based on computation speed]
              vs. the npc's speed [interval based on timing]
        is  15:610 -> 3:122 -> 1:40 2/3
*/

function runNPC(){
  setInterval(function(){npc.x += 1;}, npc.speed*(40+(2/3))); 
}
function npcKey(e){
  if((e.keyCode == upKey || e.keyCode == downKey || e.keyCode == leftKey || e.keyCode == rightKey) && !npcCanMove){
    npcCanMove = true;
    pathNPC();
    
  }
}

function pathNPC(){
  var playerPos = [player.x, player.y];
  var npcPos = [npc.x, npc.y];
  var current = playerPos;
    
  resetFrontier();
  
  parents = [];
  while(index < frontier.length){
    findArea();
  }
  var enemyPath = findPath(npcPos, playerPos);
  if(!arrEq(enemyPath[0], [-1,-1])){
    npc.x = enemyPath[enemyPath.length - 1][0];
    npc.y = enemyPath[enemyPath.length - 1][1];
  }else{
    console.log("Unreachable");
  }
}
function findPath(start, end){
  var path = []
  if(inClosedCells(end)){
    while(!arrEq(end, start)){
      path.push(end);
      end = findParents(end);
    }
    return path;
  }
  return [[-1,-1]];
}
function findParents(child){
  for(var y = 0; y < parents.length; y++){
    var dad = parents[y][0];
    var kid = parents[y][1];
    if(arrEq(kid, child)){
      return dad;
    }
  }
  return [-1,-1];
}

function findArea(){
  if(index < frontier.length){
    var neighbors = getNeighbors(frontier[index]);
    if(neighbors.length < 1){
      index++;
      neighbors = getNeighbors(frontier[index]);
    }
    
    var prtOut = "";
    var pInd = 0;
    for(var t = 0; t < neighbors.length; t++){
      if(!inClosedCells(neighbors[t])){
        closedCells.push(neighbors[t]);
        frontier.push(neighbors[t]);
        prtOut += neighbors[t] + ", ";
        if(!inParents(neighbors[t])){
          var family = [frontier[index], neighbors[t]];     //parent then child
          parents.push(family);
          //console.log(parents[pInd][0] + ", " + parents[pInd][1]);
          pInd++;
        }
      }
      
    }
    //console.log(prtOut);
    
    index++;
  }
}
function getNeighbors(pos){
  var neighbor = [];
  var north = [pos[0], pos[1]-1];
  var east = [pos[0]+1, pos[1]];
  var south = [pos[0], pos[1]+1];
  var west = [pos[0]-1, pos[1]];
  if(((pos[1] - 1) >= 0) && (map[pos[1] -1][pos[0]] != 1))
    neighbor.push(north);
  if(((pos[0] - 1) >= 0) && (map[pos[1]][pos[0] - 1] != 1))
    neighbor.push(west);
  if(((pos[1] + 1) < map.length) && (map[pos[1] +1][pos[0]] != 1))
    neighbor.push(south);
  if(((pos[0] + 1) < map[0].length) && (map[pos[1]][pos[0] + 1] != 1))
    neighbor.push(east);
  
  return neighbor;
}

function inClosedCells(pos){
  for(var v = 0; v < closedCells.length; v++){
    if(arrEq(pos, closedCells[v]))
      return true;
  }
  return false;
}
function inParents(pos){
  for(var v = 0; v < parents.length; v++){
    for(var o = 0; o < parents[v].length; o++){
      if(arrEq(pos, parents[v][o]))
        return true;
    }
  }
  return false;
}

function arrEq(arr1, arr2){
  for(var p = 0; p < arr1.length; p++){
    if(arr1[p] !== arr2[p])
      return false
  }
  return true;
}
function resetFrontier(){
  frontier = [];
  start = [npc.x, npc.y];
  frontier.push(start);
  closedCells = [];
  closedCells.push(start);
  index = 0;
    
  parents = [];
}


////////////////////////////////////////     MAP FUNCTIONS   ////////////////////////////////////////////

//determine which type of room to make
var mapType = "rooms";
function newMap(type){
  if(type == "random"){
    mapType = "random";
  }else{
    mapType = "rooms";
  }
}
function createMap(){
  if(mapType == "random")
    createRandom();
  else
    createRooms();
}


/////////////////   PCG GENERATED  /////////////

var prevX;
var prevY;
var curX;
var curY;

function createRooms(){
  //reset everything
  map = [];
  mapSet = false;
  prevX = null;
  prevY = null;
  curX = null;
  curY = null;
  //set everything to a wall sprite for a blank canvas
  for(var v = 0; v < rows; v++){
    var row2 = [];
    for(var w = 0; w < cols; w++){
      row2.push(1);
    }
    map.push(row2);
  }
  mapSet = true;
  
  //pick random number of rooms to make
  var roomsTot = Math.floor(Math.random() * 8) + 4;
  console.log(roomsTot + " rooms generated: MAX");
  
  //pick random coordinates for each room to start in then make it
  for(var tot = 0; tot < roomsTot; tot++){
    var corX = Math.floor(Math.random() * (rows - 10)) + 1;
    var corY = Math.floor(Math.random() * (cols - 10)) + 1;
    for(var pp = 0; pp < 10; pp++){       //try 10 more times
      if(map[corX][corY] == 0){
        corX = Math.floor(Math.random() * (rows - 10)) + 1;
        corY = Math.floor(Math.random() * (cols - 10)) + 1;
      }
    }
    newRoom(corX, corY);
  }
  
  //set the outer walls
  setWalls();
  
  //reset player positions for new game
  resetPos("player");
  resetPos("npc");
  
}
function newRoom(x, y){
  //make a random width and height
  var width = Math.floor(Math.random() * 7) + 3;
  var height = Math.floor(Math.random() * 7) + 3;
  
  //if those didn't work, try 10 more times until it does
  for(var p = 0; p < 10; p++){
    if(roomHere(width, height)){
      width = Math.floor(Math.random() * 7) + 3;
      height = Math.floor(Math.random() * 7) + 3;
    }
  }
  
  //if coords are ok then make a new room
  if(!roomHere(width, height)){
    //set the center for this room
    curX = x + Math.ceil(width / 2);
    curY = y + Math.ceil(height / 2);
    
    //carve out the new room
    for(var v = 0; v < width; v++){
      for(var w = 0; w < height; w++){
        map[v + x][w + y] = 0;
      }
    }
    //make the corridor to connect to the previous room
    var VH = Math.floor(Math.random() * 2) + 1;
    VH == 1 ? newAlley("h") : newAlley("v");
    
    /*
    console.log(x + ", " + y);
    console.log("W: " + width + "\tH: " + height);
    if((prevX !== null) && (prevY !== null)){
      var dx = Math.abs(prevX - curX);
      var dy = Math.abs(prevY - curY);
      console.log("DX: " + dx + "\tDY: " + dy);
    }
    */
    
    //make the new center the old center for next branch
    prevX = x + Math.floor(width / 2);
    prevY = y + Math.floor(height / 2);
    
    //console.log(prevX + ", " + prevY);
    
  }else{
    return;
  }
}
//check if there is already a room placed there
function roomHere(w, h){
  for(var t = 0; t < w; t++){
    for(var u = 0; u < h; u++){
      if(map[t][u] == 0)
        return true;
    }
  }
  return false;
}
//make new corridors to connect the rooms together
function newAlley(type){
  if((prevX !== null) && (prevY !== null)){
    var xDist = Math.abs(prevX - curX);
    var yDist = Math.abs(prevY - curY);
    if(type == "h"){    //if horizontal first
      for(var a1 = 0; a1 <= xDist; a1++){
        if(curX > prevX){     //if last room is to the left of this room
            map[prevX + a1][prevY] = 0;
        }else {               //if last room is to the right of this room
            map[prevX - a1][prevY] = 0;
        }
      }
      for(var b1 = 0; b1 <= yDist; b1++){
        if(curY > prevY){     //if next room is below the current room
            map[curX][prevY + b1] = 0;
        }else{                //if next room is above current room
            map[curX][prevY - b1] = 0;
        }
      }
    }else if(type == "v"){    //if horizontal first
      for(var b2 = 0; b2 <= yDist; b2++){
        if(curY > prevY){     //if next room is below the current room
            map[curX][prevY + b2] = 0;
        }else{                //if next room is above current room
            map[curX][prevY - b2] = 0;
        }
      }
      for(var a2 = 0; a2 <= xDist; a2++){
        if(curX > prevX){     //if last room is to the left of this room
            map[prevX + a2][prevY] = 0;
        }else {               //if last room is to the right of this room
            map[prevX - a2][prevY] = 0;
        }
      }
    }
  }
  else
    return;
}


///////////    RANDOMLY GENERATED   ////////

function createRandom(){
  console.log("NEW MAP GENERATING!");
  //reset the map
  map = [];
  mapSet = false;
  //build new set
  for(var a = 0; a < rows; a++){
    var newRow = [];
    for(var b = 0; b < cols; b++){
      var dice = Math.floor(Math.random() * 10);
      if(dice >= 7){
        newRow.push(1);
      }else{
        newRow.push(0);
      }
    }
    map.push(newRow);
  }
  
  //set the outer walls
  var outWalls = document.getElementById('walls').checked;
  if(outWalls){
    setWalls();
  }
  
  mapSet = true;
  resetPos("player");
  resetPos("npc");
}

////////////  side functions  //////////////

function setWalls(){
  for(var aa = 0; aa < cols; aa++){   //set top
    map[0][aa] = 1;
  }
  for(var bb = 0; bb < cols; bb++){   //set bottom
    map[rows - 1][bb] = 1;
  }
  for(var cc = 0; cc < rows; cc++){   // set left side
    map[cc][0] = 1;
  }
  for(var dd = 0; dd < rows; dd++){   //set right side
    map[dd][cols - 1] = 1;
  }
}
function resetPos(entity){
  var newX = Math.floor(Math.random() * cols);
  var newY = Math.floor(Math.random() * rows);
  if(entity == "player"){
    //reset the Player positions
    while(map[newY][newX] == 1 || ((newX == npc.x) && (newY == npc.y))){
      newX = Math.floor(Math.random() * cols);
      newY = Math.floor(Math.random() * rows);
    }
    player.x = newX; 
    player.y = newY;
  }else if(entity == "npc"){
    //reset the NPC positions
    while(map[newY][newX] == 1 || ((newX == player.x) && (newY == player.y))){
      newX = Math.floor(Math.random() * cols);
      newY = Math.floor(Math.random() * rows);
    }
    npc.x = newX;
    npc.y = newY;
    
    resetFrontier();
  }
}


function drawMap(){
  if(mapSet){
    for(var z = 0; z < rows; z++){
      for(var y = 0; y < cols; y++){
        if(map[z][y] == 1){
          ctx.drawImage(wallPNG, y * 32, z * 32);
        }else if(map[z][y] == 0){
          ctx.drawImage(floorPNG, y * 32, z * 32);
        }
      }
    }
  }
}

function printMap(){
  for(var q = 0; q < rows; q++){
    console.log(map[q].toString());
  }
}

/////////////////  VISUAL FUNCTIONS   ///////////////////

//draw everything
function render(){
  
  if(wallReady){
    var pat = ctx.createPattern(wallPNG, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0,0, canvas.width, canvas.height);
  }
  //fillAll();
  if(wallReady && floorReady){
    drawMap();
  }
  if(playerReady){
    ctx.drawImage(playerPNG, player.x * 32, player.y * 32);
  }
  if(npcReady){
    ctx.drawImage(npcPNG, npc.x * 32, npc.y * 32);
  }
  
}
function fillAll(){
  for(var i = 0; i < closedCells.length; i++){
    var cell = closedCells[i];
    if(fillReady){
      ctx.drawImage(fillPNG, cell[0] * 32, cell[1] * 32);
    }
  }
}


//main game loop
function main(){
  var now = Date.now();
  var delta = now - then;
  //update(delta / 1000);
  render();
  then = now;
  //repeat again asap
  requestAnimationFrame(main);
  
  window.addEventListener("keydown", moveType, false);
  window.addEventListener("keydown", npcKey, false)
  window.addEventListener("keydown", debugDown, false);
  window.addEventListener("keyup", resetKey, false);
  window.addEventListener("keypress", debug, false);

  canvas.focus();
  newGame();
}

//cross browser support for updating animation frames
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

//LETS PLAY!
var then = Date.now(); 
main();

////////////////////////////////  DEBUGS  //////////////////////////////////////////
function debug(e){
  if(e.keyCode == 122){       //[Z]
    //console.log(moveKey);
    //console.log("X: " + player.x + "\tY: " + player.y);
    //printMap();
    //console.log("R: " + rows + "\tC: " + cols);
    console.log("Player: X: " + player.x + "\tY: " + player.y);
    console.log("NPC: X: " + npc.x + "\tY: " + npc.y);
  }
}

function debugDown(e){
  if(e.keyCode == 87){       //[W]
    //console.log("HIT W");
  }
}
function newGame(){
  if((player.x == npc.x) && (player.y == npc.y)){
    createMap();
  }
}



