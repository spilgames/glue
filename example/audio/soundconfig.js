/*global define, RSVP*/
/**
 * Soundset generated using `audiosprite -p mp3,ogg,ac3 -o sounds -e mp3,ogg,ac3 -c 2 *.ogg`
 */
require(["glue"], function(glue) {
    
    var sounds = [],
        l1 = document.getElementById("l1"),
        l2 = document.getElementById("l2");
    
    window.audio51 = glue.audio;

    //audio51.getContext( audio51.RESTRICTED );
    audio51.loadSoundSet('sounds.json');
    
    function stop(event) {
        while (sounds.length) {
            sounds.pop().stop();
        }
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    function start(event) {
        sounds.push(audio51.play("thunder"));
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    function addListeners(type) {
        l1.addEventListener(type, start);
        l2.addEventListener(type, stop);
    }
    
    function addTouch() {
        addListeners("touchstart");
        document.documentElement.removeEventListener("touchstart", addTouch);
    }
    
    function addClick() {
        addListeners("click");
        document.documentElement.removeEventListener("click", addClick);
    }

    document.getElementById("a1").addEventListener("click", function(event){
        document.getElementById("playnow").className += " hide";
        event.preventDefault();
        event.stopPropagation();
        return false;
    });


    document.documentElement.addEventListener("click", addClick);
    document.documentElement.addEventListener("touchstart", addTouch);

});
