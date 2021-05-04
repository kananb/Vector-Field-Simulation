Lexer.defunct = function (chr) {
	throw new Error("Unexpected character at index " + (this.index - 1) + ": " + chr);
};
try {
	Lexer.engineHasStickySupport = typeof /(?:)/.sticky == 'boolean';
} catch (ignored) {
	Lexer.engineHasStickySupport = false;
}
try {
	Lexer.engineHasUnicodeSupport = typeof /(?:)/.unicode == 'boolean';
} catch (ignored) {
	Lexer.engineHasUnicodeSupport = false;
}

function Lexer(defunct) {
	if (typeof defunct !== "function") defunct = Lexer.defunct;

	var tokens = [];
	var rules = [];
	var remove = 0;
	this.state = 0;
	this.index = 0;
	this.input = "";

	this.addRule = function (pattern, action, start) {
		var global = pattern.global;

		if (!global || Lexer.engineHasStickySupport && !pattern.sticky) {
			var flags = Lexer.engineHasStickySupport ? "gy" : "g";
			if (pattern.multiline) flags += "m";
			if (pattern.ignoreCase) flags += "i";
			if (Lexer.engineHasUnicodeSupport && pattern.unicode) flags += "u";
			pattern = new RegExp(pattern.source, flags);
		}

		if (Object.prototype.toString.call(start) !== "[object Array]") start = [0];

		rules.push({
			pattern: pattern,
			global: global,
			action: action,
			start: start
		});

		return this;
	};

	this.setInput = function (input) {
		remove = 0;
		this.state = 0;
		this.index = 0;
		tokens.length = 0;
		this.input = input;
		return this;
	};

	this.lex = function () {
		if (tokens.length) return tokens.shift();

		this.reject = true;

		while (this.index <= this.input.length) {
			var matches = scan.call(this).splice(remove);
			var index = this.index;

			while (matches.length) {
				if (this.reject) {
					var match = matches.shift();
					var result = match.result;
					var length = match.length;
					this.index += length;
					this.reject = false;
					remove++;

					var token = match.action.apply(this, result);
					if (this.reject) this.index = result.index;
					else if (typeof token !== "undefined") {
						if (Object.prototype.toString.call(token) == "[object Array]") {
							tokens = token.slice(1);
							token = token[0];
						}
						if (length) remove = 0;
						return token;
					}
				} else break;
			}

			var input = this.input;

			if (index < input.length) {
				if (this.reject) {
					remove = 0;
					let token = defunct.call(this, input.charAt(this.index++));
					if (typeof token !== "undefined") {
						if (Object.prototype.toString.call(token) === "[object Array]") {
							tokens = token.slice(1);
							return token[0];
						} else return token;
					}
				} else {
					if (this.index !== index) remove = 0;
					this.reject = true;
				}
			} else if (matches.length) {
				this.reject = true;
			}
			else break;
		}
	};

	function scan() {
		var matches = [];
		var index = 0;

		var state = this.state;
		var lastIndex = this.index;
		var input = this.input;

		for (var i = 0, length = rules.length; i < length; i++) {
			var rule = rules[i];
			var start = rule.start;
			var states = start.length;

			if ((!states || start.indexOf(state) >= 0) ||
				(state % 2 && states === 1 && !start[0])) {
				var pattern = rule.pattern;
				pattern.lastIndex = lastIndex;
				var result = pattern.exec(input);

				if (result && result.index === lastIndex) {
					var j = matches.push({
						result: result,
						action: rule.action,
						length: result[0].length
					});

					if (rule.global) index = j;

					while (--j > index) {
						var k = j - 1;

						if (matches[j].length > matches[k].length) {
							var temple = matches[j];
							matches[j] = matches[k];
							matches[k] = temple;
						}
					}
				}
			}
		}

		return matches;
	}
}



function Parser(table) {
	this.table = table;
}

