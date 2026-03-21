import React from "react"; // Import the core React library
import { createRoot } from "react-dom/client"; // Import the createRoot function to initialize the React app
import App from "./App.tsx"; // Import the main App component
import "./index.css"; // Import the global CSS styles

createRoot(document.getElementById("root")!).render( // Find the HTML element with id 'root' and render the React app inside it
  <React.StrictMode> {/* Enable React's StrictMode for highlighting potential issues */}
    <App /> {/* Render the main App component */}
  </React.StrictMode> // Close the StrictMode wrapper
); // End of the render function

if ('serviceWorker' in navigator) { // Check if the browser supports Service Workers
  window.addEventListener('load', () => { // Wait for the browser window to fully load before proceeding
    navigator.serviceWorker.register('/sw.js').then(registration => { // Register the Service Worker file (sw.js) for enabling advanced app features (PWA)
      registration.update(); // Check for updates to the Service Worker on every page load

      registration.onupdatefound = () => { // Triggered when a new Service Worker update is found
        const installingWorker = registration.installing; // Get the currently installing Service Worker
        if (installingWorker) { // Ensure there is a Service Worker being installed
          installingWorker.onstatechange = () => { // Monitor the state changes of the installing Service Worker
            if (installingWorker.state === 'installed') { // If the Service Worker is successfully installed
              if (navigator.serviceWorker.controller) { // Check if there is an existing Service Worker controlling the page
                console.log('New content is available; please refresh.'); // Log a message indicating new content is available
              }
            }
          };
        }
      };
    }).catch(err => { // Handle errors during the Service Worker registration process
      console.log('SW registration failed: ', err); // Log the error message to the console
    });
  });
}
