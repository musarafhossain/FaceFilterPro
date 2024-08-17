// script.js

window.onload = () => {
    // Ensure gAuth is loaded before accessing its functions
    if (typeof loadConfig === 'function') {
        loadConfig();
    } else {
        console.error('loadConfig function is not defined');
    }
};
