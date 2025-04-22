import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const canvasToBlob = (canvas, type = 'image/png', quality = 1) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas to Blob failed'));
      }
    }, type, quality);
  });
};


const BarcodeScanner = ({ onScanSuccess }) => {
  const [sourceType, setSourceType] = useState("local"); // Default to "local" camera on load
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productDetails, setProductDetails] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null); // Keep this if you want to show the captured image
  const videoRef = useRef(null); // Ref for the IP camera video container
  const canvasRef = useRef(null); // Ref for a hidden canvas used for capturing frames
  const html5QrCodeRef = useRef(null); // Ref for the Html5Qrcode instance


  // Initialize Html5Qrcode instance on mount
  useEffect(() => {
    console.log("Initializing Html5Qrcode instance.");
    const html5QrCode = new Html5Qrcode("html5qr-code");
    html5QrCodeRef.current = html5QrCode;

    // Cleanup function: Stop and Clear the scanner when the component unmounts
    return () => {
      console.log("Component unmounting, attempting to stop and clear scanner...");
      // Ensure stop finishes before clearing
      stopScanner().then(() => {
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.clear().catch(console.error); // Clear the instance
          console.log("Html5Qrcode scanner cleared.");
        }
      }).catch(console.error);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Start/Switch scanner based on sourceType
  useEffect(() => {
    console.log(`Source type changed to: ${sourceType}. Stopping current scanner...`);
    // Stop any active scanner first to prevent conflicts
    stopScanner().then(() => { // Ensure stop is awaited before starting new one
      console.log(`Stop finished. Starting ${sourceType} camera...`);
      setProductDetails(null); // Clear previous details
      setCapturedImage(null); // Clear previous captured image
      setError(""); // Clear previous errors
      setLoading(false); // Reset loading state

      if (sourceType === "local") {
        startLocalCamera();
      } else if (sourceType === "ip") {
        startIPCamera();
      }
    }).catch(console.error); 
  }, [sourceType]); 

  // Helper function to stop the scanner
  const stopScanner = async () => {
    // Check if html5QrCodeRef.current exists and is not already IDLE (state 0)
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() !== 0) {
      try {
        console.log("Attempting to stop Html5Qrcode scanner...");
        await html5QrCodeRef.current.stop();
        console.log("Html5Qrcode scanner stopped successfully.");
      } catch (err) {
        console.warn("Error stopping Html5Qrcode scanner (might already be stopped or in transition):", err);
        // Log the error but don't throw, as it might be harmless if scanner is already stopping
      }
    } else {
      console.log("Html5Qrcode scanner not running or paused, no stop needed.");
    }

    // Also stop any IP camera video element
    if (videoRef.current) {
      const video = videoRef.current.querySelector("video");
      if (video) {
        video.pause();
        video.removeAttribute('src'); // Clear the source
        video.load();
        videoRef.current.innerHTML = ""; // Remove the video element
        console.log("IP camera video stopped.");
      }
    }
  };


  const startLocalCamera = async () => {
    console.log("Attempting to start local camera...");
    setLoading(true);
    setError("");

    // Configuration for local camera scan
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }, // Scan box size
      rememberLastUsedCamera: true,
      disableFlip: false,
    };

    try {
      console.log("Getting camera list...");
      const cameras = await Html5Qrcode.getCameras();
      console.log("Camera list:", cameras);

      if (cameras && cameras.length) {
        console.log("Local cameras found, starting Html5Qrcode.start()...");
        const cameraToUse = cameras[0].id; // Use the ID of the first camera

        await html5QrCodeRef.current.start(
       
          cameraToUse,
          config,
          // Success callback for live scan
          (decodedText) => {
            console.log("Live scan success:", decodedText);
            // Stop the scanner once a code is detected
            html5QrCodeRef.current.stop().catch(console.error); // Stop the live feed
            // Call parent success handler
            onScanSuccess(decodedText);
            // Fetch product details for the scanned code
            fetchProductDetails(decodedText);
          },
          // Error callback for live scan (e.g., no QR code found in frame)
          (errorMessage) => {
           
          }
        );
        console.log("Html5Qrcode.start() called successfully.");
      } else {
        setError("No cameras found on this device.");
        console.warn("No local cameras found.");
      }
    } catch (err) {
      console.error("Error starting local camera (details below):", err);
      if (err.name) console.error("Error Name:", err.name);
      if (err.message) console.error("Error Message:", err.message);
      if (err.constraint) console.error("Error Constraint:", err.constraint); 

      setError("Failed to access local camera. Please check permissions and camera availability."); 
    } finally {
      setLoading(false);
    }
  };

  const startIPCamera = () => {
    console.log("Attempting to start IP camera feed...");
    setLoading(true);
    setError("");

    const video = document.createElement("video");
    video.src = "http://192.168.1.105:8080/photo.jpg";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.style.width = "100%";

    if(videoRef.current) {
      videoRef.current.innerHTML = "";
      videoRef.current.appendChild(video);
    } else {
      console.error("videoRef is not available.");
      setLoading(false);
      setError("Internal error: Video container not found.");
      return;
    }

    const canvas = document.createElement("canvas");
    if(canvasRef.current) {
      canvasRef.current.innerHTML = "";
      canvasRef.current.appendChild(canvas);
    } else {
      console.error("canvasRef is not available.");
    }


    video.oncanplay = () => {
      console.log("IP camera video is ready to play.");
      setLoading(false);
      setError(""); // Clear error if video loads successfully
    };
    video.onerror = (e) => {
      console.error("Error loading IP camera feed:", e);
      setLoading(false);
      setError("Failed to load IP camera feed. Check URL, network, or CORS.");
    };
    // Start loading the video
    video.load();
    console.log("IP camera video element created and source set.");
  };


  // --- Modified handleLocalCapture ---
  const handleLocalCapture = async () => {
    setError(""); 
    const videoEl = document.querySelector("#html5qr-code video");
    const canvas = canvasRef.current?.querySelector("canvas"); 

    if (!videoEl || !canvas || videoEl.readyState < 2) {
      setError("Camera feed not ready for capture.");
      console.warn("Local video feed not ready for capture. readyState:", videoEl?.readyState);
      return;
    }

    // Draw the current video frame onto the canvas
    const ctx = canvas.getContext("2d");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    setLoading(true);
    try {
      const blob = await canvasToBlob(canvas);
      // Create a File object with a dummy name and type
      const file = new File([blob], 'local_scan_image.png', { type: 'image/png' });
      console.log("Created File object from canvas:", file);

      // Scan the captured image using the File object
      const decodedText = await html5QrCodeRef.current.scanFile(file, true); // Pass the File object
      console.log("Captured image scan success:", decodedText);

      // Stop the live scanner after successful capture-scan
      // Use a small delay if needed, but ideally stop should be immediate
      stopScanner().catch(console.error);

      // Call parent success handler
      onScanSuccess(decodedText);
      // Fetch product details
      fetchProductDetails(decodedText);

    } catch (scanError) {
      console.error("Captured image scan failed:", scanError);
      setError(`No barcode or QR code found in the captured image. Error: ${scanError.message || scanError}`);
      setProductDetails(null); // Clear product details if scan fails
    } finally {
      setLoading(false);
    }
  };

  // --- Modified handleIPCameraScan ---
  const handleIPCameraScan = async () => {
    setError(""); // Clear previous errors
    const videoEl = videoRef.current?.querySelector("video"); // Get the IP camera video element
    const canvas = canvasRef.current?.querySelector("canvas"); // Get the hidden canvas

    // Ensure video and canvas are ready and video has loaded data
    if (!videoEl || !canvas || videoEl.readyState < 2) {
      setError("IP camera feed not ready for scanning. Ensure it is loaded and playing.");
      console.warn("IP video feed not ready for capture. readyState:", videoEl?.readyState);
      return;
    }

    // Draw the current video frame onto the canvas
    const ctx = canvas.getContext("2d");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    setLoading(true); // Show loading while processing and scanning
    try {
      const blob = await canvasToBlob(canvas);
      // Create a File object with a dummy name and type
      const file = new File([blob], 'ip_scan_image.png', { type: 'image/png' });
      console.log("Created File object from canvas:", file);

      // Scan the captured image using the File object
      const decodedText = await html5QrCodeRef.current.scanFile(file, true); // Pass the File object
      console.log("IP camera scan success:", decodedText);
      onScanSuccess(decodedText);
      // Fetch product details
      fetchProductDetails(decodedText);

    } catch (scanError) {
      console.error("IP camera scan failed:", scanError);
      setError(`No barcode or QR code found in the captured image. Error: ${scanError.message || scanError}`);
      setProductDetails(null); // Clear product details if scan fails
    } finally {
      setLoading(false);
    }
  };


  const fetchProductDetails = async (productId) => {
    // IMPORTANT: The backend route /api/products/:productId should return { _id, name, price, quantity, ...other fields }
    try {
      console.log(`Workspaceing product details for ID: ${productId}`); // Corrected console log
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Product not found for ID: ${productId} (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log("Fetched product details successfully:", data);
      setProductDetails(data); // Store all details
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError(`Error fetching product details: ${err.message}`);
      setProductDetails(null); // Clear previous product details on error
    }
  };

  const handleReset = () => {
    console.log("Resetting scanner...");
    setProductDetails(null);
    setCapturedImage(null);
    setError("");
    // Restart the current scanner type
    if (sourceType === "local") {
      startLocalCamera();
    } else if (sourceType === "ip") {
      startIPCamera();
    }
  };

  return (
    <div className="barcode-scanner p-4 max-w-2xl mx-auto bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Barcode Scanner</h2>

      <div className="flex justify-center gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${sourceType === "local" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
          onClick={() => {
            setSourceType("local");
          }}
          disabled={loading}
        >
          Use Local Camera
        </button>
        <button
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${sourceType === "ip" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
          onClick={() => {
            setSourceType("ip");
          }}
          disabled={loading}
        >
          Use IP Camera
        </button>
      </div>

      {loading && <p className="text-center text-blue-600 mb-4">Loading camera...</p>}
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {/* Local Camera Live Feed Container - Adjusted Size */}
      <div
        id="html5qr-code"
        className={`${sourceType === "local" ? "block" : "hidden"} w-full max-w-sm mx-auto border-2 border-gray-300 rounded overflow-hidden shadow-xl bg-white`}
        // Optional: You can add a min-height if the camera takes time to initialize and you don't want the layout to jump
        // style={{ minHeight: '300px' }}
      />

      {/* IP Camera Video Container - Adjusted Size */}
      <div
        ref={videoRef}
        className={`${sourceType === "ip" ? "block" : "hidden"} w-full max-w-sm mx-auto border-2 border-gray-300 rounded overflow-hidden shadow-xl bg-white`}
      >
        {/* The video element will be appended here by startIPCamera */}
      </div>

      {/* Hidden canvas for capturing frames */}
      <div ref={canvasRef} style={{ display: "none" }} />

      {!productDetails && !loading && (
        <div className="flex justify-center mt-4">
          {sourceType === "ip" && (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
              onClick={handleIPCameraScan}
              disabled={loading}
            >
              Scan Current Frame (IP Cam)
            </button>
          )}
        </div>
      )}


      {capturedImage && (
        <div className="mt-4 text-center">
          <p className="font-semibold text-gray-700">Captured Image:</p>
          {/* Increased size of the displayed captured image */}
          <img src={capturedImage} alt="Captured" className="mt-2 w-full max-w-sm mx-auto border rounded shadow" />
        </div>
      )}

      {productDetails && (
        <div className="product-details mt-4 p-4 border rounded-md shadow-lg bg-white">
          <h3 className="text-xl font-bold mb-3 text-gray-800">Product Details</h3>
          <p className="text-gray-700 mb-1"><strong>ID:</strong> {productDetails._id}</p>
          <p className="text-gray-700 mb-1"><strong>Name:</strong> {productDetails.name}</p>
          <p className="text-gray-700 mb-1"><strong>Brand:</strong> {productDetails.brand}</p>
          <p className="text-gray-700 mb-1"><strong>Model:</strong> {productDetails.model}</p>
          <p className="text-gray-700 mb-1"><strong>Part Number:</strong> {productDetails.partNumber || 'N/A'}</p>
          <p className="text-gray-700 mb-1"><strong>Price:</strong> ₹{productDetails.price?.toFixed(2) || '0.00'}</p>
          <p className="text-gray-700 mb-1"><strong>Quantity in Stock:</strong> {productDetails.quantity}</p>
          <p className="text-gray-700"><strong>Description:</strong> {productDetails.description || 'N/A'}</p>

          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors duration-200"
            onClick={handleReset}
          >
            Scan Another Product
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;