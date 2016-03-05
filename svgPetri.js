

function minmax()
{
	this.min_x = 0.0;
	this.max_x = 0.0;
	this.min_y = 0.0;
	this.max_y = 0.0;
	this.border = 20.0;
	this.h = 10.0;


	this.add = function(input)
	{
		if (input.x < this.min_x) { this.min_x = input.x; }
		if (input.x > this.max_x) { this.max_x = input.x; }
		if (input.y < this.min_y) { this.min_y = input.y; }
		if (input.y > this.max_y) { this.max_y = input.y; }
	}

	this.addArray = function(xy)
	{
		for (var idx in xy) { this.add(xy[idx]); }
	}

	this.findW = function(h)
	{
		this.h=h;
		return (h - 2*this.border)*(this.max_x - this.min_x)/(this.max_y - this.min_y) + 2*this.border;
	}

	this.mult = function()
	{
		return 30;
	}

	this.xoffs = function()
	{
		return this.border - this.min_x*this.mult();
	}

	this.yoffs = function()
	{
		return this.border - this.min_y*this.mult();
	}
}

function makecircle(loc, mult, xoffs, yoffs)
{
	return "<circle cx=\"" + (loc.x*mult + xoffs)
	+ "\" cy=\"" + (loc.y*mult + yoffs) + "\" "
	+ "r=\"4\" stroke=\"brown\" stroke-width=\"1\" fill=\"yellow\" />";
}

function svgtop(w, h)
{
	var svghead = " xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" ";
	return "<svg width=\"" + w
		+ "\" height=\"" + h + "\""
		+ svghead + ">\n";
}


