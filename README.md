# PubNub Files API Demo with Material-UI

This application demonstrates how to use the PubNub Files API with SDK version 9.5.2 to upload an in-memory JSON object as a file and receive notifications to download the file once it's ready. The UI is built using Material-UI for a modern, professional look.

## Features

- Uses the latest PubNub JavaScript SDK 9.5.2
- Uploads an in-memory JSON object as a file
- Receives file upload notifications in real-time
- Downloads and displays the JSON file content

## Setup Instructions

1. Replace the placeholder PubNub keys in `app.js`:
   ```javascript
   const pubnub = new PubNub({
       publishKey: 'YOUR_PUBLISH_KEY',
       subscribeKey: 'YOUR_SUBSCRIBE_KEY',
       userId: 'files-demo-user-' + new Date().getTime()
   });
   ```

2. Enable the "Files" add-on in your PubNub Admin Portal for your keyset

3. Open `index.html` in a web browser

## How It Works

1. **Initialization**:
   - The app initializes PubNub with your keys
   - Creates a subscription to a channel for file events

2. **File Upload**:
   - When you click the "Upload JSON Data" button, the app:
     - Creates an in-memory JSON object
     - Converts it to a Blob and then to a File object
     - Uploads it using `pubnub.sendFile()`
     - The SDK handles both the file upload to storage and the file message publication

3. **File Notification**:
   - The app listens for file events on the channel via `subscription.onFile`
   - When a file upload is detected, event details are displayed

4. **File Download**:
   - When a file notification is received, the app automatically:
     - Downloads the file using `pubnub.downloadFile()`
     - Converts the file content to a string and parses it as JSON
     - Displays the content on the screen

## Key Code Sections

### Uploading JSON File

```javascript
// Convert JSON to string and then to Blob (in-memory file)
const jsonString = JSON.stringify(sampleData, null, 2);
const jsonBlob = new Blob([jsonString], { type: 'application/json' });

// Create a File object from the Blob
const jsonFile = new File([jsonBlob], 'sample-data.json', { 
    type: 'application/json',
    lastModified: new Date().getTime()
});

// Upload file using PubNub Files API
const result = await pubnub.sendFile({
    channel: CHANNEL,
    file: jsonFile,
    message: {
        text: 'Sample JSON data file',
        sender: pubnub.getUUID()
    }
});
```

### Listening for File Events

```javascript
// Add file event listener to subscription
subscription.onFile = (event) => {
    console.log('File event received:', event);
    
    downloadStatus.innerHTML = `
        <p>New file received!</p>
        <p><strong>File ID:</strong> ${event.file.id}</p>
        <p><strong>File Name:</strong> ${event.file.name}</p>
        <p><strong>From:</strong> ${event.publisher}</p>
    `;
    
    // Download the file
    downloadFile(event.file.id, event.file.name);
};
```

### Downloading and Displaying File

```javascript
// Download the file
const file = await pubnub.downloadFile({
    channel: CHANNEL,
    id: fileId,
    name: fileName
});

// Convert file to JSON
const jsonText = await file.toString();
const jsonData = JSON.parse(jsonText);

// Display file content
downloadStatus.textContent = 'File downloaded successfully:';
fileContent.innerHTML = `<pre>${JSON.stringify(jsonData, null, 2)}</pre>`;
```