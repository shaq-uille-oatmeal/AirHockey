

var score={                                                     //SCORE
    left:0,
    right:0
}

var mouse={                 //Mouse object defined here
    x:window.innerWidth/2,
    y:window.innerHeight/2
}

var max_score=localStorage.goals;
var no_of_pucks=Number(localStorage.pucks);


class vector{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
     
    rescale(factorx,factory){
        return new vector(this.x*factorx,this.y*factory);
    }   
     
    add(a,b){
        return new vector(this.x+a,this.y+b);
    }
}


class sphere{
    constructor(pos,radius,color){
        this.pos=pos;
        this.radius=radius;
        this.color=color;
        this.vx;
        this.vy;  
        this.v=8;           //8 is the speed of puck and not an arbitrary value
    }

    create(){
        ct.fillStyle=this.color;
        ct.beginPath();
        ct.arc(this.pos.x,this.pos.y,this.radius,0,2*Math.PI);
        ct.fill();
        ct.closePath();
    }
    
    update(){
        

        if (this.pos.x<=this.radius || this.pos.x>=(canvas_dim.x-this.radius)){
            this.vx=-this.vx;
            
        }
        
        if (this.pos.y<=this.radius || this.pos.y>=(canvas_dim.y-this.radius)){
            this.vy=-this.vy;
            
        }
        this.pos=this.pos.add(this.vx,this.vy);
        

        this.create();
        
    }

    update_paddle_1(){                          //Paddle follows the mouse pointer
        
        var v= 5;                                                                    //speed of the paddle (fixed)

        if (Math.abs(mouse.y-this.pos.y)>5|| Math.abs(mouse.x-this.pos.x)>5){         //Prevents vibration
            var theta= Math.atan2(mouse.y-this.pos.y, mouse.x-this.pos.x);
            this.vx=v*Math.cos(theta);
            this.vy=v*Math.sin(theta);
            
            
            if (this.pos.x>=canvas_dim.x/2 && mouse.x-this.pos.x>0){
                this.pos=this.pos.add(0,this.vy);
            }
    
            else this.pos=this.pos.add(this.vx,this.vy);
        }
         
        this.create();
        
    }
    
    update_paddle_computer(pucks){

        var v=5;
        this.vx=0;
        

        var min_distance=window.innerWidth;
        var closest_puck;
        for (var i=0;i<no_of_pucks;i++){
            var current_puck=pucks[i];
            var sep_x=current_puck.pos.x-this.pos.x;
            var sep_y=current_puck.pos.y-this.pos.y;
            var distance=Math.sqrt(sep_x*sep_x+sep_y*sep_y);

            if (distance<min_distance){
               closest_puck=current_puck;
               min_distance=distance;
            }
        }

        if(closest_puck.pos.x<=canvas_dim.x/2){                                     //CONDITION to FOLLOW PUCK ONLY ALONG Y
            if(this.pos.x>=0.80*canvas_dim.x){

                if(closest_puck.pos.y-this.pos.y>=0){
                    this.vy=v;

                }
                else if(closest_puck.pos.y-this.pos.y<=0){
                    this.vy=-v;
                }
            }
            else{
                this.vx=v;
            }
        }
        
        else{
            var theta= Math.atan2(closest_puck.pos.y-this.pos.y, closest_puck.pos.x-this.pos.x);
            this.vx=v*Math.cos(theta);
            this.vy=v*Math.sin(theta); 

        }

        this.pos=this.pos.add(this.vx,this.vy);

        this.create();
    }
}

class rectangle{
    constructor(corner_pos,l,b,color){
        this.corner_pos=corner_pos;
        this.l=l;
        this.b=b;
        this.color=color;
    }

    create(){
        ct.fillStyle=this.color;
        ct.beginPath();
        ct.fillRect(this.corner_pos.x,this.corner_pos.y,this.l,this.b);
        ct.closePath();
    }
}



function collision(paddle,puck){
     
    var distance=Math.sqrt((puck.pos.y-paddle.pos.y)*(puck.pos.y-paddle.pos.y)+(puck.pos.x-paddle.pos.x)*(puck.pos.x-paddle.pos.x));
    check_collision=(distance <= puck.radius+paddle.radius+7 && distance>= puck.radius + paddle.radius-7);                          //RELATIVE VELOCITY
   

    if (check_collision){ 
    
        var theta=Math.atan2((puck.pos.y-paddle.pos.y),(puck.pos.x-paddle.pos.x));

        var alpha = theta - Math.atan2(puck.vy,puck.vx);

        puck.vx+=Math.abs(2*puck.v*Math.cos(alpha))*Math.cos(theta);
        puck.vy+=Math.abs(2*puck.v*Math.cos(alpha))*Math.sin(theta);
        puck.v=Math.sqrt(puck.vx*puck.vx+puck.vy*puck.vy);
        puck.vx=puck.vx*8/puck.v;
        puck.vy=puck.vy*8/puck.v;                                                   //ALTER PUCK SPEED HERE

        puck.v=Math.sqrt(puck.vx*puck.vx+puck.vy*puck.vy);

    }    
    return check_collision;
}

function check_goal(puck,goal){
    if(puck.pos.y>=goal.corner_pos.y && puck.pos.y<=goal.corner_pos.y+goal.b && Math.abs(puck.pos.x-(goal.corner_pos.x+goal.l/2))<=puck.radius){
        return true;
    }
}


var canvas = document.getElementById("canvas");

var ct = canvas.getContext("2d");

var background=canvas.style.backgroundImage ; 

var canvas_dim = new vector(canvas.width,canvas.height);

var paddle1,paddle2,left_goal,right_goal,pucks;

