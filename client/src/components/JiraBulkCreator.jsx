import React, { useState, useEffect } from 'react';

const JiraBulkCreator = () => {
    const [parsedTasks, setParsedTasks] = useState([]);
    const [creationLog, setCreationLog] = useState([]);
    const [currentInputMethod, setCurrentInputMethod] = useState('file');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [jiraUrl, setJiraUrl] = useState('');
    const [email, setEmail] = useState('');
    const [projectKey, setProjectKey] = useState('');
    const [issueType, setIssueType] = useState('Task');
    const [inputFormat, setInputFormat] = useState('csv');
    const [taskData, setTaskData] = useState('');
    const [showPreviewSection, setShowPreviewSection] = useState(false);
    const [showProgressSection, setShowProgressSection] = useState(false);
    const [progressFillWidth, setProgressFillWidth] = useState('0%');
    const [progressText, setProgressText] = useState('Ready to start...');

    useEffect(() => {
        // Load saved configuration
        const savedConfig = localStorage.getItem('jiraConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            setJiraUrl(config.jiraUrl || '');
            setEmail(config.email || '');
            setProjectKey(config.projectKey || '');
            setIssueType(config.issueType || 'Task');
        }

        // Setup drag and drop
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) {
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
        }

        return () => {
            // Cleanup event listeners
            if (fileUpload) {
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
            }
        };
    }, []);

    useEffect(() => {
        // Save configuration on change
        const config = { jiraUrl, email, projectKey, issueType };
        localStorage.setItem('jiraConfig', JSON.stringify(config));
    }, [jiraUrl, email, projectKey, issueType]);

    useEffect(() => {
        updateParseButtonState();
    }, [uploadedFile, taskData, currentInputMethod]);

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const highlight = () => {
        document.getElementById('fileUpload')?.classList.add('dragover');
    };

    const unhighlight = () => {
        document.getElementById('fileUpload')?.classList.remove('dragover');
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
                showFileInfo(file);
            } else {
                alert('Please upload only Excel (.xlsx, .xls) or CSV (.csv) files');
            }
        }
    };

    const switchInputMethod = (method) => {
        setCurrentInputMethod(method);
    };

    const updateParseButtonState = () => {
        const parseBtn = document.getElementById('parseBtn');
        if (parseBtn) {
            if (currentInputMethod === 'file') {
                parseBtn.disabled = !uploadedFile;
            } else {
                parseBtn.disabled = !taskData.trim();
            }
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
            showFileInfo(file);
        }
    };

    const showFileInfo = (file) => {
        const fileInfo = document.getElementById('fileInfo');
        const fileNameElem = document.getElementById('fileName');
        const fileSizeElem = document.getElementById('fileSize');
        const fileIconElem = document.getElementById('fileIcon');

        if (fileNameElem) fileNameElem.textContent = file.name;
        if (fileSizeElem) fileSizeElem.textContent = formatFileSize(file.size);

        const extension = file.name.split('.').pop().toLowerCase();
        if (fileIconElem) {
            if (extension === 'xlsx' || extension === 'xls') {
                fileIconElem.textContent = '📊';
            } else if (extension === 'csv') {
                fileIconElem.textContent = '📋';
            } else {
                fileIconElem.textContent = '📄';
            }
        }

        if (fileInfo) fileInfo.style.display = 'block';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const clearFile = () => {
        setUploadedFile(null);
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
    };

    const toggleInputFormat = (e) => {
        setInputFormat(e.target.value);
    };

    const parseData = async () => {
        try {
            if (currentInputMethod === 'file' && uploadedFile) {
                await parseFileData();
            } else if (currentInputMethod === 'manual') {
                parseManualData();
            }
            setShowPreviewSection(true);
        } catch (error) {
            alert('Error parsing data: ' + error.message);
        }
    };

    const parseFileData = async () => {
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const response = await fetch('/api/upload-tasks', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        setParsedTasks(result.tasks);
        addLog(`📁 Loaded ${result.totalTasks} tasks from ${result.filename}`, 'info');
    };

    const parseManualData = () => {
        if (!taskData.trim()) {
            throw new Error('Please enter task data');
        }

        if (inputFormat === 'csv') {
            setParsedTasks(parseCSV(taskData));
        } else {
            setParsedTasks(JSON.parse(taskData));
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').filter(line => line.trim());
        const tasks = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length >= 2) {
                tasks.push({
                    taskName: values[0],
                    epicLink: values[1],
                    minEstimate: parseInt(values[2]) || 0,
                    maxEstimate: parseInt(values[3]) || 0
                });
            }
        }
        return tasks;
    };

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const createTasks = async () => {
        if (!jiraUrl || !email || !projectKey) {
            alert('Please fill in all Jira configuration fields');
            return;
        }

        setShowProgressSection(true);
        setCreationLog([]);
        let successCount = 0;
        let errorCount = 0;

        const config = {
            jiraUrl,
            email,
            projectKey,
            issueType
        };

        try {
            const response = await fetch('/api/create-tasks-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: config,
                    tasks: parsedTasks
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'processing') {
                                const progress = (data.current / data.total) * 100;
                                setProgressFillWidth(progress + '%');
                                setProgressText(`Processing ${data.current} of ${data.total}: ${data.taskName}`);
                                addLog(`🔄 Processing: ${data.taskName}`, 'info');
                            } else if (data.type === 'success') {
                                successCount++;
                                const progress = (data.current / data.total) * 100;
                                setProgressFillWidth(progress + '%');

                                // Update status in preview table
                                const updatedTasks = [...parsedTasks];
                                updatedTasks[data.index] = {
                                    ...updatedTasks[data.index],
                                    status: 'success',
                                    jiraUrl: data.jiraUrl
                                };
                                setParsedTasks(updatedTasks);

                                addLog(`✅ Created: ${data.taskName} (${data.jiraKey})`, 'success');
                            } else if (data.type === 'error') {
                                errorCount++;
                                const progress = (data.current / data.total) * 100;
                                setProgressFillWidth(progress + '%');

                                // Update status in preview table
                                const updatedTasks = [...parsedTasks];
                                updatedTasks[data.index] = {
                                    ...updatedTasks[data.index],
                                    status: 'error'
                                };
                                setParsedTasks(updatedTasks);

                                addLog(`❌ Failed: ${data.taskName} - ${JSON.stringify(data.error)}`, 'error');
                            } else if (data.type === 'complete') {
                                setProgressText(`Completed! Success: ${data.successCount}, Errors: ${data.errorCount}`);
                                addLog(`🎉 Process completed! ${data.successCount} tasks created, ${data.errorCount} errors`, 'info');
                            } else if (data.type === 'fatal_error') {
                                addLog(`💥 Fatal error: ${data.message}`, 'error');
                                setProgressText('Process failed due to fatal error');
                            }
                        } catch (parseError) {
                            console.error('Error parsing SSE data:', parseError);
                        }
                    }
                }
            }
        } catch (error) {
            addLog(`💥 Connection error: ${error.message}`, 'error');
            setProgressText('Process failed due to connection error');
        }
    };

    const addLog = (message, type = 'info') => {
        setCreationLog(prevLog => [
            ...prevLog,
            {
                timestamp: new Date().toISOString(),
                message: message,
                type: type
            }
        ]);
    };

    const downloadJSON = () => {
        const data = {
            tasks: parsedTasks,
            log: creationLog,
            summary: {
                totalTasks: parsedTasks.length,
                createdAt: new Date().toISOString()
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jira-tasks-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container">
            <div className="header">
                <h1>🚀 Jira Bulk Task Creator</h1>
                <p>Create multiple Jira tasks from Excel/CSV/JSON data with ease</p>
            </div>

            <div className="content">
                {/* Configuration Section */}
                <div className="config-section">
                    <h2 className="section-title">⚙️ Jira Configuration</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="jiraUrl">Jira URL</label>
                            <input
                                type="text"
                                id="jiraUrl"
                                placeholder="https://your-domain.atlassian.net"
                                value={jiraUrl}
                                onChange={(e) => setJiraUrl(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="your.email@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="projectKey">Project Key</label>
                            <input
                                type="text"
                                id="projectKey"
                                placeholder="PROJ"
                                value={projectKey}
                                onChange={(e) => setProjectKey(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="issueType">Issue Type</label>
                            <select
                                id="issueType"
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                            >
                                <option value="Task">Task</option>
                                <option value="Story">Story</option>
                                <option value="Bug">Bug</option>
                                <option value="Epic">Epic</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="input-section">
                    <h2 className="section-title">📋 Task Data</h2>

                    {/* Input Method Tabs */}
                    <div className="input-method-tabs">
                        <button
                            className={`input-method-tab ${currentInputMethod === 'file' ? 'active' : ''}`}
                            onClick={() => switchInputMethod('file')}
                        >
                            📄 Upload File
                        </button>
                        <button
                            className={`input-method-tab ${currentInputMethod === 'manual' ? 'active' : ''}`}
                            onClick={() => switchInputMethod('manual')}
                        >
                            ✏️ Manual Input
                        </button>
                    </div>

                    {/* File Upload Method */}
                    <div className={`input-method-content ${currentInputMethod === 'file' ? 'active' : ''}`} id="fileInputMethod">
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

                    {/* Manual Input Method */}
                    <div className={`input-method-content ${currentInputMethod === 'manual' ? 'active' : ''}`} id="manualInputMethod">
                        <div className="form-group">
                            <label htmlFor="inputFormat">Input Format</label>
                            <select id="inputFormat" value={inputFormat} onChange={toggleInputFormat}>
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="taskData">Task Data</label>
                            <textarea
                                id="taskData"
                                placeholder="Enter your task data here..."
                                value={taskData}
                                onChange={(e) => setTaskData(e.target.value)}
                            ></textarea>
                        </div>

                        <div className={`example ${inputFormat === 'csv' ? '' : 'hidden'}`} id="csvExample">
                            <h4>CSV Format Example:</h4>
                            <pre>Task Name,Epic Link,Min Estimate,Max Estimate
"Setup Laravel Project","PROJ-100",2,4
"Create User Model","PROJ-100",1,3
"Documentation Task","PROJ-101",,</pre>
                            <p><small>Note: Min/Max estimates are optional. Leave empty if not needed.</small></p>
                        </div>

                        <div className={`example ${inputFormat === 'json' ? '' : 'hidden'}`} id="jsonExample">
                            <h4>JSON Format Example:</h4>
                            <pre>{
`[
  {
    "taskName": "Setup Laravel Project",
    "epicLink": "PROJ-100"
  },
  {
    "taskName": "Documentation Task",
    "epicLink": "PROJ-100"
  }
]`
                            }</pre>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <button className="btn" id="parseBtn" onClick={parseData}>
                            📊 Parse & Preview
                        </button>
                    </div>
                </div>

                {/* Preview Section */}
                <div className={`preview-section ${showPreviewSection ? '' : 'hidden'}`} id="previewSection">
                    <h2 className="section-title">👀 Preview Tasks</h2>
                    <div id="taskPreview">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Epic Link</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedTasks.map((task, index) => (
                                    <tr key={index} id={`task-${index}`}>
                                        <td>{task.taskName}</td>
                                        <td>{task.epicLink || '-'}</td>
                                        <td>
                                            <span className={`status status-${task.status || 'pending'}`}>
                                                {task.status === 'success' ? (
                                                    <a href={task.jiraUrl} target="_blank" rel="noopener noreferrer">Created</a>
                                                ) : (
                                                    task.status === 'error' ? 'Error' : 'Pending'
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="form-row" style={{ marginTop: '20px' }}>
                        <button className="btn btn-success" onClick={createTasks}>
                            🚀 Create Tasks in Jira
                        </button>
                        <button className="btn btn-secondary" onClick={downloadJSON}>
                            💾 Download JSON
                        </button>
                    </div>
                </div>

                {/* Progress Section */}
                <div className={`preview-section ${showProgressSection ? '' : 'hidden'}`} id="progressSection">
                    <h2 className="section-title">⏳ Creation Progress</h2>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: progressFillWidth }}></div>
                    </div>
                    <div id="progressText">{progressText}</div>
                    <div className="log" id="log">
                        {creationLog.map((entry, index) => (
                            <div key={index} className={`log-entry log-${entry.type}`}>
                                [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JiraBulkCreator;
