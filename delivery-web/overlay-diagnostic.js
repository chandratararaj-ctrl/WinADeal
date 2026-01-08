// Quick diagnostic script - paste this in browser console
console.log('=== Overlay Diagnostic ===');

// Check for fixed positioned elements
const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.position === 'fixed' && style.zIndex >= 40;
});

console.log('Fixed elements with high z-index:', fixedElements);

// Check for elements with backdrop classes
const backdropElements = document.querySelectorAll('[class*="backdrop"], [class*="bg-black"], [class*="overlay"]');
console.log('Backdrop elements:', backdropElements);

// Check body overflow
console.log('Body overflow:', document.body.style.overflow);

// Remove all fixed overlays (EMERGENCY FIX)
fixedElements.forEach(el => {
    console.log('Removing:', el);
    el.remove();
});

// Reset body scroll
document.body.style.overflow = 'unset';

console.log('=== Cleanup Complete ===');
