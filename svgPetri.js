
var svghead = " xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" ";

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
		return (this.h-2*this.border) / (this.max_y-this.min_y);
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

function makeSVGsimple(xy)
{
	var tsize = {w: 100, h: 100};
	var output = "";
	var pointlist = [];
	var mm = new minmax();
	var mult;
	mm.addArray(xy);
	tsize.w = mm.findW(tsize.h);
	mult = mm.mult();
	var xoffs = mm.xoffs();
	var yoffs = mm.yoffs();
	alert(mult);
	output += "<svg width=\"" + tsize.w 
		+ "\" height=\"" + tsize.h + "\""
		+ svghead + ">\n";
	for (var idx in xy)
	{
		output += makecircle(xy[idx], mult, xoffs, yoffs);
	}

	return output + "</svg>\n";
}