function petriSVGfact()
{
	this.radius = 10.0;
	this.tsize = {w: 200, h: 300};

	this.svgtop = function(w, h)
	{
		var svghead = " xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" ";
		return "<svg width=\"" + w + "\" height=\"" + h + "\"" + svghead + ">\n";
	}

	this.makeTrans = function(loc, mult, xoffs, yoffs)
	{
		return "<rect x=\"" + (loc.x*mult + xoffs -this.radius)
			+ "\" y=\"" + (loc.y*mult + yoffs -this.radius) + "\" "
			+ "width=\"" + this.radius*2.0 + "\" "
			+ "height=\"" + this.radius*2.0 + "\" "
			+"stroke=\"gray\" stroke-width=\"1\" fill=\"CornflowerBlue\" />";
	}

	this.makeState = function(loc, mult, xoffs, yoffs)
	{
		return "<circle cx=\"" + (loc.x*mult + xoffs)
			+ "\" cy=\"" + (loc.y*mult + yoffs) + "\" "
			+ "r=\"" + this.radius + "\" stroke=\"brown\" stroke-width=\"1\" fill=\"yellow\" />";
	}

	this.makeObjs = function(xy)
	{
		var output = "";
		for (var idx in xy)
		{
			output += xy[idx].type == "state"
				? this.makeState(xy[idx], this.mm.mult(), this.mm.xoffs(), this.mm.yoffs())
				: this.makeTrans(xy[idx], this.mm.mult(), this.mm.xoffs(), this.mm.yoffs());
		}

		return output;
	}

	this.label = function(node, mult, xoffs, yoffs)
	{
		return "<text x=\"" + (node.x*mult + xoffs)
			+ "\" y=\"" + (node.y * mult + yoffs)
			+ "\" font-size=\"" + this.radius/1.50 + "\" "
			+ " dominant-baseline=\"middle\" "
			+ " font-family=\"verdana\" "
			+ " text-anchor=\"middle\" >"
			+ node.display + "</text>\n";
	}

	this.makeText = function(xy)
	{
		var output = "";
		for (var idx in xy)
		{
			output += this.label(xy[idx], this.mm.mult(), this.mm.xoffs(), this.mm.yoffs());
		}
		return output;
	}

	this.locAdd = function(loc1, loc2) { return { x: loc1.x + loc2.x, y: loc1.y + loc2.y }; }
	this.locScale = function(loc, k) { return { x: k*loc.x, y:k*loc.y }; }
	this.locDist = function(loc) { return Math.sqrt(loc.x*loc.x + loc.y*loc.y); }
	this.locRot = function(loc, angle)
	{
		return {x: loc.x*Math.cos(angle) - loc.y*Math.sin(angle),
		y: loc.x*Math.sin(angle) + loc.y*Math.cos(angle) };
	}
	this.lineAt = function(loc1, loc2)
	{
		return "<line x1=\"" + loc1.x + "\" "
			+ " y1=\"" + loc1.y + "\" "
			+ " x2=\"" + loc2.x + "\" "
			+ " y2=\"" + loc2.y + "\" "
			+ " style=\"stroke-opacity:0.7;stroke:rgb(0,0,0);stroke-width:1\" />";
	}
	this.triangle = function(p1, p2, p3)
	{
	}
	this.curveAt = function(loc1, loc2)
	{
		var diff = this.locAdd(loc2, this.locScale(loc1, -1.0));
		var half = this.locScale(this.locAdd(loc2, loc1), 0.5);
		var len = this.locDist(diff);
		var dir = this.locScale(diff, 1/len);
		var centerpoint =  this.locAdd(half, this.locScale({x: dir.y, y: -dir.x }, len/4.0));

		return "<path d=\"M" + Math.round(loc1.x) + "," + Math.round(loc1.y) + " "
			+ "S" + Math.round(centerpoint.x) + "," + Math.round(centerpoint.y) + " "
			+ " " + Math.round(loc2.x) + "," + Math.round(loc2.y) + "\" "
			+ " style=\"stroke-opacity:0.7;stroke:rgb(0,0,0);stroke-width:1\" "
			+ " fill=\"none\" />";
	}
	this.radialLine = function(start, angle, len)
	{
		return this.locAdd(start, this.locScale( this.locRot({x:1.0, y:0.0}, angle), len));
	}
	this.angleFromDir = function(dir)
	{
		var dist = this.locDist(dir);
		return (dir.y == 0 ? 0 : Math.atan(dir.y/dir.x))
			+ ( dir.x < 0 ? 0 : Math.PI);
	}

	this.singleArrow = function(loc1, loc2, iter)
	{
		var diff = this.locAdd(loc2, this.locScale(loc1, -1.0));
		var len = this.locDist(diff);
		var dir = this.locScale(diff, 1/len);
		var start = this.locAdd(this.locScale(dir, this.radius), loc1);
		var end = this.locAdd(this.locScale(dir, len - this.radius), loc1);
		var angle = this.angleFromDir(dir);
		var output = "";
		var inc = this.locScale({x: dir.y, y: -dir.x}, 4.0);

		for (var i = 0; i < iter; i++)
		{
			output += this.curveAt(start, end)
				+ this.lineAt(end, this.radialLine(end, angle + Math.PI/3, this.radius/6.0))
				+ this.lineAt(end, this.radialLine(end, angle - Math.PI/9, this.radius/6.0));
			start = this.locAdd(start, inc);
			end = this.locAdd(end, inc)
		}

		return output;
	}

	this.makeRevLook = function(xy)
	{
		var output = {};
		for (var i in xy)
		{
			output[xy[i].type + "_" + xy[i].display] = i;
		}
		return output;
	}

	this.makeArrows = function(xy, commands)
	{
		var output = "";
		var lookup = this.makeRevLook(xy);
		var state, trans;
		var sloc, tloc;

		for (var i in commands.i)
		{
			state = xy[lookup["state_"+commands.i[i][0]]];
			trans = xy[lookup["trans_"+commands.i[i][1]]];
			sloc = this.locAdd(this.locScale(state, this.mm.mult()),{ x: this.mm.xoffs(), y: this.mm.yoffs() });
			tloc = this.locAdd(this.locScale(trans, this.mm.mult()),{ x: this.mm.xoffs(), y: this.mm.yoffs() });

			output += this.singleArrow(sloc, tloc, commands.i[i][2]);
		}

		for (var i in commands.o)
		{
			state = xy[lookup["state_"+commands.o[i][0]]];
			trans = xy[lookup["trans_"+commands.o[i][1]]];
			sloc = this.locAdd(this.locScale(state, this.mm.mult()),{ x: this.mm.xoffs(), y: this.mm.yoffs() });
			tloc = this.locAdd(this.locScale(trans, this.mm.mult()),{ x: this.mm.xoffs(), y: this.mm.yoffs() });

			output += this.singleArrow(tloc, sloc, commands.o[i][2]);
		}

		return output;
	}

	this.make = function(xy, commands)
	{
		var output = "";
		this.mm = new minmax();
		this.mm.addArray(xy);
		this.mm.border = this.tsize.h/10.0;
		this.tsize.w = this.mm.findW(this.tsize.h);
		this.radius = 10;
		alert(this.mm.mult() + "," + this.mm.xoffs());
		output += this.svgtop(this.tsize.w, this.tsize.h);
		output += this.makeObjs(xy);
		output += this.makeText(xy);
		output += this.makeArrows(xy, commands);

		return output + "</svg>\n";
	}
}

function makeSVGsimple(xy)
{
	var tsize = {w: 100, h: 100};
	var output = "";
	var mm = new minmax();
	var mult;
	mm.addArray(xy);
	tsize.w = mm.findW(tsize.h);
	mult = mm.mult();
	var xoffs = mm.xoffs();
	var yoffs = mm.yoffs();
	output += svgtop(tsize.w, tsize.h);

	for (var idx in xy)
	{
		output += makecircle(xy[idx], mult, xoffs, yoffs);
	}

	return output + "</svg>\n";
}

