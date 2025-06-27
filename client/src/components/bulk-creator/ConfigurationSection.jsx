import React from 'react';

const ConfigurationSection = ({ jiraUrl, setJiraUrl, email, setEmail, projectKey, setProjectKey, issueType, setIssueType }) => {
    return (
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
    );
};

export default ConfigurationSection;
