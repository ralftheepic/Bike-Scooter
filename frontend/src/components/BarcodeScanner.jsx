import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  const [sourceType, setSourceType] = useState("ip"); // "local" or "ip"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [productDetails, setProductDetails] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const ipCameraUrl = "http://192.168.0.103:8080/photo.jpg"; // Customize as needed

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("html5qr-code");
    html5QrCodeRef.current = html5QrCode;

    return () => {
      if (html5QrCodeRef.current && typeof html5QrCodeRef.current.clear === 'function') {
        const result = html5QrCodeRef.current.clear();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {});
        }
      }
    };
  }, []);

  useEffect(() => {
    if (sourceType === "local") {
      startLocalCamera();
    } else if (sourceType === "ip") {
      startIPCamera();
    }

    return () => {
      stopScanner();
    };
  }, [sourceType]);

  const stopScanner = () => {
    Html5Qrcode.getCameras().then(cameras => {
      if (cameras.length > 0 && html5QrCodeRef.current) {
        const stopResult = html5QrCodeRef.current.stop();
        if (stopResult && typeof stopResult.catch === 'function') {
          stopResult.catch(() => {});
        }
      }
    });
  };

  const startLocalCamera = async () => {
    setLoading(true);
    setError("");
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length) {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            html5QrCodeRef.current.stop().catch(() => {});
            onScanSuccess(decodedText);
            fetchProductDetails(decodedText);
          },
          (err) => {}
        );
      } else {
        setError("No cameras found on this device.");
      }
    } catch (err) {
      setError("Failed to access local camera.");
    }
    setLoading(false);
  };

  const startIPCamera = () => {
    setLoading(true);
    setError("");

    const video = document.createElement("video");
    video.src = ipCameraUrl;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.style.width = "100%";

    videoRef.current.innerHTML = "";
    videoRef.current.appendChild(video);

    const canvas = document.createElement("canvas");
    canvasRef.current.innerHTML = "";
    canvasRef.current.appendChild(canvas);

    setLoading(false);
  };

  const handleIPCameraScan = () => {
    const videoEl = videoRef.current?.querySelector("video");
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!videoEl || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");

    html5QrCodeRef.current
      .scanFile(imageData, true)
      .then((decodedText) => {
        onScanSuccess(decodedText);
        fetchProductDetails(decodedText);
      })
      .catch(() => {
        setError("No QR code found. Try again.");
      });
  };

  const handleLocalCapture = () => {
    const videoEl = document.querySelector("video");
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!videoEl || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
  };

  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      const data = await response.json();
      setProductDetails(data);
      setError("");
    } catch (err) {
      setError("Error fetching product details.");
    }
  };

  const handleReset = () => {
    setProductDetails(null);
    setCapturedImage(null);
    setError("");
    if (sourceType === "local") {
      startLocalCamera();
    }
  };

  return (
    <div className="barcode-scanner">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${sourceType === "local" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => {
            stopScanner();
            setProductDetails(null);
            setCapturedImage(null);
            setSourceType("local");
          }}
        >
          Use Local Camera
        </button>
        <button
          className={`px-4 py-2 rounded ${sourceType === "ip" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => {
            stopScanner();
            setProductDetails(null);
            setCapturedImage(null);
            setSourceType("ip");
          }}
        >
          Use IP Camera
        </button>
      </div>

      {loading && <p className="text-blue-500">Loading camera...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div id="html5qr-code" className={`${sourceType === "local" ? "block" : "hidden"}`} />
      <div ref={videoRef} className={`${sourceType === "ip" ? "block" : "hidden"}`} />
      <div ref={canvasRef} style={{ display: "none" }} />

      {sourceType === "ip" && !productDetails && (
        <button
          className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
          onClick={handleIPCameraScan}
        >
          Scan Barcode Now
        </button>
      )}

      {sourceType === "local" && !productDetails && (
        <button
          className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
          onClick={handleLocalCapture}
        >
          Capture Photo
        </button>
      )}

      {capturedImage && (
        <div className="mt-4">
          <p className="font-semibold">Captured Image:</p>
          <img src={capturedImage} alt="Captured" className="mt-2 w-64 border rounded" />
        </div>
      )}

      {productDetails && (
        <div className="product-details mt-4">
          <h3 className="text-xl font-semibold mb-2">Product Details</h3>
          <p><strong>Name:</strong> {productDetails.name}</p>
          <p><strong>Brand:</strong> {productDetails.brand}</p>
          <p><strong>Model:</strong> {productDetails.model}</p>
          <p><strong>Price:</strong> ${productDetails.price}</p>
          <p><strong>Quantity:</strong> {productDetails.quantity}</p>
          <p><strong>Description:</strong> {productDetails.description}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
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
