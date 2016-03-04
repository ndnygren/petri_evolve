

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
	this.last_cursors = [];
	this.colors = {};

	this.reset = function() {
		this.last_cursors = [];
		this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	this.drawCurves = function (table, colors) {
		this.colors = colors;
		for (color in colors){
			this.addCursor(color, table[0][color] || 0, colors[color]);
		}
		for (x in table) {
			for (color in colors){
				this.drawFromCursor(color, table[x][color] || 0);
			}
		}
	}

	this.setSizeBasedOnDataSet = function(list) {
		this.data_y_low = -1;
		this.data_y_high = 1;
		this.data_x_high = Math.max(20, list.length);
		if (!list || list.length < 1) { throw("bad data set"); }
		for (key in list[0]) {
			col = list.map(function(x) { return x[key]; });
			this.data_y_low = Math.min(this.data_y_low,
					Math.min.apply(null, col));
			this.data_y_high = Math.max(this.data_y_high,
					Math.max.apply(null, col));
		}
		this.resetScale();
		this.reset();
		this.drawAxis();
	}

	this.addCursor = function(state, level, color) {
		this.last_cursors.push({"state":state, "level":level, "color":color, "time":0});
	}

	this.drawFromCursor = function(state, level) {
		for (var i = 0; i < this.last_cursors.length; i++) {
			var last = this.last_cursors[i];
			if (last.state == state) {
				this.drawLine(this.scaleX(last.time),
					this.scaleY(last.level),
					this.scaleX(last.time+1),
					this.scaleY(level),
					last.color, 2.0);
				last.time++;
				last.level = level;
			}
		}
	}

	this.drawTarget = function(time, quant, color) {
		var c = "blue";
		if (this.colors[color]) { c = this.colors[color]; }
		this.drawCircle(this.scaleX(time), this.scaleY(quant), 3, c);
	}

	this.drawCircle = function(x,y,r,color) {
		var context = this.canvas.getContext('2d');

		context.beginPath();
		context.arc(x, y, r, 0, 2 * Math.PI, false);
		context.fillStyle = color;
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = '#000000';
		context.stroke();
	}

	this.drawLine = function(x1,y1,x2,y2,color,width) {
		var context = this.canvas.getContext('2d');

		context.strokeStyle = color;
		context.lineWidth = width;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}

	this.resetScale = function() {
		this.scaleh = this.width/(this.data_x_high - this.data_x_low);
		this.scalev = this.height/(this.data_y_high - this.data_y_low);
	}

	this.scaleX = function(x) {
		return (x - this.data_x_low)*this.scaleh + this.border;
	}

	this.scaleY = function(y) {
		return this.height - (y - this.data_y_low)*this.scalev + this.border;
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

	this.loadTable = function(table, color_obj, crit_obj){
		this.setSizeBasedOnDataSet(table);
		this.drawCurves(table, color_obj);
		for (var x in crit_obj[0].criteria) {
			var t = crit_obj[0].criteria[x];
			this.drawTarget(t.time, t.quant, t.state);
		}
	}

	this.resetScale();
}

