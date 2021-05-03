"use strict";


class Particle {
	constructor(x, y, size) {
		this.setPos(x, y);
		this.sat = Math.random() * 30 + 30;
		this.bright = Math.random() * 60 + 40;

		this.age = 0;
		this.life = Math.random() * 700 + 100;

		this.trueSize = size;
		this.size = 0;
		this.sizeInc = this.trueSize / 600;
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		this.px = x;
		this.py = y;
		this.vx = 0;
		this.vy = 0;
	}

	update(dx, dy) {
		if (this.age++ >= this.life) {
			this.size -= this.sizeInc;
			if (parseInt(this.size) <= 0) {
				this.size = 0;
				this.age = 0;
				this.life = Math.random() * 700 + 100;
				this.setPos(Math.random() * width, Math.random() * height);
			}
		}
		else if (this.size < this.trueSize) {
			this.size += this.sizeInc;
		}

		const maxv = 1;
		this.vx += dx / 5;
		this.vy += dy / 5;
		let m = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
		if (m > maxv) {
			this.vx /= m / maxv; this.vy /= m / maxv;
		}

		this.px = this.x;
		this.py = this.y;
		this.x += this.vx;
		this.y += this.vy;


		if (this.x < -this.size) {
			this.x = width + this.size;
			this.px = this.x;

			this.y = Math.random() * height;
			this.py = this.y;

			this.vx = 0;
			this.vy = 0;
		}
		else if (this.x >= width + this.size) {
			this.x = -this.size;
			this.px = this.x;

			this.y = Math.random() * height;
			this.py = this.y;

			this.vx = 0;
			this.vy = 0;
		}
		
		if (this.y < -this.size) {
			this.y = height + this.size;
			this.py = this.y;

			this.x = Math.random() * width;
			this.px = this.x;

			this.vx = 0;
			this.vy = 0;
		}
		else if (this.y >= height + this.size) {
			this.y = -this.size;
			this.py = this.y;

			this.x = Math.random() * width;
			this.px = this.x;

			this.vx = 0;
			this.vy = 0;
		}
	}

	draw() {
		let dx = this.x - this.px; let dy = this.y - this.py;
		let theta = Math.atan2(dx, dy) * 180 / Math.PI;
		if (theta < 0) theta += 360;

		// let nx = this.x - width / 2, ny = this.y - height / 2;
		// let calc = (1 - (Math.sqrt(nx*nx + ny*ny) / Math.sqrt(width*width/4 + height*height/4))) * 100;
		// stroke(theta, calc, calc);
		stroke(theta, this.sat, this.bright);
		// stroke(theta, 45, 70);
		// stroke(50, 100, theta * 100 + 155);
		strokeWeight(Math.max(0, parseInt(this.size)));
		line(this.x, this.y, this.px, this.py);
	}
}


function vortex(x, y) {
	x -= width / 2;
	y -= height / 2;

	let r = Math.sqrt(x*x + y*y);
	let vx = -y / r;
	let vy = x / r;

	return [vx, vy];
}


class FlowField {
	constructor(width, height, count = 1000) {
		this.width = width;
		this.height = height;

		this.noise = new window.SimplexNoise();
		this.scale = 1 / 1000;
		this.depth = 0;

		this.ratio = 1;
		this.add = 0.01;
		this.rdepth = 5;

		this.particles = [];
		for (let i = 0; i < count; ++i) {
			this.particles.push(new Particle(Math.random() * this.width, Math.random() * this.height, Math.random() * 10 + 20));
		}
	}

	draw() {
		for (let particle of this.particles) {
			// let vel = vortex(particle.x, particle.y);
			// particle.update(vel[0], vel[1]);

			let theta = this.noise.noise3D(particle.x * this.scale, particle.y * this.scale, this.depth) * Math.PI;
			particle.update(Math.cos(theta), Math.sin(theta));

			particle.draw();
		}

		this.depth += 0.004;
	}
}



let canvas = undefined;
let field = undefined;
const width = 1800, height = 800;

function setup() {
	let parent = document.getElementById("world");
	canvas = createCanvas(width, height);
	canvas.id("canvas");
	canvas.parent(parent);

	frameRate(30);
	background(255);

	field = new FlowField(width, height);
}

function draw() {
	colorMode(RGB);
	background(0, 0, 0, 5);

	colorMode(HSB);
	field.draw();
}