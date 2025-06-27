import React from 'react';
import FileInput from './FileInput';
import ManualInput from './ManualInput';

const InputSection = (props) => {
    const { 
        currentInputMethod, 
        switchInputMethod, 
        parseData, 
        uploadedFile, 
        setUploadedFile,
        inputFormat, 
        toggleInputFormat, 
        taskData, 
        setTaskData, 
        isParseButtonDisabled
    } = props;

    return (
        <div className="input-section">
            <h2 className="section-title">📋 Task Data</h2>

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

            {currentInputMethod === 'file' ? (
                <FileInput 
                    uploadedFile={uploadedFile} 
                    setUploadedFile={setUploadedFile}
                />
            ) : (
                <ManualInput 
                    inputFormat={inputFormat} 
                    toggleInputFormat={toggleInputFormat} 
                    taskData={taskData} 
                    setTaskData={setTaskData} 
                />
            )}

            <div style={{ marginTop: '20px' }}>
                <button className="btn" onClick={parseData} disabled={isParseButtonDisabled}>
                    📊 Parse & Preview
                </button>
            </div>
        </div>
    );
};

export default InputSection;