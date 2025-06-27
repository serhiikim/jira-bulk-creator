import React, { useRef, useEffect } from 'react';

const FileInput = ({ uploadedFile, setUploadedFile }) => {
    const fileUploadRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const clearFile = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (extension === 'xlsx' || extension === 'xls') {
            return '📊';
        } else if (extension === 'csv') {
            return '📋';
        } else {
            return '📄';
        }
    };

    useEffect(() => {
        const fileUpload = fileUploadRef.current;
        if (fileUpload) {
            const preventDefaults = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            const highlight = () => {
                fileUpload.classList.add('dragover');
            };

            const unhighlight = () => {
                fileUpload.classList.remove('dragover');
            };

            const handleDrop = (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;

                if (files.length > 0) {
                    const file = files[0];
                    const allowedTypes = ['.xlsx', '.xls', '.csv'];
                    const extension = '.' + file.name.split('.').pop().toLowerCase();

                    if (allowedTypes.includes(extension)) {
                        setUploadedFile(file);
                    } else {
                        alert('Please upload only Excel (.xlsx, .xls) or CSV (.csv) files');
                    }
                }
            };

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                fileUpload.addEventListener(eventName, preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                fileUpload.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                fileUpload.addEventListener(eventName, unhighlight, false);
            });

            fileUpload.addEventListener('drop', handleDrop, false);

            return () => {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    fileUpload.removeEventListener(eventName, preventDefaults, false);
                });
                ['dragenter', 'dragover'].forEach(eventName => {
                    fileUpload.removeEventListener(eventName, highlight, false);
                });
                ['dragleave', 'drop'].forEach(eventName => {
                    fileUpload.removeEventListener(eventName, unhighlight, false);
                });
                fileUpload.removeEventListener('drop', handleDrop, false);
            };
        }
    }, [setUploadedFile]);

    return (
        <div className={`input-method-content active`} id="fileInputMethod">
            <div ref={fileUploadRef} className="file-upload" id="fileUpload" onClick={() => fileInputRef.current.click()}>
                <div className="file-upload-icon">📁</div>
                <div className="file-upload-text">Click to upload or drag & drop</div>
                <div className="file-upload-hint">Supported formats: Excel (.xlsx, .xls), CSV (.csv)</div>
            </div>
            <input ref={fileInputRef} type="file" id="fileInput" className="file-input" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />

            {uploadedFile && (
                <div className="file-info">
                    <div className="file-info-content">
                        <div className="file-info-details">
                            <span>{getFileIcon(uploadedFile.name)}</span>
                            <div>
                                <div>{uploadedFile.name}</div>
                                <div style={{ fontSize: '0.9em', color: '#6c757d' }}>{formatFileSize(uploadedFile.size)}</div>
                            </div>
                        </div>
                        <button className="btn btn-small btn-secondary" onClick={clearFile}>Remove</button>
                    </div>
                </div>
            )}

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
