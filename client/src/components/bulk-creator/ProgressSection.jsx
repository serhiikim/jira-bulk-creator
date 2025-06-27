import React from 'react';

const ProgressSection = ({ progressFillWidth, progressText, creationLog }) => {
    return (
        <div className={`preview-section active`} id="progressSection">
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
    );
};

export default ProgressSection;
