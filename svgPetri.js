

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
	this.tsize = {w: 200, h: 200};

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

	this.make = function(xy, commands)
	{
		var output = "";
		this.mm = new minmax();
		this.mm.addArray(xy);
		this.tsize.w = this.mm.findW(this.tsize.h);
		this.mm.border = this.mm.mult()/2.0;
		this.radius = 10;

		output += this.svgtop(this.tsize.w, this.tsize.h);
		output += this.makeObjs(xy);
		output += this.makeText(xy);

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

