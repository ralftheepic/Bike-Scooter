// frontend/src/components/BarcodeScanner.jsx
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// html5-qrcode state constants for reference (optional, but good to know)
// const Html5QrcodeScannerState = {
//     NOT_STARTED: 1,
//     CAMERA_PERMISSION_REQUESTED: 2,
//     CAMERA_PERMISSION_GRANTED: 3,
//     CAMERA_PERMISSION_DENIED: 4,
//     SCANNING: 5,
//     SUCCEEDED: 6,
//     ERROR: 7
// };


const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  // Create a ref for the div where the scanner will be rendered
  const scannerRef = useRef(null);

  useEffect(() => {
    // Give the div a unique ID that html5-qrcode can attach to
    const scannerId = 'qr-code-full-region';

    // Ensure the div element exists before initializing
    if (!scannerRef.current) {
        console.error(`Div with ID ${scannerId} not found.`);
        return;
    }

    // Create a new instance of the scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      scannerId, // ID of the div element
      {
        fps: 10, // Frames per second
        qrbox: { width: 300, height: 300 }, // Adjust size here as needed
        disableFlip: false, // Keep this if you want front/back camera toggle
      },
      /* verbose= */ false // Set to true for more detailed logs from the library
    );

    // Define success and error callbacks
    const handleScanSuccess = (decodedText, decodedResult) => {
      console.log(`QR code scanned: ${decodedText}`);
      // === IMPORTANT: Do NOT stop or clear the scanner here ===
      // The scanner will automatically keep scanning and call this function
      // again if it detects a different or the same code.

      if (onScanSuccess) {
        // Pass the scanned data up to the parent component
        // The parent is responsible for handling duplicates or processing
        onScanSuccess(decodedText);
      }
    };

    const handleScanError = (errorMessage) => {
      // This is often called continuously, only log specific errors if needed
      // console.warn(`QR scanning error: ${errorMessage}`);
      if (onScanError) {
         onScanError(errorMessage); // Pass error up
      }
    };

    // Render the scanner - This starts the video feed and scanning process
    html5QrcodeScanner.render(handleScanSuccess, handleScanError);

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      console.log("Cleaning up scanner...");
      // Check if the scanner instance exists and is in a state that can be cleared
      if (html5QrcodeScanner && html5QrcodeScanner.getState() !== 6 /* SUCCEEDED */ && html5QrcodeScanner.getState() !== 7 /* ERROR */ && html5QrcodeScanner.getState() !== 1 /* NOT_STARTED */) {
         html5QrcodeScanner.clear()
           .then(() => console.log("Scanner cleared successfully on unmount."))
           .catch(error => console.error("Failed to clear scanner on unmount:", error));
      } else if (html5QrcodeScanner) {
         // If it's already in a terminal state, just log
         console.log(`Scanner already in state ${html5QrcodeScanner.getState()} on unmount, no need to clear.`);
      }
    };

  }, [onScanSuccess, onScanError]); // Effect depends on the callback props

  return (
    <div>
      {/* This is the div where the video feed and scanner UI will appear */}
      {/* The parent component will control when to render this component */}
      <div id="qr-code-full-region" ref={scannerRef} style={{ width: '100%' }}>
        {/* html5-qrcode will render the video feed and UI here */}
      </div>
       {/* No internal state needed here to hide/show scanner based on single scan */}
    </div>
  );
};

export default BarcodeScanner;