// Access the Material-UI components
const {
    AppBar, Toolbar, Typography, Container, Paper, Button, Stack, Alert, 
    CircularProgress, Box, Card, CardContent, CardActions, Divider, Snackbar
} = MaterialUI;

// PubNub Files API Demo App using React and Material UI
function PubNubFilesApp() {
    // State variables
    const [uploadStatus, setUploadStatus] = React.useState(null);
    const [uploadLoading, setUploadLoading] = React.useState(false);
    const [downloadStatus, setDownloadStatus] = React.useState('Waiting for file...');
    const [downloadLoading, setDownloadLoading] = React.useState(false);
    const [fileContent, setFileContent] = React.useState(null);
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertMessage, setAlertMessage] = React.useState('');
    const [alertSeverity, setAlertSeverity] = React.useState('info');
    
    // PubNub instance and constants
    const pubnub = React.useMemo(() => {
        return new PubNub({
            publishKey: 'demo-36',
            subscribeKey: 'demo-36',
            userId: 'files-demo-user-' + new Date().getTime()
        });
    }, []);
    
    const CHANNEL = 'files-demo-channel';
    
    // Sample JSON data that we'll upload as a file
    const sampleData = {
        title: 'Sample JSON Data',
        items: [
            { id: 1, name: 'Item 1', value: Math.random() * 100 },
            { id: 2, name: 'Item 2', value: Math.random() * 100 },
            { id: 3, name: 'Item 3', value: Math.random() * 100 },
            { id: 4, name: 'Item 4', value: Math.random() * 100, '500kb': 'A'.repeat(500 * 1024) },
        ],
        timestamp: new Date().toISOString(),
        metadata: {
            source: 'PubNub Files API Demo',
            version: '1.0.0'
        }
    };
    
    // Function to download a file using PubNub Files API
    const downloadFile = React.useCallback(async (fileId, fileName) => {
        try {
            setDownloadLoading(true);
            setDownloadStatus('Downloading file...');
            
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
            setDownloadStatus('File downloaded successfully:');
            setFileContent(jsonData);
            
            console.log('File downloaded successfully:', jsonData);
        } catch (error) {
            console.error('Error downloading file:', error);
            setDownloadStatus('Error downloading file: ' + (error.message || JSON.stringify(error)));
        } finally {
            setDownloadLoading(false);
        }
    }, [CHANNEL, pubnub]);
    
    // Setup PubNub subscription on component mount
    React.useEffect(() => {
        // Create a local channel entity and subscription
        const channel = pubnub.channel(CHANNEL);
        const subscription = channel.subscription();
        
        // Add file event listener to subscription
        subscription.onFile = (event) => {
            console.log('File event received:', event);
            
            setDownloadStatus("New file received!\nFile ID: " + event.file.id + "\nFile Name: " + event.file.name + "\nFrom: " + event.publisher);
            
            // Download the file
            downloadFile(event.file.id, event.file.name);
        };
        
        // Subscribe to the channel to receive file notifications
        subscription.subscribe();
        console.log(`Subscribed to ${CHANNEL} for file notifications`);
        
        
        // Cleanup on component unmount
        return () => {
            subscription.unsubscribe();
        };
    }, [CHANNEL, downloadFile, pubnub]);
    
    // Upload JSON data as a file
    const handleUpload = async () => {
        setUploadLoading(true);
        setUploadStatus(null);
        
        try {
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
                    sender: 'files-demo-user'
                }
            });
            
            console.log('File uploaded successfully:', result);
            setUploadStatus({
                success: true,
                id: result.id,
                name: result.name
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus({
                success: false,
                error: error.message || JSON.stringify(error)
            });
        } finally {
            setUploadLoading(false);
        }
    };
    
    // Handle alert close
    const handleAlertClose = () => {
        setAlertOpen(false);
    };
    
    // Render the UI
    return React.createElement(Container, { maxWidth: "md" }, [
        React.createElement(AppBar, { 
            position: "static", 
            color: "primary", 
            elevation: 0, 
            sx: { borderRadius: '4px 4px 0 0', mb: 3 },
            key: "appbar"
        }, 
            React.createElement(Toolbar, { key: "toolbar" }, 
                React.createElement(Typography, { variant: "h6", component: "div", key: "title" }, "PubNub Files API Demo")
            )
        ),
        
        React.createElement(Stack, { spacing: 3, key: "stack" }, [
            // Upload Card
            React.createElement(Card, { elevation: 3, key: "upload-card" }, 
                React.createElement(CardContent, { key: "upload-content" }, [
                    React.createElement(Typography, { variant: "h5", component: "div", gutterBottom: true, key: "upload-title" }, 
                        "Upload JSON Data"
                    ),
                    React.createElement(Typography, { 
                        variant: "body2", 
                        color: "text.secondary", 
                        paragraph: true,
                        key: "upload-desc"
                    }, 
                        "Click the button below to upload a sample JSON object as a file"
                    ),
                    React.createElement(CardActions, { key: "upload-actions" }, 
                        React.createElement(Button, { 
                            variant: "contained", 
                            color: "primary", 
                            onClick: handleUpload,
                            disabled: uploadLoading,
                            startIcon: uploadLoading ? 
                                React.createElement(CircularProgress, { size: 20 }) : 
                                null,
                            key: "upload-button"
                        }, 
                            uploadLoading ? 'Uploading...' : 'Upload JSON Data'
                        )
                    ),
                    
                    uploadStatus && React.createElement(Box, { mt: 2, key: "upload-status" }, 
                        uploadStatus.success ? 
                            React.createElement(Alert, { severity: "success", key: "success-alert" }, [
                                "File uploaded successfully!",
                                React.createElement(Typography, { variant: "body2", key: "id-text" }, 
                                    `File ID: ${uploadStatus.id}`
                                ),
                                React.createElement(Typography, { variant: "body2", key: "name-text" }, 
                                    `File Name: ${uploadStatus.name}`
                                )
                            ]) : 
                            React.createElement(Alert, { severity: "error", key: "error-alert" }, [
                                "Error uploading file:",
                                React.createElement("pre", { 
                                    style: { marginTop: '8px', whiteSpace: 'pre-wrap' },
                                    key: "error-pre" 
                                }, 
                                    uploadStatus.error
                                )
                            ])
                    )
                ])
            ),
            
            // Download Card
            React.createElement(Card, { elevation: 3, key: "download-card" }, 
                React.createElement(CardContent, { key: "download-content" }, [
                    React.createElement(Typography, { variant: "h5", component: "div", gutterBottom: true, key: "download-title" }, 
                        "Downloaded File"
                    ),
                    React.createElement(Typography, { 
                        variant: "body2", 
                        color: "text.secondary", 
                        paragraph: true,
                        key: "download-desc"
                    }, 
                        "When a file is available, it will appear here:"
                    ),
                    
                    React.createElement(Box, { sx: { position: 'relative', minHeight: '50px' }, key: "status-box" }, [
                        downloadLoading && React.createElement(Box, { 
                            sx: { display: 'flex', alignItems: 'center', gap: 2 },
                            key: "loading-box"
                        }, [
                            React.createElement(CircularProgress, { size: 24, key: "spinner" }),
                            React.createElement(Typography, { key: "loading-text" }, downloadStatus)
                        ]),
                        
                        !downloadLoading && React.createElement(Typography, { 
                            variant: "body2", 
                            sx: { whiteSpace: 'pre-line' },
                            key: "status-text"
                        }, 
                            downloadStatus
                        )
                    ]),
                    
                    fileContent && React.createElement(Box, { 
                        mt: 2, 
                        p: 2, 
                        bgcolor: "background.paper", 
                        borderRadius: 1, 
                        border: 1, 
                        borderColor: "divider",
                        key: "content-box"
                    }, 
                        React.createElement("pre", { 
                            style: { margin: 0, overflow: 'auto' },
                            key: "content-pre"
                        }, 
                            JSON.stringify(fileContent, null, 2)
                        )
                    )
                ])
            )
        ]),
        
        React.createElement(Snackbar, { 
            open: alertOpen, 
            autoHideDuration: 6000, 
            onClose: handleAlertClose,
            key: "snackbar"
        }, 
            React.createElement(Alert, { 
                onClose: handleAlertClose, 
                severity: alertSeverity, 
                sx: { width: '100%' },
                key: "alert"
            }, 
                alertMessage
            )
        )
    ]);
}

// Render the React component when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('mui-root');
    ReactDOM.render(React.createElement(PubNubFilesApp), rootElement);
});
