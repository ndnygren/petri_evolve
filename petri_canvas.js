
// Class to act as a wrapper for the HTML5 canvas
// abstracts scaling and graph drawing details
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
	this.vert_offs = 0.0;
	this.last_cursors = [];
	this.colors = {};

	// blanks-out canvas (white)
	this.reset = function() {
		this.last_cursors = [];
		this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	// for each table in a list of tables, draws each curve if its color is defined.
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

	// finds an appropriate scale for the diagram,
	// depending on the size of the input
	this.setSizeBasedOnDataSet = function(list, idx, count) {
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
		this.resetScale(count);
		this.vert_offs = -this.height*idx/count;
		this.drawAxis();
	}

	// remembers the last position of a curve in a diagram
	this.addCursor = function(state, level, color) {
		this.last_cursors.push({"state":state, "level":level, "color":color, "time":0});
	}

	// draws one "step" for a single curve
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

	// a circle to indicate the optimization criteria
	this.drawTarget = function(time, quant, color) {
		var c = "blue";
		if (this.colors[color]) { c = this.colors[color]; }
		this.drawCircle(this.scaleX(time), this.scaleY(quant), 3, c);
	}

	// direct canvas interaction, creates a circle
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

	// direct canvas interaction, creates a line
	this.drawLine = function(x1,y1,x2,y2,color,width) {
		var context = this.canvas.getContext('2d');

		context.strokeStyle = color;
		context.lineWidth = width;
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y2);
		context.stroke();
	}

	// fixes the scale for multiple diagrams on a single canvas
	this.resetScale = function(count) {
		this.scaleh = this.width/(this.data_x_high - this.data_x_low);
		this.scalev = ((this.height + 2 * this.border)/count
			- 2*this.border)
			/(this.data_y_high - this.data_y_low);
	}

	// stretches and translates a single point horizontally
	this.scaleX = function(x) {
		return (x - this.data_x_low)*this.scaleh + this.border;
	}

	// stretches and translates a single point vertically
	this.scaleY = function(y) {
		return this.height - (y - this.data_y_low)*this.scalev + this.border + this.vert_offs;
	}

	// draws 2 black lines, the x and y axis of the graph
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

	// draws entire graph set from a list of tables
	this.loadTable = function(table, color_obj, crit_obj){
		if (table.length != crit_obj.length) {
			throw("Table("+table.length+") to Criteria("+crit_obj.length+") mismatch.");
		}
		this.reset();

		for (var j in table) {
			this.last_cursors = [];
			this.setSizeBasedOnDataSet(table[j], j, table.length);
			this.drawCurves(table[j], color_obj);
			if (!crit_obj[j]) {continue;}
			for (var x in crit_obj[j].criteria) {
				var t = crit_obj[j].criteria[x];
				this.drawTarget(t.time, t.quant, t.state);
			}
		}
	}

	this.resetScale(1);
}

