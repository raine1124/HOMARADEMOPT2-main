/**
 * Bulldozer Animation that clears the forest
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get container elements
    const factoryContainer = document.getElementById('factory-container');
    const forestContainer = document.getElementById('forest-container');
    
    if (!factoryContainer || !forestContainer) {
        console.error('Required containers not found');
        return;
    }
    
    // Create canvas for the bulldozer
    const bulldozerCanvas = document.createElement('canvas');
    bulldozerCanvas.width = window.innerWidth;
    bulldozerCanvas.height = 300;
    bulldozerCanvas.style.position = 'absolute';
    bulldozerCanvas.style.bottom = '0';
    bulldozerCanvas.style.left = '0';
    bulldozerCanvas.style.zIndex = '3'; // Above forest and factory
    bulldozerCanvas.style.pointerEvents = 'none'; // Don't block interactions
    bulldozerCanvas.id = 'bulldozer-canvas'; // Add ID for easier selection
    document.querySelector('.frame-container').appendChild(bulldozerCanvas);
    
    const ctx = bulldozerCanvas.getContext('2d');
    
    // Bulldozer state
    const bulldozer = {
        active: false,
        x: -200, // Start off-screen
        y: bulldozerCanvas.height - 60, // Bottom position
        width: 150,
        height: 80,
        wheelRadius: 20,
        wheelRotation: 0,
        bounceOffset: 0,
        clearWidth: window.innerWidth, // Width of the clearing rectangle
        speed: 0, // Pixels per frame
        timeBetweenRuns: 30 * 1000, // 30 seconds
        timeForCrossing: 15 * 1000, // 15 seconds to cross screen
        nextRunTime: Date.now() + 5000 // First run after 5 seconds
    };
    
    // Calculate clearing width (from factory exit to left edge)
    const factoryRect = factoryContainer.getBoundingClientRect();
    const forestRect = forestContainer.getBoundingClientRect();
    
    // Colors
    const colors = {
        body: '#e69138',
        darkBody: '#b45f06',
        blade: '#f1c232',
        darkBlade: '#bf9000',
        cabin: '#9fc5e8',
        track: '#666666',
        wheel: '#333333',
        wheelHub: '#cccccc',
        exhaust: 'rgba(120, 120, 120, 0.6)'
    };
    
    // Draw bulldozer function
    function drawBulldozer(x, y, wheelRotation, bounceOffset) {
        ctx.save();
        ctx.translate(x, y + bounceOffset);
        
        // Draw tracks
        ctx.fillStyle = colors.track;
        ctx.fillRect(20, 50, 110, 15);
        
        // Draw wheels (4 wheels)
        const wheelPositions = [30, 60, 90, 120];
        ctx.fillStyle = colors.wheel;
        wheelPositions.forEach(wheelX => {
            ctx.save();
            ctx.translate(wheelX, 55);
            ctx.rotate(wheelRotation);
            
            // Wheel
            ctx.beginPath();
            ctx.arc(0, 0, bulldozer.wheelRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Wheel hub
            ctx.fillStyle = colors.wheelHub;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Wheel spokes
            ctx.strokeStyle = colors.wheelHub;
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const angle = i * (Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * bulldozer.wheelRadius, Math.sin(angle) * bulldozer.wheelRadius);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Draw main body
        ctx.fillStyle = colors.body;
        ctx.fillRect(30, 10, 100, 40);
        
        // Draw cabin
        ctx.fillStyle = colors.cabin;
        ctx.fillRect(100, -15, 30, 25);
        
        // Cabin support
        ctx.fillStyle = colors.darkBody;
        ctx.fillRect(95, -15, 10, 25);
        
        // Draw blade
        ctx.fillStyle = colors.blade;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, 0);
        ctx.lineTo(30, 50);
        ctx.lineTo(15, 65);
        ctx.lineTo(0, 50);
        ctx.closePath();
        ctx.fill();
        
        // Blade details
        ctx.fillStyle = colors.darkBlade;
        ctx.fillRect(0, 45, 30, 10);
        
        // Exhaust pipe with smoke
        ctx.fillStyle = colors.darkBody;
        ctx.fillRect(80, -5, 8, 15);
        
        // Draw exhaust smoke when moving
        if (bulldozer.active) {
            const time = Date.now() / 100;
            for (let i = 0; i < 3; i++) {
                const size = 3 + i * 3;
                const offset = i * 8;
                const opacity = 0.7 - (i * 0.2);
                
                ctx.fillStyle = `rgba(120, 120, 120, ${opacity})`;
                ctx.beginPath();
                ctx.arc(
                    84 + Math.sin(time + i) * 2, 
                    -8 - offset + Math.cos(time + i * 1.5) * 2, 
                    size, 
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    // Draw clearing rectangle (white space that clears the forest)
    function drawClearingRect(x) {
        const clearingWidth = window.innerWidth - x + bulldozer.width;
        
        // Semi-transparent white rectangle to "erase" the forest
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x - 15, 0, clearingWidth, bulldozerCanvas.height);
    }
    
    // Start a new bulldozer run
    function startBulldozerRun() {
        bulldozer.active = true;
        bulldozer.x = factoryRect.left + 30; // Start at factory door
        
        // Calculate speed based on the distance to travel and time
        const distanceToTravel = forestRect.right;
        bulldozer.speed = distanceToTravel / (bulldozer.timeForCrossing / (1000 / 60));
        
        // Schedule next run
        bulldozer.nextRunTime = Date.now() + bulldozer.timeBetweenRuns;
        
        // Create and dispatch an event to notify forest about bulldozer starting
        const startEvent = new CustomEvent('bulldozerStart', {
            detail: { x: bulldozer.x }
        });
        document.dispatchEvent(startEvent);
    }
    
    // End the bulldozer run
    function endBulldozerRun() {
        bulldozer.active = false;
        bulldozer.x = -200; // Move off screen
        
        // Dispatch event to tell forest to regrow
        const regrowEvent = new CustomEvent('forestRegrow');
        document.dispatchEvent(regrowEvent);
        
        console.log("Bulldozer run completed, forest regrow event dispatched");
    }
    
    // Update bulldozer animation
    function updateBulldozer() {
        // Clear canvas
        ctx.clearRect(0, 0, bulldozerCanvas.width, bulldozerCanvas.height);
        
        // Check if it's time for a new run
        const currentTime = Date.now();
        if (!bulldozer.active && currentTime >= bulldozer.nextRunTime) {
            startBulldozerRun();
        }
        
        // If active, update bulldozer position
        if (bulldozer.active) {
            // Move bulldozer
            bulldozer.x += bulldozer.speed;
            
            // Update bulldozer position by dispatching an event
            const updateEvent = new CustomEvent('bulldozerUpdate', {
                detail: { x: bulldozer.x }
            });
            document.dispatchEvent(updateEvent);
            
            // Update wheel rotation
            bulldozer.wheelRotation += bulldozer.speed / bulldozer.wheelRadius;
            
            // Bounce effect
            bulldozer.bounceOffset = Math.sin(bulldozer.x / 15) * 2;
            
            // Draw clearing rectangle
            drawClearingRect(bulldozer.x);
            
            // Draw the bulldozer
            drawBulldozer(
                bulldozer.x, 
                bulldozer.y, 
                bulldozer.wheelRotation,
                bulldozer.bounceOffset
            );
            
            // Check if bulldozer has reached the end
            if (bulldozer.x > forestRect.right) {
                endBulldozerRun();
            }
        } else {
            // Draw the bulldozer off-screen when not active
            drawBulldozer(
                bulldozer.x, 
                bulldozer.y, 
                bulldozer.wheelRotation,
                0
            );
        }
        
        // Request next frame
        requestAnimationFrame(updateBulldozer);
    }
    
    // Handle window resize to keep everything positioned correctly
    window.addEventListener('resize', function() {
        bulldozerCanvas.width = window.innerWidth;
        
        // Update container positions
        const updatedFactoryRect = factoryContainer.getBoundingClientRect();
        const updatedForestRect = forestContainer.getBoundingClientRect();
        
        factoryRect.left = updatedFactoryRect.left;
        factoryRect.right = updatedFactoryRect.right;
        forestRect.left = updatedForestRect.left;
        forestRect.right = updatedForestRect.right;
    });
    
    // Start animation loop
    updateBulldozer();
});