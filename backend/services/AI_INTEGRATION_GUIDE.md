# Dental X-ray AI Integration Guide

## Current Status
The system has a **framework ready** for AI X-ray analysis. Currently, it returns placeholder/demo results.

## How to Integrate a Real AI Model

### Option 1: TensorFlow.js (Browser-based)
**Best for:** Quick integration, no server-side processing needed

```javascript
// Install: npm install @tensorflow/tfjs
const tf = require('@tensorflow/tfjs-node');

async function loadModel() {
  const model = await tf.loadLayersModel('file://./models/dental-xray-model/model.json');
  return model;
}

async function predictFromImage(imageDataUrl) {
  const model = await loadModel();
  // Preprocess image
  const tensor = preprocessImage(imageDataUrl);
  // Make prediction
  const predictions = await model.predict(tensor);
  return predictions;
}
```

### Option 2: Python AI Service (Recommended for Production)
**Best for:** Using advanced models like PyTorch, Keras

#### Step 1: Create Python Flask/FastAPI Service

```python
# dental_ai_service.py
from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
import base64
from PIL import Image
import io

app = Flask(__name__)

# Load your trained model
model = keras.models.load_model('dental_xray_model.h5')

@app.route('/analyze', methods=['POST'])
def analyze_xray():
    data = request.json
    image_data = data['imageDataUrl']
    
    # Decode base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(image_bytes))
    
    # Preprocess
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    
    # Predict
    predictions = model.predict(image_array)
    
    # Process results
    findings = process_predictions(predictions)
    
    return jsonify({
        'success': True,
        'findings': findings,
        'confidence': float(np.max(predictions))
    })

if __name__ == '__main__':
    app.run(port=5001)
```

#### Step 2: Update Node.js to call Python service

```javascript
// In xrayAnalyzer.js
async function performAnalysis(imageDataUrl, xrayType) {
  const response = await fetch('http://localhost:5001/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl, xrayType })
  });
  
  return await response.json();
}
```

### Option 3: Cloud AI Services

#### Google Cloud Vision API
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

async function analyzeWithGoogleVision(imageDataUrl) {
  const [result] = await client.labelDetection(imageDataUrl);
  return result.labelAnnotations;
}
```

#### AWS Rekognition
```javascript
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition();

async function analyzeWithAWS(imageBuffer) {
  const params = {
    Image: { Bytes: imageBuffer },
    Features: ['LABELS', 'TEXT']
  };
  return await rekognition.detectLabels(params).promise();
}
```

## Training Your Own Model

### Dataset Requirements
- **Minimum:** 1,000 labeled dental X-rays
- **Recommended:** 10,000+ images
- **Categories:** Cavity, Fracture, Root Canal, Healthy, etc.

### Recommended Architectures
1. **ResNet50** - Good for general classification
2. **DenseNet121** - Better for medical images
3. **EfficientNet** - Best accuracy/speed trade-off
4. **U-Net** - For segmentation tasks

### Training Pipeline (Python/TensorFlow)

```python
import tensorflow as tf
from tensorflow.keras.applications import DenseNet121
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Load pre-trained model
base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Add custom layers
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
predictions = Dense(8, activation='softmax')(x)  # 8 dental conditions

model = Model(inputs=base_model.input, outputs=predictions)

# Compile
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train
model.fit(
    train_generator,
    epochs=50,
    validation_data=val_generator
)

# Save
model.save('dental_xray_model.h5')
```

## Pre-trained Models Available

### 1. CheXNet (Chest X-ray)
- Can be adapted for dental X-rays
- GitHub: https://github.com/arnoweng/CheXNet

### 2. Dental AI Models
- **Teeth Detection:** https://github.com/IvisionLab/dental-image
- **Cavity Detection:** Search for "dental cavity detection CNN" on GitHub

## Integration Checklist

- [ ] Choose AI approach (TensorFlow.js, Python service, or Cloud API)
- [ ] Obtain or train dental X-ray model
- [ ] Update `performAnalysis()` in `xrayAnalyzer.js`
- [ ] Test with various X-ray types
- [ ] Add error handling
- [ ] Implement confidence thresholds
- [ ] Add disclaimer about AI limitations
- [ ] Get medical professional validation

## Important Notes

⚠️ **Medical Disclaimer:**
- AI analysis is for **assistance only**
- Always require professional verification
- Include disclaimers in UI
- Follow medical device regulations in your region

🔒 **Privacy & Security:**
- Encrypt X-ray data in transit and at rest
- Comply with HIPAA/GDPR regulations
- Don't store X-rays longer than necessary
- Use secure API endpoints

## Next Steps

1. **For Testing:** Current placeholder works fine
2. **For Production:** Integrate one of the options above
3. **For Custom Model:** Collect dataset and train
4. **For Quick Start:** Use Google Cloud Vision API

## Support

For questions about AI integration:
- TensorFlow: https://www.tensorflow.org/js
- PyTorch: https://pytorch.org/
- Medical AI: https://github.com/topics/medical-imaging
