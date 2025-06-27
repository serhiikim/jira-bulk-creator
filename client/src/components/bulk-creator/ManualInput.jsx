import React from 'react';

const ManualInput = ({ inputFormat, toggleInputFormat, taskData, setTaskData }) => {
    return (
        <div className={`input-method-content active`} id="manualInputMethod">
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
                <pre>{`Task Name,Epic Link,Min Estimate,Max Estimate
"Setup Laravel Project","PROJ-100",2,4
"Create User Model","PROJ-100",1,3
"Documentation Task","PROJ-101",,`}</pre>
                <p><small>Note: Min/Max estimates are optional. Leave empty if not needed.</small></p>
            </div>

            <div className={`example ${inputFormat === 'json' ? '' : 'hidden'}`} id="jsonExample">
                <h4>JSON Format Example:</h4>
                <pre>{`[
  {
    "taskName": "Setup Laravel Project",
    "epicLink": "PROJ-100"
  },
  {
    "taskName": "Documentation Task",
    "epicLink": "PROJ-100"
  }
]`}</pre>
            </div>
        </div>
    );
};

export default ManualInput;