Parser.prototype.parse = function (input) {
	var length = input.length,
		table = this.table,
		output = [],
		stack = [],
		index = 0;

	while (index < length) {
		var token = input[index++];

		switch (token) {
			case "(":
				stack.unshift(token);
				break;
			case ")":
				while (stack.length) {
					token = stack.shift();
					if (token === "(") break;
					else output.push(token);
				}

				if (token !== "(")
					throw new Error("Mismatched parentheses.");
				break;
			default:
				if (table.hasOwnProperty(token)) {
					while (stack.length) {
						var punctuator = stack[0];

						if (punctuator === "(") break;

						var operator = table[token],
							precedence = operator.precedence,
							antecedence = table[punctuator].precedence;

						if (precedence > antecedence ||
							precedence === antecedence &&
							operator.associativity === "right") break;
						else output.push(stack.shift());
					}

					stack.unshift(token);
				} else output.push(token);
		}
	}

	while (stack.length) {
		let token = stack.shift();
		if (token !== "(") output.push(token);
		else throw new Error("Mismatched parentheses.");
	}

	return output;
};



class Equation {
	constructor(eq) {
		this.lexer = new Lexer();
		this.lexer.addRule(/\s+/, () => {}); // skip whitespace
		this.lexer.addRule(/[\+\-\*\/\(\)\^\~]/, lexeme => lexeme); // punctuators: + - * / ( ) ^
		this.lexer.addRule(/\-?(?:0|[1-9]\d*)(?:\.\d+)?/, lexeme => +lexeme); // numbers
		this.lexer.addRule(/\-?(?:[a-zA-Z])?/, lexeme => lexeme); // variables

		let left1 = { associativity: "left", precedence: 1 };
		let left2 = { associativity: "left", precedence: 2 };
		let left3 = { associativity: "left", precedence: 3 };
		this.parser = new Parser({ "+": left1, "-": left1, "*": left2, "/": left2, "^": left3 });

		if (eq) this.parse(eq);
	}

	parse(eq) {
		eq = eq.replace("sqrt", "~");
		Array.fromIterator = it => Array.from({ [Symbol.iterator]: () => it });
		this.step = value => ({ done: value === undefined, value });

		this.lexer.setInput(eq);
		let next = () => this.step(this.lexer.lex());
		let tokens = Array.fromIterator({ next });

		for (let t = 0; t < tokens.length; ++t) {
			let cur = String(tokens[t]), prev = (t > 0) ? String(tokens[t - 1]) : null, next = (t < tokens.length - 1) ? String(tokens[t + 1]) : null;

			if (cur == "(") {
				if (prev && /[0-9a-zA-Z]/.test(prev)) tokens.splice(t, 0, "*");
			}
			else if (cur == ")") {
				if (next && /[0-9a-zA-Z(]/.test(next)) tokens.splice(t + 1, 0, "*");
			}
			else if (/[a-zA-Z]/.test(cur)) {
				if (prev && /[0-9a-zA-Z]/.test(prev)) tokens.splice(t, 0, "*");
				else if (next && /[0-9a-zA-Z]/.test(next)) tokens.splice(t + 1, 0, "*");
			}
			else if (cur == "^") {
				if (prev && next) {
					tokens.splice(t++ - 1, 0, "@(");
					tokens.splice(t + 2, 0, ")");
					tokens[t] = ",";
				}
				t += 1;
			}
		}

		this.expression = tokens.join("").replace("~", "Math.sqrt").replaceAll("@", "Math.pow");
	}
}


class VectorFunction {
	constructor(f1, f2) {
		this.f1 = new Equation();
		this.f2 = new Equation();
		if (f1) this.f1.parse(f1);
		if (f2) this.f2.parse(f2);

		this.create();
	}

	create() {
		if (!this.f1.expression || !this.f2.expression) {
			this.eval = undefined;
		}
		else {
			this.eval = new Function(`return function(x, y) {
				let dx = ${this.f1.expression};
				let dy = ${this.f2.expression};

				return [dx, dy];
			}`)();
		}
	}

	setF1(f1) {
		this.f1.parse(f1);
		this.create();
	}

	setF2(f2) {
		this.f2.parse(f2);
		this.create();
	}
}