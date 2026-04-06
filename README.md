# 🐾 PetDx - AI-Powered Pet Disease & Breed Identification

**PetDx** is a smart mobile application that helps pet owners identify their pet's breed and detect common skin diseases using artificial intelligence. Built with **React Native (Expo)**, it runs only on Android. The app also provides a veterinary locator, an AI chatbot, and an offline knowledge base to support pet health decisions.


---

## 📱 Features

| Feature | Description |
|---------|-------------|
| 🔬 **AI Disease Detection** | Scans pet photos to classify 10 skin disease/health classes (dogs & cats) |
| 🐕 **Breed Identification** | Identifies 10 dog & cat breeds from images |
| 📸 **Camera / Gallery Support** | Take a photo or upload from gallery |
| 📊 **Scan History** | Stores all previous scans with results and confidence scores |
| 🗺️ **Vet Locator** | Finds nearby veterinary clinics using Google Places API |
| 🤖 **AI Chatbot** | Answers pet-related questions via Google Gemini API |
| 📚 **Offline Knowledge Base** | Breed & disease information available without internet |
| 👤 **User Profile** | Secure authentication (Firebase) and profile management |
| 🎨 **Clean UI** | Built with React Native Paper – intuitive and responsive |

---

## 🧠 AI Models

### Disease Detection Model
- **Architecture:** MobileNetV2 (Transfer Learning)
- **Classes:** 10 (Demodicosis, Dermatitis, Fungal Infections, Hypersensitivity, Ringworm, Flea Allergy, Scabies, Healthy Cat, Healthy Dog)
- **Explainability:** Grad-CAM heatmaps highlight affected areas
- **Format:** TensorFlow Lite (on-device inference)

### Breed Identification Model
- **Architecture:** EfficientNetB0 (Transfer Learning)
- **Classes:** 10 breeds (Abyssinian, Birman, Persian, Ragdoll, Siamese, American Bulldog, Boxer, German Shorthaired, Pomeranian, Pug)
- **Format:** TensorFlow Lite

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React Native (Expo) + TypeScript |
| UI Library | React Native Paper |
| Navigation | React Navigation |
| Backend | Flask (Python) |
| Database | MongoDB Compass + Firebase (auth/cloud) |
| ML Framework | TensorFlow / Keras → TFLite |
| APIs | Google Places API, Google Gemini API |
| Version Control | GitHub |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android/iOS emulator or physical device with Expo Go app

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/PetDx.git
   cd PetDx

2. **Install dependencies**
   ```bash
   npm install

3. **Run Backend**
   ```bash
   cd PetDx
   py -3.11 -m venv venv
   venv\Scripts\activate
   python app.py

4. **Run Frontend**
   ```bash
   npx expo start

---

## 🔮 Future Enhancements
- **Support for more breeds and diseases (expand dataset)**
- **Real-time video analysis**
- **Veterinary appointment booking integration**
- **Cloud-based model updates (without app update)**
- **Multi-language support**

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact
- Your Name – prasankamadushan0@gmail.com
- GitHub - @Prasanka-Madhushan

## 🙏 Acknowledgements
- **Kaggle for datasets**
- **Google for Places API, Gemini API**
- **TensorFlow team for TFLite**
- **Expo team for the amazing framework**
