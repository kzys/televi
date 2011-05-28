Flip = new Object();

Flip.showBack = function()
{
    Flip.exitflip();
    
    var front = document.getElementById("front");
    var back = document.getElementById("back");
        
    if (window.widget)
        widget.prepareForTransition("ToBack");
                
    front.style.display="none";
    back.style.display="block";
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);  
}

Flip.hideBack = function()
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");
        
    if (window.widget)
        widget.prepareForTransition("ToFront");
                
    back.style.display="none";
    front.style.display="block";
        
    if (window.widget)
        setTimeout ('widget.performTransition();', 0);
}

Flip.shown = false;
Flip.animation = {
    duration:0,
    starttime:0,
    to:1.0,
    now:0.0,
    from:0.0,
    firstElement:null,
    timer:null
};

Flip.mousemove = function(event)
{
    if (Flip.shown) {
        return;
    }
    
    if (Flip.animation.timer != null) {
        clearInterval(Flip.animation.timer);
        Flip.animation.timer  = null;
    }
                
    var starttime = (new Date).getTime() - 15;
    
    var animation = Flip.animation;
        
    animation.duration = 500;
    animation.starttime = starttime;
    animation.firstElement = document.getElementById("flip");
    animation.timer = setInterval("Flip.animate();", 15);
    animation.from = animation.now;
    animation.to = 1.0;

    Flip.animation = animation;
    
    Flip.animate();
    Flip.shown = true;
}

Flip.mouseexit = function(event)
{    
    if (! Flip.shown) {
        return;
    }

    var animation = Flip.animation;
    if (animation.timer != null) {
        clearInterval (animation.timer);
        animation.timer  = null;
    }
    
    var starttime = (new Date).getTime() - 13;
    
    animation.duration = 500;
    animation.starttime = starttime;
    animation.firstElement = document.getElementById ('flip');
    animation.timer = setInterval ("Flip.animate();", 13);
    animation.from = animation.now;
    animation.to = 0.0;
    
    Flip.animation = animation;
    
    Flip.animate();
    Flip.shown = false;
}
        
Flip.animate = function()
{
    var T;
    var ease;
    var time = (new Date).getTime();
    var animation = Flip.animation;
        
    T = Flip.limit3(time-animation.starttime, 0, animation.duration);
        
    if (T >= animation.duration) {
        clearInterval(animation.timer);
        animation.timer = null;
        animation.now = animation.to;
    } else {
        ease = 0.5 - (0.5 * Math.cos(Math.PI * T / animation.duration));
        animation.now = Flip.computeNextFloat (animation.from, animation.to, ease);
    }
    
    animation.firstElement.style.opacity = animation.now;

    Flip.animation = animation;
}

Flip.limit3 = function(a, b, c)
{
    return a < b ? b : (a > c ? c : a);
}

Flip.computeNextFloat = function(from, to, ease)
{
    return from + (to - from) * ease;
}

Flip.enterflip = function(event)
{
    document.getElementById('flipRollie').style.display = 'block';
}

Flip.exitflip = function(event)
{
    document.getElementById('flipRollie').style.display = 'none';
}