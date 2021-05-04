class FlowField {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		
		this.particles = [];
		this.setCount(0);
		this.setRadius(0);
		this.setMass(1);
		this.setMaxVelocity(0);
	}

	setDimensions(width, height) {
		this.width = width;
		this.height = height;
	}
	

	setCount(count) {
		while (this.particles.length < count) {
			this.particles.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				vx: 0, vy: 0,

				age: 0,
				life: Math.random() * 700 + 100,
				size: 0,

				saturation: Math.random() * 30 + 30,
				brightness: Math.random() * 60 + 40,
			});
			this.particles[this.particles.length - 1].px = this.particles[this.particles.length - 1].x;
			this.particles[this.particles.length - 1].py = this.particles[this.particles.length - 1].y;
		}

		if (count < this.particles.length) {
			for (let i = count; i < this.particles.length; ++i) {
				this.particles[i].size = 0;
			}
		}

		this.count = count;
	}

	setRadius(size) {
		this.size = size;
		this.sizeIncrement = this.size / 100;
	}

	setMass(mass) {
		this.mass = mass;
	}

	setMaxVelocity(velocity) {
		this.maxVelocity = velocity;
	}


	update(F) {
		for (let i = 0; i < this.count; ++i) {
			let p = this.particles[i];
			if (p.age++ >= p.life) {
				p.size -= this.sizeIncrement;
				if (p.size <= 0.5) {
					p.size = 0;
					p.age = 0;

					p.x = Math.random() * this.width;
					p.y = Math.random() * this.height;
					p.px = p.x; p.py = p.y; p.vx = 0; p.vy = 0;
				}
			}
			else if (p.size < this.size) {
				p.size += this.sizeIncrement;
			}
			else if  (p.size > this.size) {
				p.size -= this.sizeIncrement * 3;
			}
	
			let force = F(p.x, p.y);
			p.vx += force[0] / this.mass;
			p.vy += force[1] / this.mass;
			let m = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
			if (m > this.maxVelocity) {
				p.vx /= m / this.maxVelocity; p.vy /= m / this.maxVelocity;
			}
	
			p.px = p.x;
			p.py = p.y;
			p.x += p.vx;
			p.y += p.vy;
	
			if (p.x < -p.size || p.x >= this.width + p.size || p.y < -p.size || p.y >= this.height + p.size) {
				p.age = p.life;
				p.size = 0;
			}
		}
	}

	draw() {
		for (let i = 0; i < this.count; ++i) {
			let p = this.particles[i];
			let theta = Math.atan2(p.x - p.px, p.y - p.py) * 180 / Math.PI;
			if (theta < 0) theta += 360;

			stroke(theta, p.saturation, p.brightness);
			strokeWeight(p.size);
			line(p.x, p.y, p.px, p.py);
		}
	}
}



const equations = {
	f1: document.getElementById("function-f1"),
	f2: document.getElementById("function-f2"),
};
const controls = {
	count: {
		slider: document.getElementById("count-slider"),
		input: document.getElementById("count-input"),
		max: parseInt(document.getElementById("count-slider").max),
	},
	size: {
		slider: document.getElementById("size-slider"),
		input: document.getElementById("size-input"),
		max: parseInt(document.getElementById("size-slider").max),
	},
	mass: {
		slider: document.getElementById("mass-slider"),
		input: document.getElementById("mass-input"),
		max: parseInt(document.getElementById("mass-slider").max),
	},
	velocity: {
		slider: document.getElementById("velocity-slider"),
		input: document.getElementById("velocity-input"),
		max: parseInt(document.getElementById("velocity-slider").max),
	},
};


function onCountChange(event) {
	let count = Math.min(controls.count.max, parseInt(event.target.value));

	controls.count.slider.value = count;
	controls.count.input.value = count;

	field.setCount(count);
}

function onSizeChange(event) {
	let size = Math.min(controls.size.max, parseInt(event.target.value));

	controls.size.slider.value = size;
	controls.size.input.value = size;

	field.setRadius(size);
}

function onMassChange(event) {
	let mass = Math.min(controls.mass.max, parseFloat(event.target.value));

	controls.mass.slider.value = mass;
	controls.mass.input.value = mass;

	field.setMass(mass);
}

function onVelocityChange(event) {
	let velocity = Math.min(controls.velocity.max, parseFloat(event.target.value));

	controls.velocity.slider.value = velocity;
	controls.velocity.input.value = velocity;

	field.setMaxVelocity(velocity);
}


function setHandlers() {
	controls.count.slider.oninput = onCountChange;
	controls.count.input.oninput = onCountChange;

	controls.size.slider.oninput = onSizeChange;
	controls.size.input.oninput = onSizeChange;

	controls.mass.slider.oninput = onMassChange;
	controls.mass.input.oninput = onMassChange;

	controls.velocity.slider.oninput = onVelocityChange;
	controls.velocity.input.oninput = onVelocityChange;
}



let canvas = undefined;
let field = undefined;

function setup() {
	setHandlers();
	let display = document.querySelector("#display");
	let width = display.clientWidth, height = display.clientHeight;

	canvas = createCanvas(width, height);
	canvas.id("canvas");
	canvas.parent(display);

	frameRate(35);
	background(255);

	field = new FlowField(width, height);
	field.setCount(parseInt(controls.count.input.value));
	field.setRadius(parseInt(controls.size.input.value));
	field.setMass(parseInt(controls.mass.input.value));
	field.setMaxVelocity(parseInt(controls.velocity.input.value));
}

function vortex(x, y) {
	// translate coords so origin is in the middle of the screen
	x -= width / 2;
	y -= height / 2;

	let r = x*x + y*y;
	let vx = -y / r;
	let vy = x / r;

	// return x and y components of the vector
	return [vx, vy];
}
function draw() {
	colorMode(RGB);
	background(0, 0, 0, 5);

	colorMode(HSB);
	field.update(vortex);
	field.draw();
}


window.onresize = () => {
	let display = document.querySelector("#display");
	let width = display.clientWidth, height = display.clientHeight;
	
	resizeCanvas(width, height);
	field.setDimensions(width, height);
};