var your_color=localStorage.your_color;
var computer_color=localStorage.computer_color;


function game(){

window.removeEventListener("keydown",endgame);
initialise();
animate();
}


function initialise(){   
    pucks=[];                        //initialise all the game objects
    for (var i=0; i<no_of_pucks;i++){
        pucks.push(new sphere(canvas_dim.rescale(0.5,(i+1)/(no_of_pucks+1)),canvas_dim.y/36,"black"));
       
        var rand_theta = Math.random()*2*Math.PI;
        pucks[i].vx=pucks[i].v*Math.cos(rand_theta);
        pucks[i].vy=pucks[i].v*Math.sin(rand_theta);
        pucks[i].create();
    }

    /*var rand_theta = Math.random()*2*Math.PI;
    puck.vx=puck.v*Math.cos(rand_theta);
    puck.vy=puck.v*Math.sin(rand_theta);*/
    
    paddle1 = new sphere(canvas_dim.rescale(0.25,0.5),canvas_dim.y/18,your_color);
    paddle2 = new sphere(canvas_dim.rescale(0.80,0.5),canvas_dim.y/18,computer_color);
    left_goal = new rectangle(new vector(0,canvas_dim.y/3),canvas_dim.y/36,canvas_dim.y/3,"black");
    right_goal = new rectangle(new vector(canvas_dim.x-canvas_dim.y/36,canvas_dim.y/3),canvas_dim.y/36,canvas_dim.y/3,"black");
   
    //puck.create();
    paddle1.create();
    paddle2.create();
    left_goal.create();
    right_goal.create();
    
}


function animate(){     //animation loop
    var goalScored_left=false;
    var goalScored_right=false;
    for (var i=0;i<no_of_pucks;i++){
        if (check_goal(pucks[i],left_goal)){
            goalScored_left=true;
            
            
        }
        if (check_goal(pucks[i],right_goal)){
            goalScored_right=true;
        }
    }
    if (!(goalScored_left || goalScored_right))   //when goal isn't scored

    {   
        window.removeEventListener("keydown",continue_game);
        requestAnimationFrame(animate);
        onmousemove=function(event){
            mouse.x=event.clientX;
            mouse.y=event.clientY;
        }
        ct.clearRect(0 ,0 ,canvas_dim.x, canvas_dim.y);
        
      
        left_goal.create();
        right_goal.create();
        
        for (var i=0;i<no_of_pucks;i++){
            collision(paddle1,pucks[i]);
            collision(paddle2,pucks[i]);
            pucks[i].update();
        }
        //check_goal(puck,left_goal);
        //check_goal(puck,right_goal);
        
            
        paddle1.update_paddle_1();
        
        paddle2.update_paddle_computer(pucks);
    }  

    else{                                           //when goal is scored
        if(goalScored_left) score.right+=1;
        else if(goalScored_right) score.left+=1;
        if (background=='url("space.jpg")'){
            ct.fillStyle="white";
            ct.shadowColor="#ec38ce"
        }
        else {
            ct.fillStyle="black" ;
            ct.shadowColor="grey";
        
        }   
        ct.textAlign="center";
        ct.font="40px Comic Sans MS"
        ct.shadowBlur=blur;
        ct.shadowOffsetX=2;
        ct.shadowOffsetY=2;

        if (score.left<max_score && score.right<max_score){     //continue
            console.log('if');
            ct.fillText("Press Enter to continue",canvas_dim.x/2,canvas_dim.y*0.6);
            ct.fillText(score.left+" : "+score.right,canvas_dim.x/2-15,canvas_dim.y*0.5);
            ct.fillText("User : Computer",canvas_dim.x/2+30,canvas_dim.y*0.4);
        
            window.addEventListener("keydown",continue_game);
            ct.shadowOffsetX=0;
            ct.shadowOffsetY=0;
        }
        else{  
            console.log('else');                                  //game over
            if (score.left==max_score){
                ct.fillText("User : Computer",canvas_dim.x/2+30,canvas_dim.y*0.3);
                ct.fillText(score.left+" : "+score.right,canvas_dim.x/2-15,canvas_dim.y*0.4);
                ct.fillText("Congrats!!! You have WON !",canvas_dim.x/2,canvas_dim.y*0.5);
                ct.fillText("Press enter to play again",canvas_dim.x/2,canvas_dim.y*0.6);
                ct.fillText("Press Backspace to return to menu",canvas_dim.x/2,canvas_dim.y*0.7);
            }

            else if(score.right==max_score){
                ct.fillText("User : Computer",canvas_dim.x/2+30,canvas_dim.y*0.3);
                ct.fillText(score.left+" : "+score.right,canvas_dim.x/2-15,canvas_dim.y*0.4);
                ct.fillText("Better luck next time!",canvas_dim.x/2,canvas_dim.y*0.5);
                ct.fillText("Press enter to play again",canvas_dim.x/2,canvas_dim.y*0.6);
                ct.fillText("Press Backspace to return to menu",canvas_dim.x/2,canvas_dim.y*0.7);
            }

            window.addEventListener("keydown",endgame);
            ct.shadowOffsetX=0;
            ct.shadowOffsetY=0;

        }
        
    }   
}

function continue_game(){ //Called once goal is scored
    if (window.event.key=="Enter"){
        initialise();
        animate();
    }
}

function endgame(){     //called when max goals are reached
                        //asks the user whether to exit or start new game
    
    score.left=0;
    score.right=0;
    if (window.event.key=="Enter")
        game();
    if (window.event.key=="Backspace") {
        window.location.assign("https://shaq-uille-oatmeal.github.io/AirHockey/");
    }
    
}


game();  //first call
