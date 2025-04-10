// Load explosion sound
const explosionSound = new Audio('explosion.mp3');
explosionSound.volume = 0.5; // Adjust volume as needed

const clickSound = new Audio('click.mp3'); // Load click sound
clickSound.volume = 0.5; // Adjust volume as needed

let emojisEnabled = false; // Track if emojis are enabled
let switchOn = false; // Track switch state

// Canvas setup
const canvas = document.getElementById('ropeCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 250; // Increased canvas height

// Rope setup (no circles)
const numSegments = 30; // Increased segments
const segmentLength = 10; // Increased segment length
const lineColor = 'gray';
const springConstant = 0.7; // Slightly stronger spring
const damping = 0.05; // Reduced Damping
const gravity = 0.2; // Increased gravity

const circleRadius = 15;  // Radius of the handle
const revealThreshold = 150; // How far to pull down to reveal
const maxPullDistance = 250; // Limit how far you can pull

let ropePoints = [];
for (let i = 0; i < numSegments; i++) {
    ropePoints.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 20,  // Random initial x position
        y: 20 + (i * segmentLength), // Start from top
        px: canvas.width / 2, // Previous x
        py: 20 + (i * segmentLength), // Previous y
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0
    });
}

// Mouse interaction
let mouseX = null;
let mouseY = null;
let isMouseDown = false;
let isDraggingHandle = false;
let hasInteracted = false; // Track if the user has interacted
let releaseVelocity = 0; // Initial release velocity
const returnSpringConstant = 0.1; // Spring constant for return
const returnDamping = 0.05; // Damping for return

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// Easing function (easeOutElastic)
function easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

