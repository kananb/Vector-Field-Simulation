"use strict";


class Particle {
	constructor(x, y, size, mass = 1) {
		this.setPos(x, y);
		this.sat = Math.random() * 30 + 30;
		this.bright = Math.random() * 60 + 40;

		this.age = 0;
		this.life = Math.random() * 700 + 100;

		this.trueSize = size;
		this.size = 0;
		this.sizeInc = this.trueSize / 600;

		this.mass = mass;
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
		// kill the particle if it lives too long (useful for when using simplex noise since the particles bunch up together after a while)
		if (this.age++ >= this.life) {
			this.size -= this.sizeInc;
			if (parseInt(this.size) <= 0) {
				this.size = 0;
				this.age = 0;
				this.setPos(Math.random() * width, Math.random() * height);
			}
		}
		else if (this.size < this.trueSize) {
			this.size += this.sizeInc;
		}

		this.vx += dx / this.mass;
		this.vy += dy / this.mass;
		let m = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
		if (m > maxParticleVelocity) {
			this.vx /= m / maxParticleVelocity; this.vy /= m / maxParticleVelocity;
		}

		this.px = this.x;
		this.py = this.y;
		this.x += this.vx;
		this.y += this.vy;


		// if the particle leaves the screen just kill it so that it is placed somewhere else
		if (this.x < -this.size || this.x >= width + this.size || this.y < -this.size || this.y >= height + this.size) {
			this.age = this.life;
			this.size = 0;
		}
	}

	draw() {
		// use direction the particle is traveling to color it
		let dx = this.x - this.px; let dy = this.y - this.py;
		let theta = Math.atan2(dx, dy) * 180 / Math.PI;
		if (theta < 0) theta += 360;

		stroke(theta, this.sat, this.bright);
		strokeWeight(Math.max(0, parseInt(this.size)));
		line(this.x, this.y, this.px, this.py);
	}
}

class FlowField {
	constructor(width, height, count, F) {
		this.width = width;
		this.height = height;
		this.F = F;

		this.particles = [];
		// place each particle on the screen and set its size
		for (let i = 0; i < count; ++i) {
			let xCoord = Math.random() * this.width;
			let yCoord = Math.random() * this.height;
			let particleSize = parseInt(Math.random() * (maxParticleSize - minParticleSize)) + minParticleSize;
			let particleMass = 3; // the particle's mass determines how much it is influenced by the vector field each frame
			this.particles.push(new Particle(xCoord, yCoord, particleSize, particleMass));
		}
	}

	draw() {
		for (let particle of this.particles) {
			let vel = this.F(particle.x, particle.y);
			particle.update(vel[0], vel[1]);

			particle.draw();
		}
	}
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


const noise = {
	obj: new window.SimplexNoise(),
	scale: 1 / 1000, // the smaller the value the closer the sampled values of the simplex noise will be
	depth: 0,
};

function simplex(x, y) {
	let theta = noise.obj.noise3D(x * noise.scale, y * noise.scale, noise.depth) * Math.PI;
	return [Math.cos(theta), Math.sin(theta)];
}



let canvas = undefined;
let field = undefined;
const width = 1800, height = 800;

const particleCount = 1000;
const maxParticleVelocity = 2.5;
const minParticleSize = 20;
const maxParticleSize = 30;

function setup() {
	let parent = document.getElementById("world");
	canvas = createCanvas(width, height);
	canvas.id("canvas");
	canvas.parent(parent);

	frameRate(30);
	background(255);

	const vectorFieldFunction = vortex;
	field = new FlowField(width, height, particleCount, vectorFieldFunction);
}

function draw() {
	colorMode(RGB);
	background(0, 0, 0, 5);

	colorMode(HSB);
	field.draw();

	noise.depth += 0.004;
}