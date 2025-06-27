import React from 'react';

const FileInput = ({ uploadedFile, handleFileUpload, clearFile, showFileInfo, formatFileSize }) => {
    return (
        <div className={`input-method-content active`} id="fileInputMethod">
            <div className="file-upload" id="fileUpload" onClick={() => document.getElementById('fileInput').click()}>
                <div className="file-upload-icon">📁</div>
                <div className="file-upload-text">Click to upload or drag & drop</div>
                <div className="file-upload-hint">Supported formats: Excel (.xlsx, .xls), CSV (.csv)</div>
            </div>
            <input type="file" id="fileInput" className="file-input" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />

            <div className="file-info" id="fileInfo" style={{ display: uploadedFile ? 'block' : 'none' }}>
                <div className="file-info-content">
                    <div className="file-info-details">
                        <span id="fileIcon">📄</span>
                        <div>
                            <div id="fileName"></div>
                            <div id="fileSize" style={{ fontSize: '0.9em', color: '#6c757d' }}></div>
                        </div>
                    </div>
                    <button className="btn btn-small btn-secondary" onClick={clearFile}>Remove</button>
                </div>
            </div>

            <div className="example">
                <h4>Expected File Format:</h4>
                <p><strong>Column A:</strong> Task Name (required)</p>
                <p><strong>Column B:</strong> Epic Link URL or Key (optional)</p>
                <p><strong>Columns C-F:</strong> Additional data (optional)</p>
                <p><small>The first row will be treated as headers and skipped.</small></p>
            </div>
        </div>
    );
};

export default FileInput;
