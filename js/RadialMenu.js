import * as THREE from 'three';

class RadialMenu {
    constructor(options = {}) {
        this.options = {
            fontColor: options.fontColor || '#ffffff',
            highlightColor: options.highlightColor || '#ff0000',
            cameraController: options.cameraController || null,
            tree: options.tree || null,
            camera: options.camera || null
        };

        this.showingDropdown = false;
        this.dropdownItems = ['Reset Camera', 'Track Last Points', 'Sign Up For Early Access'];
        this.dropdownElement = null;
        this._camera = null;
        this.menuElement = null;
        this.redLineElement = null;
        this.isVisible = false;
        this.isRotating = false;
        
        // Add CSS for menu and dropdown
        this._addStyles();
        
        // Create menu structure but keep it hidden
        this._init();
        
        // Set up click event listener for the radial menu
        document.addEventListener('click', this._onClick.bind(this));
    }

    _addStyles() {
        const menuStyle = document.createElement('style');
        menuStyle.textContent = `
            #radial-menu-container {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 125px;
                height: 125px;
                z-index: 1000;
                pointer-events: none;
                display: none;
            }
            
            #radial-menu {
                position: absolute;
                width: 100%;
                height: 100%;
                transform-origin: center;
                pointer-events: auto;
                cursor: pointer;
            }
            
            .radial-text {
                position: absolute;
                color: white;
                font-family: Arial, sans-serif;
                font-weight: 300;
                font-size: 4px;
                text-transform: lowercase;
                white-space: nowrap;
                user-select: none;
            }
            
            #radial-red-line {
                position: absolute;
                height: 1px;
                background-color: #ff0000;
                transform-origin: left center;
                top: 50%;
                left: 50%;
                z-index: 999;
                width: 35px;
            }
            
            .radial-menu-dropdown {
                position: absolute;
                background: none;
                padding: 0;
                color: white;
                font-family: Arial, sans-serif;
                display: none;
                z-index: 1001;
                text-align: center;
                width: 100px;
                text-transform: lowercase;
                font-size: 4px;
            }
            
            .dropdown-item {
                margin: 2px 0;
                cursor: pointer;
                transition: color 0.2s;
                font-size: 6px;
                color: white;
            }
            
            .dropdown-item:hover {
                color: #ff0000;
            }
        `;
        document.head.appendChild(menuStyle);
    }

    _init() {
        this._createReferenceMatchingRadialMenu();
        this._createDropdownMenu();
    }

    _createReferenceMatchingRadialMenu() {
        // Create container
        const container = document.createElement('div');
        container.id = 'radial-menu-container';
        document.body.appendChild(container);
        
        // Create menu
        const menu = document.createElement('div');
        menu.id = 'radial-menu';
        container.appendChild(menu);
        this.menuElement = menu;
        
        // Create red line pointing at 3 o'clock (0 degrees)
        const redLine = document.createElement('div');
        redLine.id = 'radial-red-line';
        redLine.style.transform = 'rotate(0deg)';
        menu.appendChild(redLine);
        this.redLineElement = redLine;
        
        // Create the exact text arrangement as in the reference image
        this._createOuterTextRing(menu, 45);
        this._createInnerTextRing(menu, 25);
    }
    
