// Script untuk debugging game

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Loaded");
    
    // Check if visualization.js loaded correctly
    if (typeof renderResourceAllocationGraph === 'function') {
        console.log("Visualization function loaded correctly");
    } else {
        console.error("Visualization function not found! Check if visualization.js is loaded correctly");
    }
    
    // Check if Alpine.js is loaded
    if (window.Alpine) {
        console.log("Alpine.js loaded correctly");
    } else {
        console.error("Alpine.js not loaded! Game controller won't work");
    }
    
    // Monitor visualization container
    const vizContainer = document.getElementById('visualization-container');
    if (vizContainer) {
        console.log("Visualization container found in DOM");
    } else {
        console.error("Visualization container not found in DOM");
    }
});
