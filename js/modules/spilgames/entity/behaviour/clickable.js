glue.module.create(['glue'], function (Glue) {
	return function (obj) {
		var firstPress = false,
			isPressed = false;

		Glue.event.on(
	        Glue.input.POINTER_DOWN,
	        function () {
	        	isPressed = true;
	        	if(obj.isHovering() && !firstPress){
	        		firstPress === true;
	        		console.log(obj.name, 'clicked');
	        	}
	        }
	    );
	    Glue.event.on(
	        Glue.input.POINTER_UP,
	        function () {
	        	isPressed = false;
	        	firstPress = false;
	        }
	    );

	    return obj.mix({
	    	isPressed: function () {
	    		return isPressed;
	    	}
	    });
	};
});
