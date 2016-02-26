

function canvasWriter(canvas) {
	this.canvas = canvas;
	this.border = 10.0;
	this.width = canvas.width - 2*this.border;
	this.height = canvas.height - 2*this.border;
	this.data_x_low = -1.0;
	this.data_y_low = -1.0;
	this.data_x_high = 15.0;
	this.data_y_high = 15.0;
	this.data_scale = 10.0;

	this.drawLine = function(x1,y1,x2,y2,color,width) {
		var context = this.canvas.getContext('2d');

		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}

	this.resetScale = function() {
		this.scale = Math.min(this.width/(this.data_x_high - this.data_x_low), this.height/(this.data_y_high - this.data_y_low));
	}

	this.scaleX = function(x) {
		return (x - this.data_x_low)*this.scale + this.border;
	}

	this.scaleY = function(y) {
		return (y - this.data_y_low)*this.scale + this.border;
	}

	this.drawAxis = function() {
		this.drawLine(this.scaleX(0.0),
				this.scaleY(this.data_y_low),
				this.scaleX(0.0),
				this.scaleY(this.data_y_high),
				"black", 1.0);
		this.drawLine(this.scaleX(this.data_x_low),
				this.scaleY(0.0),
				this.scaleX(this.data_x_high),
				this.scaleY(0.0),
				"black", 1.0);
	}

	this.resetScale();
}

