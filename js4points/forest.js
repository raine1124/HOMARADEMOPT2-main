/**
 * Improved Forest Animation with Bulldozer Interaction
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get forest container
    const forestContainer = document.getElementById('forest-container');

    // Create canvas for the forest
    const forestCanvas = document.createElement('canvas');
    forestCanvas.width = forestContainer.offsetWidth;
    forestCanvas.height = 200;
    forestContainer.appendChild(forestCanvas);
    const forestCtx = forestCanvas.getContext('2d');
    
    // Animation variables
    let cycleTime = 0;              // Current time in the animation cycle (0-30000ms)
    const GROWTH_PHASE = 15000;     // 0-15000ms: Growth phase
    const DECAY_PHASE = 30000;      // 15000-30000ms: Decay phase
    
    // Bulldozer interaction
    let bulldozerActive = false;
    let bulldozerX = -200; // Starting off-screen
    let debrisParticles = [];
    
    // Forest elements
    const trees = [];
    const flowers = [];
    
    // Enhanced Tree class with balanced branching structure
    class Tree {
        constructor(x) {
            this.x = x;
            this.maxHeight = 80 + Math.random() * 40; // Maximum tree height
            this.trunkWidth = 8 + Math.random() * 4;  // Width of trunk
            this.fallingAngle = 0; // For bulldozer interaction
            this.fallingSpeed = 0;
            this.isFalling = false;
            
            // Growth stages (0.0 to 1.0)
            this.growthStage = 0;
            
            // Tree structure
            this.trunk = {
                startX: x,
                startY: 200,
                endX: x,
                endY: 200 - this.maxHeight,
                width: this.trunkWidth
            };
            
            // Branches - we'll create them dynamically
            this.branches = [];
            this.generateBranchStructure();
            
            // Leaves - we'll create them per branch
            this.leaves = [];
            
            // Color properties
            this.trunkColor = {
                healthy: '#8B4513', // Brown trunk
                decay: '#5D4037',   // Darker brown
                current: '#8B4513'
            };
            
            this.leafColors = {
                // Healthy colors
                healthy: {
                    dark: '#006400',   // Dark green
                    medium: '#228B22', // Forest green
                    light: '#32CD32'   // Lime green
                },
                // Decay colors
                decay: {
                    dark: '#8B4513',   // Dark brown
                    medium: '#A0522D', // Sienna
                    light: '#CD853F'   // Peru (light brown)
                },
                // Current interpolated colors
                current: {
                    dark: '#006400',
                    medium: '#228B22',
                    light: '#32CD32'
                }
            };
        }
        
        // Generate the branch structure for the tree with truly balanced left/right branches
        generateBranchStructure() {
            // Level 1 branches (main branches from trunk)
            const numMainBranches = 4 + Math.floor(Math.random() * 3); // 4-6 main branches
            
            for (let i = 0; i < numMainBranches; i++) {
                // Space branches evenly along top 2/3 of trunk
                const heightFactor = 0.3 + (i / numMainBranches) * 0.6;
                const branchStartY = this.trunk.startY - this.maxHeight * heightFactor;
                
                // Strictly alternate sides (left/right) for better balance
                // This ensures equal number of branches on each side
                const direction = (i % 2 === 0) ? -1 : 1;
                const angle = (Math.PI / 5) * direction * (0.7 + Math.random() * 0.3);
                const length = this.maxHeight * (0.3 + Math.random() * 0.2);
                
                this.branches.push({
                    level: 1,
                    startX: this.trunk.startX,
                    startY: branchStartY,
                    angle: angle,
                    length: length,
                    width: this.trunkWidth * 0.6,
                    visible: false, // Will be set to true when trunk grows to this point
                    endX: this.trunk.startX, // Will be calculated during update
                    endY: branchStartY,      // Will be calculated during update
                    subBranches: []
                });
            }
            
            // Level 2 branches (from main branches)
            this.branches.forEach(branch => {
                const numSubBranches = 2 + Math.floor(Math.random() * 2); // 2-3 sub branches
                
                for (let i = 0; i < numSubBranches; i++) {
                    // Position along parent branch
                    const posFactor = 0.5 + (i / numSubBranches) * 0.5; // 0.5-1.0
                    
                    // Direction should be opposite of parent for more natural look
                    const direction = (i % 2 === 0) ? -1 : 1;
                    const angle = branch.angle + direction * (Math.PI / 6 + Math.random() * Math.PI / 12);
                    const length = branch.length * 0.6 * (0.7 + Math.random() * 0.3);
                    
                    branch.subBranches.push({
                        level: 2,
                        parentBranch: branch,
                        positionFactor: posFactor, // Position along parent branch
                        angle: angle,
                        length: length,
                        width: branch.width * 0.6,
                        visible: false, // Will be set to true when parent branch is visible and grown
                        startX: 0, // Will be calculated during update
                        startY: 0, // Will be calculated during update
                        endX: 0,   // Will be calculated during update
                        endY: 0     // Will be calculated during update
                    });
                }
            });
        }
        
        // Start tree falling in the direction of the bulldozer
        startFalling(bulldozerPosition) {
            if (!this.isFalling) {
                this.isFalling = true;
                
                // Fall away from bulldozer
                const direction = (bulldozerPosition > this.x) ? -1 : 1;
                this.fallingAngle = direction * (Math.PI / 2); // Target angle
                this.fallingSpeed = 0.05 + Math.random() * 0.05; // Falling speed
                
                // Create debris particles when the tree starts falling
                this.createDebrisParticles();
            }
        }
        
        // Create debris particles when tree falls
        createDebrisParticles() {
            // Use leaf positions for more realistic debris
            if (this.leaves.length > 0) {
                // Create leaf debris from actual leaf positions
                this.leaves.forEach(leaf => {
                    if (Math.random() < 0.7) { // Only use some leaves for debris
                        debrisParticles.push({
                            x: leaf.x,
                            y: leaf.y,
                            size: leaf.size * 0.7,
                            speedX: (Math.random() - 0.5) * 2, // Spread horizontally
                            speedY: -Math.random() * 3, // Initial upward velocity
                            rotation: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 0.2,
                            opacity: 0.8,
                            gravity: 0.1 + Math.random() * 0.1,
                            color: this.leafColors.current.medium,
                            type: 'leaf'
                        });
                    }
                });
            } else {
                // Fallback if leaves haven't been generated yet
                for (let i = 0; i < 15; i++) {
                    const heightFactor = 0.3 + Math.random() * 0.7;
                    const xOffset = Math.random() * 30 - 15;
                    
                    debrisParticles.push({
                        x: this.x + xOffset,
                        y: this.trunk.startY - this.maxHeight * heightFactor * this.growthStage,
                        size: 2 + Math.random() * 4,
                        speedX: (Math.random() - 0.5) * 2,
                        speedY: -Math.random() * 3,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.2,
                        opacity: 0.8,
                        gravity: 0.1 + Math.random() * 0.1,
                        color: this.leafColors.current.medium,
                        type: 'leaf'
                    });
                }
            }
            
            // Create wood debris
            for (let i = 0; i < 8; i++) {
                debrisParticles.push({
                    x: this.x + (Math.random() * 10 - 5),
                    y: this.trunk.startY - this.maxHeight * 0.2 * this.growthStage,
                    size: 3 + Math.random() * 3,
                    speedX: (Math.random() - 0.5) * 1.5,
                    speedY: -Math.random() * 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.1,
                    opacity: 0.9,
                    gravity: 0.15 + Math.random() * 0.1,
                    color: this.trunkColor.current,
                    type: 'wood'
                });
            }
        }
        
        // Update tree based on current phase and time
        update(time, phase, bulldozerX) {
            if (phase === 'growth') {
                // Growth phase: tree grows from sapling to full size
                this.growthStage = time / GROWTH_PHASE;
                
                // Ensure colors are healthy
                this.trunkColor.current = this.trunkColor.healthy;
                this.leafColors.current.dark = this.leafColors.healthy.dark;
                this.leafColors.current.medium = this.leafColors.healthy.medium;
                this.leafColors.current.light = this.leafColors.healthy.light;
                
                // Update trunk growth
                this.trunk.endY = this.trunk.startY - this.maxHeight * Math.min(1, this.growthStage * 1.5);
                
                // Update branch visibility and positions based on growth stage
                this.updateBranchPositions();
                
                // Generate leaves with growth (only once when branches are grown enough)
                if (this.growthStage > 0.6 && this.leaves.length === 0) {
                    this.generateLeaves();
                }
                
                // Update leaf sizes with growth
                this.leaves.forEach(leaf => {
                    leaf.size = leaf.maxSize * Math.min(1, (this.growthStage - 0.6) * 2.5);
                });
            } 
            else if (phase === 'decay') {
                // Decay phase: tree changes color
                const decayProgress = (time - GROWTH_PHASE) / (DECAY_PHASE - GROWTH_PHASE);
                
                // Interpolate trunk color
                this.trunkColor.current = lerpColor(
                    this.trunkColor.healthy,
                    this.trunkColor.decay,
                    decayProgress
                );
                
                // Interpolate leaf colors
                this.leafColors.current.dark = lerpColor(
                    this.leafColors.healthy.dark,
                    this.leafColors.decay.dark,
                    decayProgress
                );
                this.leafColors.current.medium = lerpColor(
                    this.leafColors.healthy.medium,
                    this.leafColors.decay.medium,
                    decayProgress
                );
                this.leafColors.current.light = lerpColor(
                    this.leafColors.healthy.light,
                    this.leafColors.decay.light,
                    decayProgress
                );
            }
            
            // Check for interaction with bulldozer
            if (!this.isFalling && bulldozerActive && bulldozerX > 0) {
                // Make trees fall as bulldozer approaches
                const distanceToBulldozer = Math.abs(bulldozerX - this.x);
                if (distanceToBulldozer < 80) {
                    this.startFalling(bulldozerX);
                }
            }
            
            // Update falling animation if tree is falling
            if (this.isFalling) {
                if (this.fallingAngle > -Math.PI/2 && this.fallingAngle < Math.PI/2) {
                    // Continue falling until horizontal
                    this.fallingAngle += this.fallingSpeed;
                    
                    // Clamp to horizontal
                    if (this.fallingAngle > Math.PI/2) this.fallingAngle = Math.PI/2;
                    if (this.fallingAngle < -Math.PI/2) this.fallingAngle = -Math.PI/2;
                }
            }
        }
        
        // Update branch positions and visibility based on current growth stage
        updateBranchPositions() {
            // Calculate growth factor for trunk
            const trunkHeightFactor = this.growthStage * 1.5;
            
            // Update main branches
            this.branches.forEach(branch => {
                // Calculate branch visibility based on trunk growth
                const branchHeightFactor = (this.trunk.startY - branch.startY) / this.maxHeight;
                
                // Only make branch visible if trunk has grown to this height
                branch.visible = trunkHeightFactor >= branchHeightFactor;
                
                if (branch.visible) {
                    // Calculate how much of this branch should be grown
                    const branchFactor = Math.min(1, (this.growthStage - branchHeightFactor) * 2);
                    
                    // Calculate endpoint based on angle and length
                    branch.endX = branch.startX + Math.cos(branch.angle) * branch.length * branchFactor;
                    branch.endY = branch.startY + Math.sin(branch.angle) * branch.length * branchFactor;
                    
                    // Update sub-branches (only grow if main branch is at least 50% grown)
                    const subBranchGrowth = Math.max(0, (branchFactor - 0.5) * 2);
                    
                    branch.subBranches.forEach(subBranch => {
                        // Only make sub-branch visible if parent branch is grown enough
                        subBranch.visible = subBranchGrowth > 0;
                        
                        if (subBranch.visible) {
                            // Calculate position along parent branch
                            const parentX = branch.startX + (branch.endX - branch.startX) * subBranch.positionFactor;
                            const parentY = branch.startY + (branch.endY - branch.startY) * subBranch.positionFactor;
                            
                            // Set start position
                            subBranch.startX = parentX;
                            subBranch.startY = parentY;
                            
                            // Calculate end position
                            const subFactor = Math.min(1, subBranchGrowth * 1.5);
                            subBranch.endX = parentX + Math.cos(subBranch.angle) * subBranch.length * subFactor;
                            subBranch.endY = parentY + Math.sin(subBranch.angle) * subBranch.length * subFactor;
                        }
                    });
                }
            });
        }
        
        // Generate leaves properly positioned at branch endpoints
        generateLeaves() {
            this.leaves = []; // Clear any existing leaves
            
            // Add leaves to main branch endpoints
            this.branches.forEach(branch => {
                if (!branch.visible || !branch.endX) return;
                
                // 2-4 leaves at the end of each main branch
                const numLeaves = 2 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < numLeaves; i++) {
                    // Position near the end of branch
                    const posFactor = 0.85 + (i / numLeaves) * 0.15; // 0.85-1.0 (very close to end)
                    
                    // Calculate position
                    const leafX = branch.startX + (branch.endX - branch.startX) * posFactor;
                    const leafY = branch.startY + (branch.endY - branch.startY) * posFactor;
                    
                    // Add a leaf with angle following branch direction
                    this.leaves.push({
                        x: leafX,
                        y: leafY,
                        angle: branch.angle + (Math.random() - 0.5) * Math.PI / 6, // Small variation
                        maxSize: 8 + Math.random() * 4,
                        size: 0, // Will grow during animation
                        curl: 0,
                        colorIndex: Math.floor(Math.random() * 3) // 0, 1, or 2 for different shades
                    });
                }
                
                // Add leaves to sub-branch endpoints
                branch.subBranches.forEach(subBranch => {
                    if (!subBranch.visible || !subBranch.startX || !subBranch.endX) return;
                    
                    // 2-3 leaves per sub branch
                    const numLeaves = 2 + Math.floor(Math.random() * 2);
                    
                    for (let i = 0; i < numLeaves; i++) {
                        // Position at the very end of branch
                        const posFactor = 0.9 + (i / numLeaves) * 0.1; // 0.9-1.0
                        
                        // Calculate position
                        const leafX = subBranch.startX + (subBranch.endX - subBranch.startX) * posFactor;
                        const leafY = subBranch.startY + (subBranch.endY - subBranch.startY) * posFactor;
                        
                        // Add a leaf
                        this.leaves.push({
                            x: leafX,
                            y: leafY,
                            angle: subBranch.angle + (Math.random() - 0.5) * Math.PI / 6,
                            maxSize: 6 + Math.random() * 3,
                            size: 0, // Will grow during animation
                            curl: 0,
                            colorIndex: Math.floor(Math.random() * 3) // 0, 1, or 2 for different shades
                        });
                    }
                });
            });
        }
        
        // Draw the tree
        draw() {
            if (this.growthStage <= 0) return; // Don't draw if not visible
            
            forestCtx.save();
            
            // Apply falling rotation if tree is falling
            if (this.isFalling) {
                forestCtx.translate(this.x, this.trunk.startY);
                forestCtx.rotate(this.fallingAngle);
                forestCtx.translate(-this.x, -this.trunk.startY);
            }
            
            // Draw the trunk
            this.drawBranch(
                this.trunk.startX, this.trunk.startY,
                this.trunk.endX, this.trunk.endY,
                this.trunk.width * Math.min(1, this.growthStage * 1.5),
                this.trunkColor.current
            );
            
            // Draw main branches (only if visible)
            this.branches.forEach(branch => {
                if (!branch.visible) return; // Skip if not visible yet
                
                this.drawBranch(
                    branch.startX, branch.startY,
                    branch.endX, branch.endY,
                    branch.width,this.trunkColor.current
                );
                
                // Draw sub-branches (only if visible)
                branch.subBranches.forEach(subBranch => {
                    if (!subBranch.visible) return; // Skip if not visible yet
                    
                    this.drawBranch(
                        subBranch.startX, subBranch.startY,
                        subBranch.endX, subBranch.endY,
                        subBranch.width,
                        this.trunkColor.current
                    );
                });
            });
            
            // Draw leaves
            this.leaves.forEach(leaf => {
                if (leaf.size <= 0) return; // Skip if too small
                
                // Get color based on index
                const colors = [
                    this.leafColors.current.dark,
                    this.leafColors.current.medium,
                    this.leafColors.current.light
                ];
                
                this.drawLeaf(
                    leaf.x, leaf.y,
                    leaf.angle,
                    leaf.size,
                    leaf.curl,
                    colors[leaf.colorIndex]
                );
            });
            
            forestCtx.restore();
        }
        
        // Draw a branch (tapered line)
        drawBranch(x1, y1, x2, y2, width, color) {
            forestCtx.strokeStyle = color;
            forestCtx.lineWidth = width;
            forestCtx.lineCap = 'round';
            
            forestCtx.beginPath();
            forestCtx.moveTo(x1, y1);
            forestCtx.lineTo(x2, y2);
            forestCtx.stroke();
        }
        
        // Draw a leaf (custom shape with curl effect)
        drawLeaf(x, y, angle, size, curl, color) {
            forestCtx.save();
            forestCtx.translate(x, y);
            forestCtx.rotate(angle);
            
            // Create a leaf shape
            forestCtx.fillStyle = color;
            forestCtx.beginPath();
            
            // Start at the bottom center
            forestCtx.moveTo(0, 0);
            
            // Left side with curl
            forestCtx.quadraticCurveTo(
                -size * 0.7, -size * 0.5 + size * curl * 0.5,
                -size * 0.2, -size * (1 + curl * 0.2)
            );
            
            // Top
            forestCtx.quadraticCurveTo(
                0, -size * (1.2 + curl * 0.3),
                size * 0.2, -size * (1 + curl * 0.2)
            );
            
            // Right side with curl
            forestCtx.quadraticCurveTo(
                size * 0.7, -size * 0.5 + size * curl * 0.5,
                0, 0
            );
            
            forestCtx.fill();
            forestCtx.restore();
        }
    }
    
    // Enhanced Flower class with detailed growth and decay
    class Flower {
        constructor(x) {
            this.x = x;
            this.originalX = x; // Store original x for reset
            this.maxHeight = 15 + Math.random() * 10; // Maximum flower height
            this.growthStage = 0;
            this.isFalling = false;
            this.fallingAngle = 0;
            this.fallingSpeed = 0;
            
            // Stem properties
            this.stem = {
                width: 1.5 + Math.random() * 0.5,
                bendFactor: (Math.random() - 0.5) * 0.2 // Random bend
            };
            this.originalBendFactor = this.stem.bendFactor; // Store original bend
            
            // Bloom properties
            this.bloom = {
                size: 4 + Math.random() * 3,
                petalCount: 5 + Math.floor(Math.random() * 3), // 5-7 petals
                innerSize: 2 + Math.random() * 1.5 // Center of flower
            };
            
            // Pick a random flower color
            const flowerColors = ['#FF1493', '#FF69B4', '#FFD700', '#FF4500', '#9370DB', '#9932CC'];
            this.colors = {
                bloom: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                stem: '#3CB371', // Medium sea green
                inner: '#FFFF00', // Yellow center
                
                // Decay colors
                decayBloom: '#8B4513', // Brown
                decayStem: '#556B2F', // Dark olive green
                decayInner: '#A0522D', // Sienna
                
                // Current colors (will be interpolated during decay)
                currentBloom: '',
                currentStem: '',
                currentInner: ''
            };
            
            // Initialize current colors
            this.colors.currentBloom = this.colors.bloom;
            this.colors.currentStem = this.colors.stem;
            this.colors.currentInner = this.colors.inner;
            
            // Leaves on stem
            this.leaves = [];
            this.generateLeaves();
        }
        
        // Generate leaves for the stem
        generateLeaves() {
            // 1-2 leaves on stem
            const numLeaves = 1 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < numLeaves; i++) {
                const heightPos = 0.3 + (i / numLeaves) * 0.4; // 0.3-0.7 up the stem
                
                // Alternate sides
                const side = (i % 2 === 0) ? -1 : 1;
                
                this.leaves.push({
                    heightPosition: heightPos,
                    size: 3 + Math.random() * 2,
                    angle: side * (Math.PI / 4 + Math.random() * Math.PI / 8),
                    curl: 0 // Will increase during decay
                });
            }
        }
        
        // Reset flower at cycle start
        reset() {
            this.x = this.originalX;
            this.stem.bendFactor = this.originalBendFactor;
            this.isFalling = false;
            this.fallingAngle = 0;
            
            // Reset leaves
            this.leaves.forEach(leaf => {
                leaf.curl = 0;
            });
            
            // Reset colors
            this.colors.currentBloom = this.colors.bloom;
            this.colors.currentStem = this.colors.stem;
            this.colors.currentInner = this.colors.inner;
        }
        
        // Start flower falling
        startFalling(bulldozerPosition) {
            if (!this.isFalling) {
                this.isFalling = true;
                
                // Fall away from bulldozer
                const direction = (bulldozerPosition > this.x) ? -1 : 1;
                this.fallingAngle = direction * (Math.PI / 2); // Target angle
                this.fallingSpeed = 0.08 + Math.random() * 0.08; // Falling speed (faster than trees)
                
                // Create flower debris
                this.createDebrisParticles();
            }
        }
        
        // Create debris particles when flower falls
        createDebrisParticles() {
            const height = this.maxHeight * Math.min(1, this.growthStage * 1.2);
            const stemEndX = this.x + height * this.stem.bendFactor;
            const stemEndY = 200 - height;
            
            // Create petal debris
            for (let i = 0; i < 6; i++) {
                debrisParticles.push({
                    x: stemEndX,
                    y: stemEndY,
                    size: 2 + Math.random() * 2,
                    speedX: (Math.random() - 0.5) * 1.5,
                    speedY: -Math.random() * 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    opacity: 0.9,
                    gravity: 0.08 + Math.random() * 0.05,
                    color: this.colors.currentBloom,
                    type: 'petal'
                });
            }
            
            // Create leaf debris
            debrisParticles.push({
                x: this.x + (Math.random() * 6 - 3),
                y: 200 - height * 0.5,
                size: 3 + Math.random() * 2,
                speedX: (Math.random() - 0.5) * 1,
                speedY: -Math.random() * 1.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 0.9,
                gravity: 0.1,
                color: this.colors.currentStem,
                type: 'leaf'
            });
        }
        
        // Update flower based on current phase and time
        update(time, phase, bulldozerX) {
            if (phase === 'growth') {
                // Growth phase: flower grows from bud to full bloom
                this.growthStage = time / GROWTH_PHASE;
                
                // Reset flower at start of growth
                if (this.growthStage < 0.05) {
                    this.reset();
                }
                
                // Ensure colors are healthy
                this.colors.currentBloom = this.colors.bloom;
                this.colors.currentStem = this.colors.stem;
                this.colors.currentInner = this.colors.inner;
            } 
            else if (phase === 'decay') {
                // Decay phase: flower wilts and changes color
                const decayProgress = (time - GROWTH_PHASE) / (DECAY_PHASE - GROWTH_PHASE);
                
                // Wilt the flower (droop more)
                const wiltFactor = this.originalBendFactor - decayProgress * 0.3;
                this.stem.bendFactor = wiltFactor;
                
                // Curl the leaves
                this.leaves.forEach(leaf => {
                    leaf.curl = decayProgress * Math.PI / 4;
                });
                
                // Interpolate colors from healthy to decay
                this.colors.currentBloom = lerpColor(this.colors.bloom, this.colors.decayBloom, decayProgress);
                this.colors.currentStem = lerpColor(this.colors.stem, this.colors.decayStem, decayProgress);
                this.colors.currentInner = lerpColor(this.colors.inner, this.colors.decayInner, decayProgress);
            }
            
            // Check for interaction with bulldozer
            if (!this.isFalling && bulldozerActive && bulldozerX > 0) {
                // Make flowers fall as bulldozer approaches
                const distanceToBulldozer = Math.abs(bulldozerX - this.x);
                if (distanceToBulldozer < 60) { // Flowers fall at closer distance than trees
                    this.startFalling(bulldozerX);
                }
            }
            
            // Update falling animation if flower is falling
            if (this.isFalling) {
                if (this.fallingAngle > -Math.PI/2 && this.fallingAngle < Math.PI/2) {
                    // Continue falling until horizontal
                    this.fallingAngle += this.fallingSpeed;
                    
                    // Clamp to horizontal
                    if (this.fallingAngle > Math.PI/2) this.fallingAngle = Math.PI/2;
                    if (this.fallingAngle < -Math.PI/2) this.fallingAngle = -Math.PI/2;
                }
            }
        }
        
        // Draw the flower
        draw() {
            if (this.growthStage <= 0) return; // Don't draw if not visible
            
            forestCtx.save();
            
            // Apply falling rotation if flower is falling
            if (this.isFalling) {
                forestCtx.translate(this.x, 200);
                forestCtx.rotate(this.fallingAngle);
                forestCtx.translate(-this.x, -200);
            }
            
            const height = this.maxHeight * Math.min(1, this.growthStage * 1.2);
            const bloomSize = this.bloom.size * Math.min(1, (this.growthStage - 0.7) * 3.3);
            
            // Calculate stem curve
            const stemEndX = this.x + height * this.stem.bendFactor;
            const stemEndY = 200 - height;
            
            // Draw stem (curved line)
            forestCtx.strokeStyle = this.colors.currentStem;
            forestCtx.lineWidth = this.stem.width;
            forestCtx.lineCap = 'round';
            
            forestCtx.beginPath();
            forestCtx.moveTo(this.x, 200);
            forestCtx.quadraticCurveTo(
                this.x + height * this.stem.bendFactor * 0.5,
                200 - height * 0.5,
                stemEndX, stemEndY
            );
            forestCtx.stroke();
            
            // Draw leaves on stem
            this.leaves.forEach(leaf => {
                // Only draw leaves after stem has grown to that point
                if (this.growthStage < leaf.heightPosition) return;
                
                // Calculate leaf position along the stem
                const leafPosX = this.x + height * this.stem.bendFactor * leaf.heightPosition;
                const leafPosY = 200 - height * leaf.heightPosition;
                
                // Draw leaf
                this.drawLeaf(
                    leafPosX, leafPosY,
                    leaf.angle,
                    leaf.size * Math.min(1, (this.growthStage - leaf.heightPosition) * 5),
                    leaf.curl,
                    this.colors.currentStem
                );
            });
            
            // Draw bloom if it has started growing
            if (bloomSize > 0) {
                this.drawBloom(stemEndX, stemEndY, bloomSize);
            }
            
            forestCtx.restore();
        }
        
        // Draw a leaf (similar to tree leaf but smaller)
        drawLeaf(x, y, angle, size, curl, color) {
            forestCtx.save();
            forestCtx.translate(x, y);
            forestCtx.rotate(angle);
            
            // Create a leaf shape
            forestCtx.fillStyle = color;
            forestCtx.beginPath();
            
            // Leaf shape
            forestCtx.moveTo(0, 0);
            forestCtx.quadraticCurveTo(
                -size * 0.6, -size * 0.5 + size * curl * 0.5,
                -size * 0.2, -size * (1 + curl * 0.2)
            );
            forestCtx.quadraticCurveTo(
                0, -size * (1.2 + curl * 0.3),
                size * 0.2, -size * (1 + curl * 0.2)
            );
            forestCtx.quadraticCurveTo(
                size * 0.6, -size * 0.5 + size * curl * 0.5,
                0, 0
            );
            
            forestCtx.fill();
            forestCtx.restore();
        }
        
        // Draw the flower bloom (petals around center)
        drawBloom(x, y, size) {
            // Draw petals
            for (let i = 0; i < this.bloom.petalCount; i++) {
                const angle = (i / this.bloom.petalCount) * Math.PI * 2;
                this.drawPetal(x, y, angle, size, this.colors.currentBloom);
            }
            
            // Draw center
            forestCtx.fillStyle = this.colors.currentInner;
            forestCtx.beginPath();
            forestCtx.arc(x, y, this.bloom.innerSize * size / this.bloom.size, 0, Math.PI * 2);
            forestCtx.fill();
        }
        
        // Draw a single petal
        drawPetal(x, y, angle, size, color) {
            forestCtx.save();
            forestCtx.translate(x, y);
            forestCtx.rotate(angle);
            
            // Petal shape
            forestCtx.fillStyle = color;
            forestCtx.beginPath();
            forestCtx.moveTo(0, 0);
            forestCtx.quadraticCurveTo(
                size * 0.5, -size * 0.5,
                0, -size
            );
            forestCtx.quadraticCurveTo(
                -size * 0.5, -size * 0.5,
                0, 0
            );
            forestCtx.fill();
            
            forestCtx.restore();
        }
    }
    
    // Draw and update debris particles
    function updateDebrisParticles() {
        // Remove particles that are off-screen or fully transparent
        for (let i = debrisParticles.length - 1; i >= 0; i--) {
            const particle = debrisParticles[i];
            
            // Apply gravity and movement
            particle.speedY += particle.gravity;
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            
            // Fade out over time
            particle.opacity -= 0.01;
            
            // Remove if it's off-screen or faded out
            if (particle.y > 200 || particle.opacity <= 0) {
                debrisParticles.splice(i, 1);
            }
        }
        
        // Draw remaining particles
        debrisParticles.forEach(particle => {
            forestCtx.save();
            forestCtx.globalAlpha = particle.opacity;
            forestCtx.translate(particle.x, particle.y);
            forestCtx.rotate(particle.rotation);
            
            if (particle.type === 'leaf' || particle.type === 'petal') {
                // Draw leaf/petal shape
                forestCtx.fillStyle = particle.color;
                forestCtx.beginPath();
                
                if (particle.type === 'leaf') {
                    // Leaf shape (more elongated)
                    forestCtx.moveTo(0, 0);
                    forestCtx.quadraticCurveTo(
                        -particle.size * 0.5, -particle.size * 0.4,
                        -particle.size * 0.2, -particle.size
                    );
                    forestCtx.quadraticCurveTo(
                        0, -particle.size * 1.1,
                        particle.size * 0.2, -particle.size
                    );
                    forestCtx.quadraticCurveTo(
                        particle.size * 0.5, -particle.size * 0.4,
                        0, 0
                    );
                } else {
                    // Petal shape (more rounded)
                    forestCtx.moveTo(0, 0);
                    forestCtx.quadraticCurveTo(
                        particle.size * 0.5, -particle.size * 0.5,
                        0, -particle.size
                    );
                    forestCtx.quadraticCurveTo(
                        -particle.size * 0.5, -particle.size * 0.5,
                        0, 0
                    );
                }
                
                forestCtx.fill();
            } else {
                // Draw wood chunks (simple rectangle)
                forestCtx.fillStyle = particle.color;
                forestCtx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            }
            
            forestCtx.restore();
        });
    }
    
    // Initialize trees and flowers
    function initForest() {
        // Clear existing elements
        trees.length = 0;
        flowers.length = 0;
        debrisParticles.length = 0;
        
        // Create trees (spaced across the canvas width)
        const numTrees = Math.floor(forestCanvas.width / 100);
        for (let i = 0; i < numTrees; i++) {
            const x = 50 + i * 100 + (Math.random() * 40 - 20); // Evenly spaced with some randomness
            trees.push(new Tree(x));
        }
        
        // Create flowers (more numerous than trees)
        const numFlowers = Math.floor(forestCanvas.width / 25);
        for (let i = 0; i < numFlowers; i++) {
            const x = 25 + i * 25 + (Math.random() * 15 - 7.5); // Evenly spaced with some randomness
            flowers.push(new Flower(x));
        }
    }
    
    // Helper function to interpolate between two colors
    function lerpColor(color1, color2, factor) {
        // Parse the hex colors to RGB
        const r1 = parseInt(color1.substring(1, 3), 16);
        const g1 = parseInt(color1.substring(3, 5), 16);
        const b1 = parseInt(color1.substring(5, 7), 16);
        
        const r2 = parseInt(color2.substring(1, 3), 16);
        const g2 = parseInt(color2.substring(3, 5), 16);
        const b2 = parseInt(color2.substring(5, 7), 16);
        
        // Interpolate each component
        const r = Math.round(r1 + factor * (r2 - r1));
        const g = Math.round(g1 + factor * (g2 - g1));
        const b = Math.round(b1 + factor * (b2 - b1));
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Reset forest after bulldozer clearing
    function resetForest() {
        cycleTime = 0;
        bulldozerActive = false;
        debrisParticles.length = 0;
        
        console.log("Forest reset triggered");
        
        // Re-initialize forest
        initForest();
    }
    
    // Listen for bulldozer events
    document.addEventListener('forestRegrow', resetForest);
    document.addEventListener('bulldozerStart', function(e) {
        bulldozerActive = true;
        bulldozerX = e.detail.x;
        console.log("Bulldozer start detected at x:", bulldozerX);
    });
    
    document.addEventListener('bulldozerUpdate', function(e) {
        bulldozerX = e.detail.x;
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        forestCanvas.width = forestContainer.offsetWidth;
        initForest(); // Recreate forest elements when resizing
    });
    
    // Draw the scene
    function drawScene() {
        // Clear canvas
        forestCtx.clearRect(0, 0, forestCanvas.width, forestCanvas.height);
        
        // Draw trees
        trees.forEach(tree => tree.draw());
        
        // Draw flowers
        flowers.forEach(flower => flower.draw());
        
        // Draw debris particles
        updateDebrisParticles();
    }
    
    // Update all elements
    function updateElements(dt, bulldozerX) {
        // Determine current phase
        let phase = '';
        if (cycleTime < GROWTH_PHASE) {
            phase = 'growth';
        } else {
            phase = 'decay';
        }
        
        // Update trees
        trees.forEach(tree => tree.update(cycleTime, phase, bulldozerX));
        
        // Update flowers
        flowers.forEach(flower => flower.update(cycleTime, phase, bulldozerX));
    }
    
    // Main animation loop
    function animate(timestamp) {
        // Initialize on first run
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
            initForest();
        }
        
        // Calculate delta time
        const dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // Only update cycle time if bulldozer is not active
        if (!bulldozerActive) {
            cycleTime = (cycleTime + dt) % DECAY_PHASE;
        }
        
        // Update elements, passing bulldozer position
        updateElements(dt, bulldozerX);
        
        // Draw everything
        drawScene();
        
        // Continue animation loop
        requestAnimationFrame(animate);
    }
    
    // Start variables
    let lastTimestamp = null;
    
    // Start animation
    requestAnimationFrame(animate);
});