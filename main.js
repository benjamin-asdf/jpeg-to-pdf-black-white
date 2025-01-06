const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { PDFDocument } = require('pdf-lib');

async function processImage(inputPath) {
    try {
        // Load the image
        const image = await loadImage(inputPath);
        
        // Create canvas with image dimensions
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        
        // Draw image to canvas
        ctx.drawImage(image, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            // Calculate grayscale value
            const grayScale = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // If pixel is light gray (above threshold), make it white
            if (grayScale > 240) {  // Adjustable threshold
                data[i] = 255;     // Red
                data[i + 1] = 255; // Green
                data[i + 2] = 255; // Blue
            }
            
            // Enhance contrast for darker pixels
            else {
                const contrast = 1.2; // Adjustable contrast factor
                data[i] = Math.min(255, data[i] * contrast);
                data[i + 1] = Math.min(255, data[i + 1] * contrast);
                data[i + 2] = Math.min(255, data[i + 2] * contrast);
            }
        }
        
        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Create PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([canvas.width, canvas.height]);
        
        // Convert canvas to buffer
        const processedImageBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
        
        // Embed the image in PDF
        const embeddedImage = await pdfDoc.embedJpg(processedImageBuffer);
        page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
        });
        
        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const outputPath = path.join(
            path.dirname(inputPath),
            `${path.basename(inputPath, path.extname(inputPath))}_processed.pdf`
        );
        
        fs.writeFileSync(outputPath, pdfBytes);
        console.log(`Processed PDF saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error processing image:', error);
        process.exit(1);
    }
}

// Get input file path from command line arguments
const inputPath = process.argv[2];

if (!inputPath) {
    console.error('Please provide an input image path');
    console.log('Usage: node script.js <input-image-path>');
    process.exit(1);
}

if (!fs.existsSync(inputPath)) {
    console.error('Input file does not exist:', inputPath);
    process.exit(1);
}

// Process the image
processImage(inputPath);
