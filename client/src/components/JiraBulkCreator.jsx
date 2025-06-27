import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ConfigurationSection from './bulk-creator/ConfigurationSection';
import InputSection from './bulk-creator/InputSection';
import PreviewSection from './bulk-creator/PreviewSection';
import ProgressSection from './bulk-creator/ProgressSection';

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
    }, []);

    useEffect(() => {
        // Save configuration on change
        const config = { jiraUrl, email, projectKey, issueType };
        localStorage.setItem('jiraConfig', JSON.stringify(config));
    }, [jiraUrl, email, projectKey, issueType]);

    const switchInputMethod = (method) => {
        setCurrentInputMethod(method);
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
            const result = Papa.parse(taskData, { header: true });
            const tasks = result.data.map(row => ({
                taskName: row['Task Name'],
                epicLink: row['Epic Link'],
                minEstimate: parseInt(row['Min Estimate']) || 0,
                maxEstimate: parseInt(row['Max Estimate']) || 0,
            }));
            setParsedTasks(tasks);
        } else {
            setParsedTasks(JSON.parse(taskData));
        }
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
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const isParseButtonDisabled = currentInputMethod === 'file' ? !uploadedFile : !taskData.trim();

    return (
        <div className="container">
            <div className="header">
                <h1>🚀 Jira Bulk Task Creator</h1>
                <p>Create multiple Jira tasks from Excel/CSV/JSON data with ease</p>
            </div>

            <div className="content">
                <ConfigurationSection 
                    jiraUrl={jiraUrl} 
                    setJiraUrl={setJiraUrl} 
                    email={email} 
                    setEmail={setEmail} 
                    projectKey={projectKey} 
                    setProjectKey={setProjectKey} 
                    issueType={issueType} 
                    setIssueType={setIssueType} 
                />

                <InputSection 
                    currentInputMethod={currentInputMethod} 
                    switchInputMethod={switchInputMethod} 
                    parseData={parseData} 
                    uploadedFile={uploadedFile} 
                    setUploadedFile={setUploadedFile}
                    inputFormat={inputFormat} 
                    toggleInputFormat={toggleInputFormat} 
                    taskData={taskData} 
                    setTaskData={setTaskData} 
                    isParseButtonDisabled={isParseButtonDisabled}
                />

                {showPreviewSection && (
                    <PreviewSection 
                        parsedTasks={parsedTasks} 
                        createTasks={createTasks} 
                        downloadJSON={downloadJSON} 
                    />
                )}

                {showProgressSection && (
                    <ProgressSection 
                        progressFillWidth={progressFillWidth} 
                        progressText={progressText} 
                        creationLog={creationLog} 
                    />
                )}
            </div>
        </div>
    );
};

export default JiraBulkCreator;