canvas.addEventListener('mousemove', function(e) {
    let mousePos = getMousePos(canvas, e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;

    if (isDraggingHandle) {
        hasInteracted = true; // User is actively dragging
        // Limit pull distance
        let pullDistance = mouseY - ropePoints[0].y;
        pullDistance = Math.min(pullDistance, maxPullDistance);

        // Apply easing
        let easedDistance = easeOutElastic(pullDistance / maxPullDistance) * maxPullDistance;

        ropePoints[numSegments - 1].x = mouseX;
        ropePoints[numSegments - 1].y = ropePoints[0].y + easedDistance;
    }
});

canvas.addEventListener('mousedown', function(e) {
    let mousePos = getMousePos(canvas, e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;

    const dx = mouseX - ropePoints[numSegments - 1].x;
    const dy = mouseY - ropePoints[numSegments - 1].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circleRadius) {
        isMouseDown = true;
        isDraggingHandle = true;
        canvas.classList.add('grabbing'); // Add class for custom cursor
    }
});

canvas.addEventListener('mouseup', function(e) {
    isMouseDown = false;
    isDraggingHandle = false;
    canvas.classList.remove('grabbing'); // Remove class
    // Calculate release velocity
    releaseVelocity = (ropePoints[numSegments - 1].y - ropePoints[numSegments - 2].y) * 0.1; // Dampen velocity
});

// Login and Message elements
const loginContainer = document.querySelector('.login-container');
const messageContainer = document.getElementById('messageContainer');
loginContainer.style.transition = 'opacity 0.3s ease'; // Smooth transition
messageContainer.style.transition = 'opacity 0.3s ease';

// Physics and drawing loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Physics simulation
    for (let i = 0; i < numSegments; i++) {
        const point = ropePoints[i];

        // Reset acceleration
        point.ax = 0;
        point.ay = gravity;

        // Verlet integration (more stable)
        const vx = (point.x - point.px) * (1 - damping);
        const vy = (point.y - point.py) * (1 - damping);
        point.px = point.x;
        point.py = point.y;
        point.x += vx + 0.5 * point.ax;
        point.y += vy + 0.5 * point.ay;

        // Spring constraints
        if (i > 0) {
            const prevPoint = ropePoints[i - 1];
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const difference = segmentLength - distance;
            const adjustX = dx / distance * difference * 0.5;
            const adjustY = dy / distance * difference * 0.5;

            point.x += adjustX;
            point.y += adjustY;
            prevPoint.x -= adjustX;
            prevPoint.y -= adjustY;
        } else {
            // Anchor the top point
            point.x = canvas.width / 2;
            point.y = 20;
        }
    }

    // Apply return spring force AFTER physics
    if (!isDraggingHandle && hasInteracted) {
        const initialY = 20 + ((numSegments - 1) * segmentLength);
        const dy = initialY - ropePoints[numSegments - 1].y;

        releaseVelocity += dy * returnSpringConstant;
        releaseVelocity *= (1 - returnDamping);

        ropePoints[numSegments - 1].y += releaseVelocity;

        // Stop the spring when close enough
        if (Math.abs(ropePoints[numSegments - 1].y - initialY) < 1 && Math.abs(releaseVelocity) < 0.1) {
            ropePoints[numSegments - 1].y = initialY;
            releaseVelocity = 0;
        }
    }

    // Draw the rope
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2; // Thicker line
    ctx.moveTo(ropePoints[0].x, ropePoints[0].y);
    for (let i = 1; i < numSegments; i++) {
        ctx.lineTo(ropePoints[i].x, ropePoints[i].y);
    }
    ctx.stroke();

    // Draw the handle
    ctx.beginPath();
    ctx.arc(ropePoints[numSegments - 1].x, ropePoints[numSegments - 1].y, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Show/hide login and message based on pull-down distance AND interaction
    let pullDistance = ropePoints[numSegments - 1].y - 20 - ((numSegments - 1) * segmentLength);
    pullDistance = Math.max(0, pullDistance); // Ensure pullDistance is not negative

    let opacity = Math.min(1, pullDistance / revealThreshold); // Opacity based on pullDistance

    if (hasInteracted) { // Only show if the user has interacted
        loginContainer.style.opacity = opacity;
        messageContainer.style.opacity = opacity;
    } else {
        loginContainer.style.opacity = 0; // Keep hidden initially
        messageContainer.style.opacity = 0;
    }

    requestAnimationFrame(animate);
}

animate();

// Slider functionality (remains mostly the same)
const slider = document.getElementById('slider');
const sliderContainer = document.getElementById('sliderContainer');

sliderContainer.addEventListener('click', function() {
    clickSound.play(); // Play click sound
    emojisEnabled = !emojisEnabled; // Toggle the state
    switchOn = !switchOn; // Toggle switch state

    // Toggle emoji visibility (using CSS classes)
    const icons = document.querySelectorAll('.moving-icon');
    icons.forEach(icon => {
        icon.classList.toggle('hidden'); // Toggle visibility using CSS class
    });

    if (emojisEnabled) {
        slider.style.left = '20px'; // Slide to the right
        initIcons();
    } else {
        slider.style.left = '0px'; // Slide to the left
        hideIcons();
    }
});

// Initialize emojis as hidden (using CSS)
document.querySelectorAll('.moving-icon').forEach(icon => icon.classList.add('hidden'));

// Animate the icons
function initIcons() {
    const icons = document.querySelectorAll('.moving-icon');
    icons.forEach(icon => {
        icon.style.display = 'block'; // Show the emojis
        let iconX = parseFloat(icon.style.left) || Math.random() * (window.innerWidth - icon.offsetWidth);
        let iconY = parseFloat(icon.style.top) || Math.random() * (window.innerHeight - icon.offsetHeight);
        let iconDx = parseFloat(icon.dataset.dx) || (Math.random() - 0.5) * 1; // Slower speed
        let iconDy = parseFloat(icon.dataset.dy) || (Math.random() - 0.5) * 1; // Slower speed

        function animateIcon() {
            iconX += iconDx;
            iconY += iconDy;

            if (iconX + icon.offsetWidth > window.innerWidth || iconX < 0) {
                iconDx = -iconDx;
            }
            if (iconY + icon.offsetHeight > window.innerHeight || iconY < 0) {
                iconDy = -iconDy;
            }

            icon.style.left = iconX + 'px';
            icon.style.top = iconY + 'px';

            requestAnimationFrame(animateIcon);
        }

        animateIcon();

        icon.dataset.dx = iconDx;
        icon.dataset.dy = iconDy;

        // Click event
        icon.onclick = function() {
            explode(icon);
        };
    });
}

function hideIcons() {
    const icons = document.querySelectorAll('.moving-icon');
    icons.forEach(icon => {
        icon.style.display = 'none'; // Hide the emojis
    });
}

// Random Messages
const messages = [
    "Access Granted!",
    "Executing...",
    "Analyzing...",
    "LOL",
    "404: Morality Not Found",
    "Hello, World!",
    "May the code be with you",
    "Code or die",
    "I am inevitable", "Winter is coming",
    "It's over 9000!"
];

function getRandomMessage() {
    return messages[Math.floor(Math.random() * messages.length)];
}

// Explode function
function explode(icon) {
    explosionSound.play(); // Play explosion sound
    const message = getRandomMessage();
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.textContent = message;
    document.body.appendChild(bubble);

    const iconX = icon.offsetLeft;
    const iconY = icon.offsetTop;

    bubble.style.left = iconX + 'px';
    bubble.style.top = iconY - 50 + 'px';

    const originalEmoji = icon.textContent; // Store the original emoji
    icon.textContent = "💥"; // Change to explosion emoji
    icon.classList.add('exploded');

    setTimeout(() => {
        bubble.remove();
        icon.classList.remove('exploded');
        icon.textContent = originalEmoji; // Restore original emoji
        icon.style.left = Math.random() * (window.innerWidth - icon.offsetWidth) + 'px';
        icon.style.top = Math.random() * (window.innerHeight - icon.offsetHeight) + 'px';
        setTimeout(() => {
            icon.style.display = 'block';
            icon.style.opacity = 1;
        }, 20000);
        icon.style.display = 'none';
        icon.style.opacity = 0;
    }, 1000);
}