    _createOuterTextRing(parent, radius) {
        const centerX = 50;
        const centerY = 50;
        const text = "homara";
        
        // Create the text arranged exactly like the reference image
        // Words on the right side are horizontal, then rotate around the circle
        for (let angle = 0; angle < 360; angle += 10) {
            const radians = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radians);
            const y = centerY + radius * Math.sin(radians);
            
            const textElem = document.createElement('div');
            textElem.className = 'radial-text';
            textElem.textContent = text;
            textElem.style.left = `${x}%`;
            textElem.style.top = `${y}%`;
            
            // Calculate text orientation to match reference:
            // - Right side (around 0°): text is horizontal
            // - Text rotates to follow the circle
            // This creates the "radiating" effect where text at 3 o'clock is horizontal,
            // and text rotates as it goes around the circle
            let rotation;
            
            if (angle <= 90) {
                // Top-right quadrant: gradually rotate from horizontal 
                rotation = angle;
            } else if (angle <= 180) {
                // Top-left quadrant: continue rotation
                rotation = angle; 
            } else if (angle <= 270) {
                // Bottom-left quadrant
                rotation = angle;
            } else {
                // Bottom-right quadrant: rotate back to horizontal
                rotation = angle;
            }
            
            textElem.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            parent.appendChild(textElem);
        }
    }
    
    _createInnerTextRing(parent, radius) {
        const centerX = 50;
        const centerY = 50;
        const text = "homara";
        
        // Create inner ring with same orientation pattern
        for (let angle = 0; angle < 360; angle += 15) {
            const radians = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radians);
            const y = centerY + radius * Math.sin(radians);
            
            const textElem = document.createElement('div');
            textElem.className = 'radial-text';
            textElem.textContent = text;
            textElem.style.left = `${x}%`;
            textElem.style.top = `${y}%`;
            
            // Use same orientation logic as outer ring
            let rotation = angle;
            
            textElem.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            
            parent.appendChild(textElem);
        }
    }
    
    _createDropdownMenu() {
        const dropdown = document.createElement('div');
        dropdown.className = 'radial-menu-dropdown';
        
        this.dropdownItems.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.toLowerCase();
            menuItem.dataset.index = index;
            menuItem.className = 'dropdown-item';
            
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleMenuAction(index);
                this._hideDropdown();
            });
            
            dropdown.appendChild(menuItem);
        });
        
        document.body.appendChild(dropdown);
        this.dropdownElement = dropdown;
        
        document.addEventListener('click', (e) => {
            if (this.showingDropdown && !dropdown.contains(e.target)) {
                this._hideDropdown();
            }
        });
    }
    
    _handleMenuAction(index) {
        const { cameraController, tree, camera } = this.options;
        
        switch(index) {
            case 0: // Reset Camera
                if (cameraController) {
                    cameraController.reset();
                }
                break;
                
            case 1: // Track Last Points
                if (tree && camera && cameraController) {
                    // Get the last point from the tree's custom point positions
                    const customPoints = tree.customPointPositions || [];
                    if (customPoints.length > 0) {
                        const lastPoint = customPoints[customPoints.length - 1];
                        
                        // Create a target position away from the point
                        const targetPosition = new THREE.Vector3(
                            lastPoint.x + 10, 
                            lastPoint.y, 
                            lastPoint.z + 10
                        );
                        
                        // Move camera to look at the last point
                        camera.position.copy(targetPosition);
                        camera.lookAt(lastPoint.x, lastPoint.y, lastPoint.z);
                        
                        // Update camera controller's target
                        cameraController.target.set(lastPoint.x, lastPoint.y, lastPoint.z);
                    }
                }
                break;
                
            case 2: // Sign Up For Early Access
                this._showSignUpForm();
                break;
        }
    }
    
    _showSignUpForm() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        `;
        
        const form = document.createElement('div');
        form.style.cssText = `
            background: #222;
            padding: 20px;
            border-radius: 8px;
            width: 300px;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        form.innerHTML = `
            <h2 style="margin-top: 0;">Sign Up For Early Access</h2>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Email:</label>
                <input type="email" id="signup-email" style="width: 100%; padding: 8px; box-sizing: border-box;">
            </div>
            <div style="display: flex; justify-content: space-between;">
                <button id="cancel-signup" style="padding: 8px 15px; background: #444; border: none; color: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button id="submit-signup" style="padding: 8px 15px; background: #2E8B57; border: none; color: white; border-radius: 4px; cursor: pointer;">Submit</button>
            </div>
        `;
        
        overlay.appendChild(form);
        document.body.appendChild(overlay);
        
        document.getElementById('cancel-signup').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        document.getElementById('submit-signup').addEventListener('click', () => {
            const email = document.getElementById('signup-email').value;
            if (email) {
                alert(`Thank you! ${email} has been added to our early access list.`);
                document.body.removeChild(overlay);
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }
    
    _onClick(event) {
        // Check if we clicked on the menu (anywhere in it)
        if (this.menuElement && this.menuElement.contains(event.target)) {
            // Start rotation animation from 0 to 90 degrees (3 o'clock to 6 o'clock)
            this.isRotating = true;
            
            // Animate the red line from 0 to 90 degrees
            let currentAngle = 0;
            const targetAngle = 90;
            const duration = 300; // ms
            const startTime = Date.now();
            
            const animateRedLine = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Calculate current angle using easing
                currentAngle = 0 + (targetAngle - 0) * progress;
                
                // Update red line rotation
                this.redLineElement.style.transform = `rotate(${currentAngle}deg)`;
                
                if (progress < 1) {
                    requestAnimationFrame(animateRedLine);
                } else {
                    // Animation complete, show dropdown at the center bottom of the menu
                    const rect = this.menuElement.getBoundingClientRect();
                    const dropdownX = rect.left + (rect.width / 2);
                    const dropdownY = rect.bottom;
                    this._showDropdown(dropdownX, dropdownY);
                }
            };
            
            // Start animation
            animateRedLine();
        }
    }
    
    _showDropdown(x, y) {
        if (!this.dropdownElement) return;
        
        // Position dropdown centered under the end of the red line
        const redLine = this.redLineElement;
        const redLineRect = redLine.getBoundingClientRect();
        const menuRect = this.menuElement.getBoundingClientRect();
        
        // The red line is now at 90 degrees (pointing down)
        // Position dropdown below it
        this.dropdownElement.style.left = `${menuRect.left + (menuRect.width / 2) - 50}px`; // center it
        this.dropdownElement.style.top = `${menuRect.top + (menuRect.height / 2) + 35}px`; // below red line
        this.dropdownElement.style.display = 'block';
        this.showingDropdown = true;
    }
    
    _hideDropdown() {
        if (!this.dropdownElement) return;
        
        this.dropdownElement.style.display = 'none';
        this.showingDropdown = false;
        
        // Reset red line position back to 0 degrees (3 o'clock)
        this.redLineElement.style.transform = 'rotate(0deg)';
    }
    
    update(camera) {
        // Store camera reference
        this._camera = camera;
    }
    
    show() {
        this.isVisible = true;
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.style.display = 'block';
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.style.display = 'none';
        }
        this._hideDropdown();
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
        return this.isVisible;
    }
    
    dispose() {
        // Remove HTML elements
        if (this.menuElement && this.menuElement.parentNode && this.menuElement.parentNode.parentNode) {
            this.menuElement.parentNode.parentNode.removeChild(this.menuElement.parentNode);
        }
        
        if (this.dropdownElement && this.dropdownElement.parentNode) {
            this.dropdownElement.parentNode.removeChild(this.dropdownElement);
        }
        
        // Remove event listeners
        document.removeEventListener('click', this._onClick);
    }
}

export { RadialMenu };
