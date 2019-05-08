var height = 25, width = 25, num_cols=Math.floor(($(window).width()*.8)/width), num_rows=Math.floor(($(window).height()*.7)/height), defaultSnakeLength=5, defaultTimeOutTime=110;
var currSq_i, currSq_j, prize_i, prize_j, sq_arr, curr_dir, wrap, gameOver, gameWon, timeOutTime, snake_length, autoPlay,disableInput;
var backgroundColor = "lightblue", snakeColor = "#FDE74C";
var prize_audio=new Audio('./assets/prize.mp3'), lose_audio=new Audio('./assets/lose.mp3'), win_audio=new Audio('./assets/win.mp3');
class sq{
	constructor(i, j){ 
		this.el = $(`.snake-row:nth-child(${i}) .snake-col:nth-child(${j})`);
		this.type="empty";
	}
	setLeftSq(s) { 	this.leftSq = s;	}
	setRightSq(s){ 	this.rightSq = s;	}
	setUpSq(s)   { 	this.upSq = s; 		}
	setDownSq(s) { 	this.downSq = s;	}
	oppositeDir(dir){
		if(dir == "left") 	return "right";
		if(dir == "right") 	return "left";
		if(dir == "up") 	return "down";
		if(dir == "down") 	return "up";
	}
	updateVal(v,dir) {	
		this.el.empty();
		if(v == -100){
			this.el.append("<span class='material-icons' style='color:#FE9920;position:absolute;'>whatshot</span>");
			this.prevSqDir=null;
			this.type="prize";
		}
		else if(v <= 0){
			this.el.css({"background-color":backgroundColor});
			this.prevSqDir=null;
			this.type="empty";
		}
		else{
			if(!this.prevSqDir){
				this.prevSqDir = this.oppositeDir(dir);
				var angle = 0;
				if(this.prevSqDir == "left") angle=180;
				if(this.prevSqDir == "down") angle=90;
				if(this.prevSqDir == "up") angle=-90;
				if(v==snake_length) this.el.append(`<span class='material-icons' style='color:#FE9920;position:absolute;transform:rotate(${angle}deg);'>chevron_left</span>`);
			}
			this.el.css({"background-color":snakeColor});
			this.type="snake";
			if(this.prevSqDir == "right"    && this.rightSq) this.rightSq.updateVal(v-1);
			else if(this.prevSqDir == "left" && this.leftSq) this.leftSq.updateVal(v-1);
			else if(this.prevSqDir == "up"   && this.upSq) 	 this.upSq.updateVal(v-1);
			else if(this.prevSqDir == "down" && this.downSq) this.downSq.updateVal(v-1);  
		}
	}
}
function init(){
	if(num_rows*num_cols <= snake_length){ 
		console.log("Not enough spaces!");
		return;
	}
	//generate square HTML elements
	for(var i=0; i<num_rows; i++){
		var prototype_row = $("<div class='snake-row'></div");
		for(var j=0; j<num_cols; j++){
			var prototype_col = $("<div class='snake-col'></div");
			prototype_row.append(prototype_col);
		}
		$("#snake_container").append(prototype_row);
	}
	$(".snake-col").css({"height":height,"width":width, "background-color":backgroundColor});
	$(".snake-row").css({"height":height,"width":width*num_cols});
	$("#snake_container").css({"width":width*num_cols+2});
	$("#buttonsContainer").css({"width":width*num_cols+2});
	$("#infoButton").css({"right":Math.floor(($(window).width()-(width*num_cols+2))*.5)});
	closeGameOver();
	//init sq class
	for(var i=0; i<num_rows; i++){
		sq_arr.push([]);
		for(var j=0; j<num_cols; j++)
			sq_arr[i].push(new sq(i+1,j+1));
	}
	//inform neighbors
	for(var i=0; i<num_rows; i++){
		for(var j=0; j<num_cols; j++){
			if(i > 0) 			sq_arr[i][j].setUpSq(sq_arr[i-1][j]);
			else 				sq_arr[i][j].setUpSq(sq_arr[num_rows-1][j]);
			if(i < num_rows-1) 	sq_arr[i][j].setDownSq(sq_arr[i+1][j]);
			else 				sq_arr[i][j].setDownSq(sq_arr[0][j]);
			if(j > 0) 			sq_arr[i][j].setLeftSq(sq_arr[i][j-1]);
			else 				sq_arr[i][j].setLeftSq(sq_arr[i][num_cols-1]);
			if(j < num_cols-1) 	sq_arr[i][j].setRightSq(sq_arr[i][j+1]);
			else 				sq_arr[i][j].setRightSq(sq_arr[i][0]);
		}
	}
}
function incrementCurrSq(){
	if(curr_dir == "up"){
		if(!currSq_i){
			if(wrap) currSq_i = num_rows-1;
			else gameOver = true;
		} 
		else currSq_i--;
	}
	else if(curr_dir == "down"){
		if(currSq_i == num_rows-1){
			if(wrap) currSq_i = 0;
			else gameOver = true;
		}
		else currSq_i++;
	}
	else if(curr_dir == "left"){
		if(currSq_j == 0){
			if(wrap) currSq_j = num_cols-1;
			else gameOver = true;
		}
		else currSq_j--;
	}
	else{
		if(currSq_j == num_cols-1){
			if(wrap) currSq_j = 0;
			else gameOver = true;
		}
		else currSq_j++;
	}
}
function setPrize(set){
	var row = Math.floor(Math.random()*num_rows);
	var col = Math.floor(Math.random()*num_cols);
	while(sq_arr[row][col].type != "empty"){
		row = Math.floor(Math.random()*num_rows);
		col = Math.floor(Math.random()*num_cols);
	}
	prize_i=row,prize_j=col;
	sq_arr[row][col].updateVal(-100);
	if(set) setTimeout(runGame, timeOutTime);

}
function runGame(){
	if(autoPlay) decideAutoplayDirection();
	var dir = curr_dir;
	incrementCurrSq();
	if(sq_arr[currSq_i][currSq_j].type == "prize"){ 
		snake_length++;
		prize_audio.play();
		if(snake_length >= num_rows*num_cols){
			gameOver=true;
			gameWon=true;
			runGameEnd();
			return;
		}
		sq_arr[currSq_i][currSq_j].updateVal(snake_length,dir);
		setPrize(true);
		return;
	}
	if(sq_arr[currSq_i][currSq_j].type == "snake")
		gameOver=true;
	sq_arr[currSq_i][currSq_j].updateVal(snake_length,dir);
	if(!gameOver) setTimeout(runGame, timeOutTime);
	else runGameEnd();
}
function restart(){
	$("#GameStartButton").attr("disabled",true);
	var highestTimeoutId = setTimeout(";");
	for (var i = 0 ; i < highestTimeoutId ; i++)
	    clearTimeout(i); 
	snake_length=defaultSnakeLength;
	gameOver=false;
	gameWon=false;
	autoPlay=false;
	disableInput=false;
	$("#snake_container").empty();
	$("#autoPlaySwitch").prop("checked",false);
	currSq_i=Math.floor(num_rows/2);
	currSq_j=Math.floor(num_cols/2);
	curr_dir="left";
	wrap=true;
	sq_arr=[];
	setNewSpeed(defaultTimeOutTime);
	$("#autoPlaySwitchContainer").tooltip('hide').attr('data-original-title', "Enable autoplay");
	$("#wrapSwitch").prop("disabled",false);
	$("#wrapSwitch").prop("checked",true);
	$("#wrapSwitchContainer").attr('data-original-title', "Disable wrapping");
	$("#speedSlider").tooltip("hide");
	$("#speedSlider").prop("value","95");
	$("#GameStartButton").removeAttr("disabled");
	init();
	setPrize();
	runGame();
	$(".loading-cover").fadeOut();
}
document.onkeydown = function (e) {
	if(!e.isTrusted || disableInput) return;
	if(e.key == "Escape") $(".overlay").fadeOut();
	if(autoPlay && (e.code == "ArrowUp" || e.code == "ArrowDown" || e.code == "ArrowLeft" || e.code == "ArrowRight")){
		showAutoPlayWarning();
		return;
	}
	if(e.code == "ArrowUp" && curr_dir!="down") 		curr_dir = "up";
	else if(e.code == "ArrowDown" && curr_dir!="up") 	curr_dir = "down";
	else if(e.code == "ArrowLeft" && curr_dir!="right") curr_dir = "left";
	else if(e.code == "ArrowRight" && curr_dir!="left") curr_dir = "right";
	// else if(e.key == "s") gameOver=true; //todo
	disableInput = true;
	setTimeout(function(){disableInput=false;},timeOutTime-10);
};
function setNewSpeed(v){
	timeOutTime = v;
	$("#speedSlider").attr('data-original-title', `Speed: ${210-timeOutTime}`).tooltip('show');
}
function wrapToggle(){
	wrap = !wrap;
	if(!wrap) $("#wrapSwitchContainer").attr('data-original-title', "Enable wrapping").tooltip('show');
	else $("#wrapSwitchContainer").attr('data-original-title', "Disable wrapping").tooltip('show');
}
function toggleAutoPlay(){
	autoPlay = !autoPlay;
	if(autoPlay) $("#autoPlaySwitchContainer").tooltip('hide').attr('data-original-title', "Disable autoplay").tooltip('show');
	else $("#autoPlaySwitchContainer").tooltip('hide').attr('data-original-title', "Enable autoplay").tooltip('show');
	if(autoPlay){
		wrap=true;
		$("#wrapSwitch").prop("checked",true);
		$("#wrapSwitchContainer").attr('data-original-title', "Not allowed");
		$("#wrapSwitch").prop("disabled",true);
	}
	else{
		$("#wrapSwitch").prop("checked",true);
		$("#wrapSwitchContainer").attr('data-original-title', "Disabling wrapping");
		$("#wrapSwitch").prop("disabled",false);
	}
}
function runGameEnd(){
	var msg = "Looks like you failed...";
	if(gameWon){ 
		msg="Great job! You won!";
		$("#gameOver .imageHolder").css({"background-image":"url(./assets/win.gif)"});
		win_audio.play();
	}
	else{
		$("#gameOver .imageHolder").css({"background-image":"url(./assets/lose.gif)"});
		lose_audio.play();
	}
	$("#gameOver h3").text(msg);
	$("#gameOver").fadeIn();
}
function closeGameOver(){ $("#gameOver").fadeOut(); }
function showInfo(){ $("#infoContainer").fadeIn(); }
function closeInfoContainer(){ $("#infoContainer").fadeOut(); }
function decideAutoplayDirection(){
	function snakeExists(dir){
		if(dir=="left"){
			for(var j=currSq_j-1; j>-1; j--)
				if(sq_arr[currSq_i][j].type=="snake") return true;
			return false;
		}
		if(dir=="right"){
			for(var j=currSq_j+1; j<num_cols; j++)
				if(sq_arr[currSq_i][j].type=="snake") return true;
			return false;
		}
		if(dir=="up"){
			for(var i=currSq_i-1; i>-1; i--)
				if(sq_arr[i][currSq_j].type=="snake") return true;
			return false;
		}
		if(dir=="down"){
			for(var i=currSq_i+1; i<num_rows; i++)
				if(sq_arr[i][currSq_j].type=="snake") return true;
			return false;
		}
	}
	if(curr_dir == "left" || curr_dir == "right"){
		if(currSq_i!=0) curr_dir = "up";
		else curr_dir = "down";
	}
	else if((curr_dir == "up" || curr_dir == "down") && (currSq_i==num_rows-1 || currSq_i==0)){
		curr_dir = "left";
	}
}
function showAutoPlayWarning(){
	if($("#autoPlayMsg").children().length) return; //msg in progress
	$("#autoPlayMsg").append("<h4>Disable autoplay to control the snake</h4>");
	$("#autoPlayMsg").fadeIn("slow",function(){
		$(this).delay(3000).fadeOut("slow",function(){ $(this).empty(); });
	});
}
window.onresize = function(){ location.reload(); }
$("#snake_container").click(function(e){
	if(autoPlay){
		showAutoPlayWarning();
		return;
	}
	var c_x = e.clientX, 
		c_y = e.clientY, 
		e_x = $(`.snake-row:nth-child(${currSq_i+1}) .snake-col:nth-child(${currSq_j+1})`).offset().left,
		e_y = $(`.snake-row:nth-child(${currSq_i+1}) .snake-col:nth-child(${currSq_j+1})`).offset().top;
	if(curr_dir=="left" || curr_dir=="right"){
		if(c_y < e_y) curr_dir = "up";
		else curr_dir = "down";
	}
	else{
		if(c_x > e_x) curr_dir = "right";
		else curr_dir = "left";
	}
});
$(".overlay").fadeOut(0);
restart();
$('[data-toggle="tooltip"]').tooltip({animation: true});
//these gifs are awesome! https://qotoqot.com/sad-animations/
