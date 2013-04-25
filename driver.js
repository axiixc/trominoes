function getCardnialQuadrants() {
	return { 'TL':'TL', 'TR':'TR', 'BR':'BR', 'BL':'BL' };
}

/**
 * Draws a 2-dimensional array onto a canvas element. The value
 * of each element of the array determine the color of the square.
 */
function BoardPainter(canvas) {
	this.canvas = canvas;
	this.lineWidth = 1;
				
	this.board = [];
	this.colors = { 0: 'rgb(30,30,30)' };
	
	this.options = { paintGrid: true }
	
	this.paintBoard = function() {
		this._paintSquares();
	};
	
	var qComp = function(color, d) {
		for (var k in d)
			if (d[k] == color) return true;
		return false;
	};
	
	this._randomColor = function() {
		var color = null;
		
		// do {
			var red = Math.floor(Math.random() * 200) + 30;
			var blue = Math.floor(Math.random() * 200) + 30;
			var green = Math.floor(Math.random() * 200) + 30;
			color = 'rgb(' + red + ',' + green + ',' + blue + ')';
		// } while (qComp(color, this.colors));
		
		return color;
	}
	
	this._nColorInc = 40;
	this._nColor = [ this._nColorInc, 0, 0 ];
	this._nextColor = function() {
		var color = "rgb(" + this._nColor[0] + "," + this._nColor[1] + "," + this._nColor[2] + ")";
		
		this._nColor[1] += this._nColorInc;
		if (this._nColor[1] > 255) {
			this._nColor[1] = this._nColorInc;
			this._nColor[0] += this._nColorInc;
			if (this._nColor[0] > 255) {
				this._nColor[0] = this._nColorInc;
				this._nColor[2] += this._nColorInc;
				if (this._nColor[2] > 255) {
					this._nColor[2] = this._nColorInc;
				}
			}
		}
		
		return color;
	}
	
	this._nrci = 0;
	this._nrcf = 0.3;
	this._nrc = function() {
		red   = Math.floor(Math.sin(this._nrcf * this._nrci + 0) * 127 + 128);
		green = Math.floor(Math.sin(this._nrcf * this._nrci + 2) * 127 + 128);
		blue  = Math.floor(Math.sin(this._nrcf * this._nrci + 4) * 127 + 128);
		this._nrci++;
		
		var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
		return color;
	}
	
	this._rcff = 0.2;
	this._rcfi = function(i) {
		red   = Math.floor(Math.sin(this._rcff * i + 0) * 127 + 128);
		green = Math.floor(Math.sin(this._rcff * i + 2) * 127 + 128);
		blue  = Math.floor(Math.sin(this._rcff * i + 4) * 127 + 128);
		
		var color = 'rgb(' + red + ',' + green + ',' + blue + ')';
		return color;
	}
	
	this._paintSquares = function() {
		var squareStep = Math.floor((this.canvas.width - this.lineWidth) / this.board.length);
		// var squareStep = (this.canvas.width - this.lineWidth) / this.board.length;
		var usableSize = squareStep * this.board.length + 0.5;
		
		var context = this.canvas.getContext('2d');
		context.strokeStyle = 'rgb(0, 0, 0)';
		context.lineWidth = this.lineWidth;
		
		for (var x = 0; x < this.board.length; x++) {
			var px = x * squareStep;
			for (var y = 0; y < this.board[x].length; y++) {
				var py = y * squareStep;
				
				if (!this.colors[this.board[x][y]])
					this.colors[this.board[x][y]] = this._rcfi(this.board[x][y]);
				context.fillStyle = this.colors[this.board[x][y]];
				
				context.fillRect(px, py, squareStep, squareStep);
			}
		}
		
		for (var offset = 0.5; this.options.paintGrid && offset <= usableSize; offset += squareStep) {
			context.beginPath();
			context.moveTo(offset, 0);
			context.lineTo(offset, usableSize);
			context.moveTo(0, offset);
			context.lineTo(usableSize, offset);
			context.stroke();
		}
	};
}

/**
 * Stores a point, and provides equality comparison.
 */
function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;
	
	this.equals = function(o) {
		if (!(o instanceof Point)) return false;
		return (this.x == o.x && this.y == o.y);
	};
	
	this.toString = function() {
		return "Point(" + this.x + ", " + this.y + ")";
	}
}

/**
 * Abstraction of the "board" providing facilities for translation,
 * rotation, slices, clones, and tile placement all while interacting
 * with a single instance of the board's data.
 *
 * Can be constructed with either as a master with a number 
 * indicating board size or as a clone with another BoardModel.
 */
