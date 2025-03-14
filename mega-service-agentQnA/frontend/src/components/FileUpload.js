import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const handleFileChange = (e) => {
    // Filter for PDF files only
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === 'application/pdf'
    );
    setFiles(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadStatus({
        success: true,
        message: `Successfully uploaded ${result.uploaded_files.length} files.`
      });
      setFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus({
        success: false,
        message: 'Failed to upload files. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="upload-instructions">
        <h2>Upload Documents</h2>
        <p>Upload PDF documents to enhance the agent's knowledge base.</p>
        <ul>
          <li>Maximum file size: 10MB per document</li>
          <li>Supported format: PDF only</li>
        </ul>
      </div>

      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-container">
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept=".pdf"
            id="file-input"
            disabled={uploading}
          />
          <label htmlFor="file-input" className={uploading ? 'disabled' : ''}>
            {uploading ? 'Uploading...' : 'Select PDF Files'}
          </label>
        </div>

        {files.length > 0 && (
          <div className="selected-files">
            <h3>Selected Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
            {uploadStatus.message}
          </div>
        )}

        <button 
          type="submit" 
          className="upload-button" 
          disabled={uploading || files.length === 0}
        >
          {uploading ? 'Uploading...' : 'Upload Documents'}
        </button>
      </form>
    </div>
  );
}

export default FileUpload;
