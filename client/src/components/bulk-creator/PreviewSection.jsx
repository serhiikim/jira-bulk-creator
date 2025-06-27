import React from 'react';

const PreviewSection = ({ parsedTasks, createTasks, downloadJSON }) => {
    return (
        <div className={`preview-section active`} id="previewSection">
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
    );
};

export default PreviewSection;