function BoardModel(i) {
	if (typeof i === 'number') {
		this.size = i;
		this.data = new Array(this.size);
		for (var i = 0; i < this.size; i++) {
			this.data[i] = new Array(this.size);
			for (var j = 0; j < this.size; j++)
				this.data[i][j] = 0;
		}
		this.translation = new Point(0, 0);
		this.rotation = 0;
		this.parent = null;
		this.uid = 100;
	}
	else if (i instanceof BoardModel) {
		this.size = i.size;
		this.data = i.data;
		this.translation = i.translation;
		this.rotation = i.rotation;
		this.parent = i.parent || i;
	}
	else {
		console.log("Bad initialization with element " + i + " of type " + (typeof i));
		return null;
	}
	
	/**
	 * This provides a non-random number, gaurenteed to be unique
	 * per master board.
	 */
	this.getUID = function() {
		if (this.parent)
			return this.parent.getUID();
		
		return (this.uid++);
	}
	
	/**
	 * Returns a quadrant of the board rotated into L position. Due to the order
	 * I wrote the algorithms in the name is slightly misleading as it does
	 * more than just return a slice of the board.
	 */
	this.quadrant = function(q) {
		var clone = new BoardModel(this);
		clone.size = this.size / 2;
		clone.rotation = (this.rotation + this.quadrantOrder(q)) % 4;
		switch (this.normalizeQuadrant(q)) {
			case 'TL':
				clone.translation = this.translation;
				break;
			case 'TR':
				clone.translation = new Point(this.translation.x + clone.size, 
											  this.translation.y);
				break;
			case 'BL':
				clone.translation = new Point(this.translation.x,
											  this.translation.y + clone.size);
				break;
			case 'BR':
				clone.translation = new Point(this.translation.x + clone.size,
											  this.translation.y + clone.size);
				break;
			case 'C':
				clone.translation = new Point(this.translation.x + clone.size / 2,
											  this.translation.y + clone.size / 2);
				break;
		}
		
		return clone;
	};
	
	/**
	 * Returns an unrotated quadrant.
	 */
	this.uQuadrant = function(q) {
		var mq = this.quadrant(q);
		mq.rotation = 0;
		return mq;
	};
	
	// @private
	this.quadrantOrder = function(q) {
		switch (q) {
			case 'TL': return 3;
			case 'TR': return 2;
			case 'BR': return 1;
			default: return 0;
		}
	};
	
	/**
	 * Unrotates a quadrant identifier from the clone's space into the
	 * master's space.
	 */
	this.normalizeQuadrant = function(q) {
		if (q == 'C' || this.rotation === 0) return q;
		
		if (this.rotation == 1) {
			return { 'TR':'TL', 'BR':'TR', 'BL':'BR', 'TL':'BL' }[q];
		}
		
		if (this.rotation == 2) {
			return { 'TR':'BL', 'BR':'TL', 'BL':'TR', 'TL':'BR' }[q];
		}
		
		if (this.rotation == 3) {
			return { 'TR':'BR', 'BR':'BL', 'BL':'TL', 'TL':'TR' }[q];
		}
		
		return q
	}
	
	/**
	 * Rotates a quadrant identifier from the master space into the clone's
	 * space.
	 */
	this.denormalizeQuadrant = function(q) {
		if (q == 'C' || this.rotation === 0) return q;
		
		if (this.rotation == 1) {
			return { 'TL':'TR', 'TR':'BR', 'BR':'BL', 'BL':'TL' }[q];
		}
		
		if (this.rotation == 2) {
			return { 'BL':'TR', 'TL':'BR', 'TR':'BL', 'BR':'TL' }[q];
		}
		
		if (this.rotation == 3) {
			return { 'BR':'TR', 'BL':'BR', 'TL':'BL', 'TR':'TL' }[q];
		}
		
		return q
	}
	
	/**
	 * Returns a new clone of the current board rotated with the given
	 * quadrant in the top-right position.
	 */
	this.rotationTo = function(q) {
		var clone = new BoardModel(this);
		clone.rotation = (this.rotation + this.quadrantOrder(q) + 2) % 4;
		return clone;
	};
	
	// @private
	this.rotationPosition = function(r) {
		switch (r) {
			case 0: return new Point(1, 0);
			case 1: return new Point(0, 0);
			case 2: return new Point(0, 1);
			case 3: return new Point(1, 1);
		}
	}
	
	/**
	 * Returns a point rotated by the specified ammount.
	 *
	 * @unused
	 */
	this._rotatePoint = function(p, r) {
		var cos = [1, 0, -1, 0][r];
		var sin = [0, -1, 0, 1][r];
		var shift = this.size / 2 - 0.5;
		
		var rp = new Point(p.x - shift, p.y - shift);
		rp.x = cos * rp.x - sin * rp.y;
		rp.y = sin * rp.x - cos * rp.y;
		
		return new Point(rp.x + shift, rp.y + shift);
	};
	
	/**
	 * Give a quadrant in the master space, returns the cardinal quadrant
	 * of the clone containing it. This function DOES NOT account for
	 * rotation. Use denormalizeQuadrant() if needed.
	 */
	this.quadrantContaining = function(p) {
		var th = new Point();
		th.x = this.translation.x + this.size / 2;
		th.y = this.translation.y + this.size / 2;
		
		if (p.x < th.x && p.y < th.y) return 'TL';
		if (p.x < th.x && p.y >= th.y) return 'BL';
		if (p.x >= th.x && p.y < th.y) return 'TR';
		return 'BR';
	};
	
	/**
	 * Places a tile in the center of the current clone, oriented such
	 * that it avoids the supplied quadrant. Returns a hash of the points
	 * placed and their quadrant identifier.
	 */
	this.place = function(avoid) {
		avoid = this.normalizeQuadrant(avoid || 'TR');
		
		var cardinalQuadrants = getCardnialQuadrants();
		
		var uid = this.getUID();
		for (var qid in cardinalQuadrants) {
			if (qid == avoid) {
				delete cardinalQuadrants[qid];
				continue;
			}
			
			var p = cardinalQuadrants[qid] = this.interiorPoint(qid);
			this.data[p.x][p.y] = uid;
		}
		
		return cardinalQuadrants;
	}
	
	/**
	 * Returns a point in the coordinates of the master space of the
	 * point most internal for the current clone.
	 */
	this.interiorPoint = function(q) {
		var p = new Point(this.translation.x, this.translation.y);
		var shift = this.size / 2;
		
		switch (q) {
			case 'TL':
				p.x += shift - 1;
				p.y += shift - 1;
				break;
				
			case 'TR':
				p.x += shift;
				p.y += shift - 1;
				break;
				
			case 'BL':
				p.x += shift - 1;
				p.y += shift;
				break;
			
			case 'BR':
				p.x += shift;
				p.y += shift;
				break;
		}
		
		return p;
	};
}

