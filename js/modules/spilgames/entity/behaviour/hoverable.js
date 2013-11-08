glue.module.create(['glue'], function (Glue) {
	return function (obj) {
		var isHovering = false,
			onPointerMove = function (evt) {
				var pointerPosition = {
					x: evt.gameX,
					y: evt.gameY
				};
				if (pointerPosition.x >= obj.pos.x && 
				   pointerPosition.x <= (obj.pos.x + obj.width) &&
				   pointerPosition.y >= obj.pos.y && 
				   pointerPosition.y <= (obj.pos.y + obj.height)){
					isHovering = true;
				} else {
					isHovering = false;
				}
			};

		Glue.event.on(
	        Glue.input.POINTER_MOVE,
	        onPointerMove
	    );
	    return obj.mix({
	    	isHovering: function () {
	    		return isHovering;
	    	}
	    });
	};
});
