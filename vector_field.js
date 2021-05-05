class FlowField {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.dwidth = this.width * 0.15;
		this.dheight = this.height * 0.15;
		
		this.particles = [];
		this.setCount(0);
		this.setRadius(0);
		this.setMass(1);
		this.setMaxVelocity(0);
		this.setZoom(1);

		this.vectorFunction = new VectorFunction();
	}

	setDimensions(width, height) {
		this.width = width;
		this.height = height;
	}
	

	setCount(count) {
		while (this.particles.length < count) {
			this.particles.push({
				x: Math.random() * (this.width + this.dwidth * 2) - this.dwidth,
				y: Math.random() * (this.height + this.dheight * 2) - this.dheight,
				vx: 0, vy: 0,

				age: 0,
				life: Math.random() * 700 + 100,
				size: 1,

				saturation: Math.random() * 30 + 30,
				brightness: Math.random() * 60 + 40,
			});
			this.particles[this.particles.length - 1].px = this.particles[this.particles.length - 1].x;
			this.particles[this.particles.length - 1].py = this.particles[this.particles.length - 1].y;
		}

		if (count < this.particles.length) {
			for (let i = count; i < this.particles.length; ++i) {
				this.particles[i].size = 1;
				this.particles[i].vx = 0;
				this.particles[i].vy = 0;
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

	setZoom(zoom) {
		this.scale = zoom / 100;
	}

	setF1(f1) {
		this.vectorFunction.setF1(f1);
	}

	setF2(f2) {
		this.vectorFunction.setF2(f2);
	}


	update() {
		if (!this.vectorFunction.eval) return;

		for (let i = 0; i < this.count; ++i) {
			let p = this.particles[i];
			if (p.age++ >= p.life) {
				p.size -= (p.size <= this.size) ? this.sizeIncrement : (p.size - this.size) / 50;
				if (p.size <= 1) {
					p.size = 1;
					p.age = 0;

					p.x = Math.random() * (this.width + this.dwidth * 2) - this.dwidth;
					p.y =Math.random() * (this.height + this.dheight * 2) - this.dheight;
					p.px = p.x; p.py = p.y; p.vx = 0; p.vy = 0;
				}
			}
			else if (p.size < this.size) {
				p.size += this.sizeIncrement;
				if (p.size > this.size) p.size = this.size;
			}
			else if  (p.size > this.size) {
				p.size -= Math.max(this.sizeIncrement, (p.size - this.size) / 50);
			}
	
			let force;
			try {
				force = this.vectorFunction.eval((p.x - this.width / 2) * this.scale, -(p.y - this.height / 2) * this.scale);
			} catch (err) {
				this.vectorFunction.eval = undefined;
				return;
			}
			if (this.mass) {
				p.vx += force[0] / this.mass;
				p.vy += -force[1] / this.mass;
			}
			else {
				p.vx = force[0] * this.maxVelocity;
				p.vy = -force[1] * this.maxVelocity;
			}
			
			let m = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
			if (m > this.maxVelocity) {
				p.vx /= m / this.maxVelocity; p.vy /= m / this.maxVelocity;
			}
	
			p.px = p.x;
			p.py = p.y;
			p.x += p.vx;
			p.y += p.vy;
	
			if (p.x < -p.size - this.dwidth || p.x >= this.width + p.size + this.dwidth || p.y < -p.size - this.dheight || p.y >= this.height + p.size + this.dheight) {
				p.age = p.life;
				p.size = 1;
			}
		}
	}

	draw() {
		for (let i = 0; i < this.count; ++i) {
			let p = this.particles[i];
			let theta = Math.atan2(p.x - p.px, p.y - p.py) * 180 / Math.PI;
			if (theta < 0) theta += 360;

			stroke(theta, p.saturation, p.brightness);
			strokeWeight(parseInt(p.size));
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
		min: parseInt(document.getElementById("count-slider").min),
	},
	size: {
		slider: document.getElementById("size-slider"),
		input: document.getElementById("size-input"),
		max: parseInt(document.getElementById("size-slider").max),
		min: parseInt(document.getElementById("size-slider").min),
	},
	mass: {
		slider: document.getElementById("mass-slider"),
		input: document.getElementById("mass-input"),
		max: parseFloat(document.getElementById("mass-slider").max),
		min: parseFloat(document.getElementById("mass-slider").min),
	},
	velocity: {
		slider: document.getElementById("velocity-slider"),
		input: document.getElementById("velocity-input"),
		max: parseFloat(document.getElementById("velocity-slider").max),
		min: parseFloat(document.getElementById("velocity-slider").min),
	},
	zoom: {
		slider: document.getElementById("zoom-slider"),
		input: document.getElementById("zoom-input"),
		max: parseFloat(document.getElementById("zoom-slider").max),
		min: parseFloat(document.getElementById("zoom-slider").min),
	},
};
const menu = {
	display: document.getElementById("display"),
	settings: document.getElementById("settings"),
	hide: document.getElementById("hide-button"),
	show: document.getElementById("show-button"),
	showWrapper: document.getElementById("show-button-wrapper"),
}


function onCountChange(event) {
	let count;
	if (event) {
		count = Math.max(controls.count.min, Math.min(controls.count.max, parseInt(event.target.value)));
	}
	else {
		count = parseInt(controls.count.input.value);
	}
	if (isNaN(count)) return;

	controls.count.slider.value = count;
	controls.count.input.value = count;

	field.setCount(count);
}

function onSizeChange(event) {
	let size;
	if (event) {
		size = Math.max(controls.size.min, Math.min(controls.size.max, parseInt(event.target.value)));
	}
	else {
		size = parseInt(controls.size.input.value);
	}
	if (isNaN(size)) return;

	controls.size.slider.value = size;
	controls.size.input.value = size;

	field.setRadius(size);
}

function onMassChange(event) {
	let mass;
	if (event) {
		mass = Math.max(controls.mass.min, parseFloat(event.target.value));
	}
	else {
		mass = parseFloat(controls.mass.input.value);
	}
	if (isNaN(mass)) return;

	controls.mass.slider.value = mass;
	controls.mass.input.value = mass;

	field.setMass(mass);
}

function onVelocityChange(event) {
	let velocity;
	if (event) {
		velocity = Math.max(controls.velocity.min, parseFloat(event.target.value));
	}
	else {
		velocity = parseFloat(controls.velocity.input.value);
	}
	if (isNaN(velocity)) return;

	controls.velocity.slider.value = velocity;
	controls.velocity.input.value = velocity;

	field.setMaxVelocity(velocity);
}

function onZoomChange(event) {
	let zoom;
	if (event) {
		zoom = Math.max(controls.zoom.min, parseFloat(event.target.value));
	}
	else {
		zoom = parseFloat(controls.zoom.input.value);
	}
	if (isNaN(zoom)) return;

	controls.zoom.slider.value = zoom;
	controls.zoom.input.value = zoom;

	field.setZoom(zoom);
}

function onF1Change(event) {
	try {
		field.setF1(equations.f1.value);
		equations.f1.classList.remove("invalid");
	}
	catch (err) {
		equations.f1.classList.add("invalid");
	}
}

function onF2Change(event) {
	try {
		field.setF2(equations.f2.value);
		equations.f2.classList.remove("invalid");
	}
	catch (err) {
		equations.f2.classList.add("invalid");
	}
}

function onHideToggle(event) {
	menu.settings.classList.toggle("hidden");
	menu.display.classList.toggle("full");
	menu.showWrapper.classList.toggle("hidden");
	windowResized();
}


function setHandlers() {
	equations.f1.oninput = onF1Change;
	equations.f2.oninput = onF2Change;

	onF1Change();
	onF2Change();

	controls.count.slider.oninput = onCountChange;
	controls.count.input.oninput = onCountChange;

	controls.size.slider.oninput = onSizeChange;
	controls.size.input.oninput = onSizeChange;

	controls.mass.slider.oninput = onMassChange;
	controls.mass.input.oninput = onMassChange;

	controls.velocity.slider.oninput = onVelocityChange;
	controls.velocity.input.oninput = onVelocityChange;

	controls.zoom.slider.oninput = onZoomChange;
	controls.zoom.input.oninput = onZoomChange;

	onCountChange();
	onSizeChange();
	onMassChange();
	onVelocityChange();
	onZoomChange();


	menu.hide.onclick = onHideToggle;
	menu.show.onclick = onHideToggle;
}



let canvas = undefined;
let field = undefined;

function setup() {
	let display = document.querySelector("#display");
	let width = display.clientWidth, height = display.clientHeight;

	canvas = createCanvas(width, height);
	canvas.id("canvas");
	canvas.parent(display);

	frameRate(35);

	field = new FlowField(width, height);
	setHandlers();
}

function draw() {
	colorMode(RGB);
	background(0, 0, 0, 5);

	colorMode(HSB);
	field.update();
	field.draw();
}

function windowResized() {
	let display = document.querySelector("#display");
	let width = display.clientWidth, height = display.clientHeight;
	
	resizeCanvas(width, height);
	field.setDimensions(width, height);
}