const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const pinataSDK = require('@pinata/sdk'); // Correct import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Pinata
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

// Middleware
app.use(cors({
    origin: 'https://securemediawithnft.netlify.app', // Replace with your actual frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Setup multer for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to upload metadata to Pinata
app.post('/upload-metadata', async (req, res) => {
    const metadata = req.body;

    if (!metadata) {
        return res.status(400).json({ error: 'No metadata provided.' });
    }
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        res.json({ ipfsHash: response.IpfsHash });
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);
        res.status(500).json({ error: 'Failed to upload metadata to Pinata.' });
    }
});

// Endpoint to upload SVG files to Pinata
app.post('/upload-svg', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const readableStreamForFile = file.buffer; // Buffer is acceptable
        const options = {
            pinataMetadata: {
                name: file.originalname,
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        const response = await pinata.pinFileToIPFS(readableStreamForFile, options);
        res.json({ ipfsHash: response.IpfsHash });
    } catch (error) {
        console.error('Error uploading SVG to Pinata:', error);
        res.status(500).json({ error: 'Failed to upload SVG to Pinata.' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.message);
    res.status(500).json({ error: err.message });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
