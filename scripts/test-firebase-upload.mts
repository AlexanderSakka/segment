import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const firebaseConfig = {
  apiKey: "AIzaSyD5VSb6H9rsiUBeSZmF2uW5TjSC5-dAJvY",
  authDomain: "pixar-7765f.firebaseapp.com",
  projectId: "pixar-7765f",
  storageBucket: "pixar-7765f.firebasestorage.app",
  messagingSenderId: "595724156959",
  appId: "1:595724156959:web:1898c28ef5941a6321552a",
  measurementId: "G-WP1T7M7WEH"
};

async function testUpload() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  
  try {
    const imagePath = '/Users/alexanderburum-auensen/Downloads/1.jpg';
    console.log('Reading image from:', imagePath);
    
    const imageBuffer = readFileSync(imagePath);
    
    // Simplified path for testing
    const storageRef = ref(storage, 'test.jpg');
    
    console.log('Starting upload to Firebase Storage...');
    console.log('Using bucket:', storage.app.options.storageBucket); // Debug line
    
    const snapshot = await uploadBytes(storageRef, imageBuffer);
    console.log('Upload completed! File path:', snapshot.metadata.fullPath);
    
    const url = await getDownloadURL(snapshot.ref);
    console.log('✅ Success! File available at:', url);
    
    return url;
  } catch (error) {
    console.error('❌ Error in test upload:', error);
    if (error instanceof Error) {
      console.error('Storage bucket:', storage.app.options.storageBucket);
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
}

// Run the test with better error handling
testUpload()
  .then(url => {
    console.log('🎉 Test completed successfully!');
    console.log('You can verify the upload by visiting the Firebase Console:');
    console.log('https://console.firebase.google.com/project/pixar-7765f/storage/pixar-7765f.appspot.com/files');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 