/**
 * Solves a board by checking for the quadrant containing the missing
 * point, placeing a tile into the interor points of thethree other
 * quadrants, then recursing into all four.
 */
function NormalAlgorithm(size) {
	this.model = new BoardModel(size);
	
	this.solve = function() {
		this._solve(this.model, this.missingPoint);
	};
	
	this._solve = function(model, missingPoint) {
		var q = model.quadrantContaining(missingPoint);
		var qds = model.place(q);
		this.stepCallback(model.data);
		
		if (model.size == 2) return;
		
		this._solve(model.uQuadrant(q), missingPoint);
		
		for (var qid in qds) {
			this._solve(model.uQuadrant(qid), qds[qid]);
		}
	};
}

/**
 * Solves a board by placeing tiling a L around the quadrant containing
 * the missing square, then calling rotating and solving the last
 * quadrant as a smaller sub-problem.
 */
function LShapeAlgorithm(size) {
	this.model = new BoardModel(size);
	
	this.solve = function() {
		this._solve(this.model);
	}
	
	this._solve = function(model) {
		var q = model.quadrantContaining(this.missingPoint);
		q = model.denormalizeQuadrant(q);
		
		if (model.size == 2) {
			model.place(q);
			this.stepCallback(model.data);
			return;
		}
		
		this._solve(model.quadrant(q));
		this._solveL(model.rotationTo(q));
	};
	
	this._solveL = function(model) {
		if (model.size == 2) {
			model.place();
			this.stepCallback(model.data);
			return;
		}
		
		this._solveL(model.quadrant('TL'));
		this._solveL(model.quadrant('BR'));
		this._solveL(model.quadrant('C'));
		this._solveL(model.quadrant('BL'));
	};
}

/**
 * Manages communication between the algorithm and board painter.
 *
 * Initialization options:
 * size         : power of 2 to use for board size
 * algorithm    : string identifying algorithm type ('normal', 'lshape')
 * canvas       : Reference to a canvas element to be used for drawing.
 * paintGrid    : Draw grid lines on the canvas.
 * colorCycle   : Ammount to shift hue by, lower means more colors.
 * delay        : Number of seconds to delay each step of the animation.
 * missingPoint : Point object specifying the missing point.
 */
function SolutionController(options) {
	var size = Math.pow(2, options.size);
	
	this.valid = true;
	if (options.missingPoint.x >= size || options.missingPoint.y >= size ||
		options.missingPoint.x < 0 || options.missingPoint.y < 0) {
		alert(options.missingPoint + " is not in the board's coordinates!");
		this.valid = false;
	}
	
	this.algorithm = (options.algorithm == 'normal') ? new NormalAlgorithm(size) : new LShapeAlgorithm(size);
	this.boardView = new BoardPainter(options.canvas);
	this.boardView.options.paintGrid = options.paintGrid;
	this.boardView._rcff = options.colorCycle;
	this.delay = options.delay * 1000;
	
	this.drawStep = 0;
	
	var _ = this;
	this.algorithm.missingPoint = options.missingPoint;
	this.algorithm.stepCallback = function(board, cc) {
		if (_.delay === 0 || !_.boardView) {
			return;
		}
		
		var boardCopy = $.extend(true, [], board);
		setTimeout(function() {
			_.boardView.board = boardCopy;
			_.boardView.paintBoard();	
		}, (_.drawStep++) * _.delay);
	};
	
	this.solve = function() {
		this.algorithm.solve();
		if (this.delay === 0) {
			this.boardView.board = this.algorithm.model.data;
			this.boardView.paintBoard();
		}
	};
	
	this.invalidate = function() {
		this.boardView = null;
	}
}