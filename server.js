// server.js
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the HTML page
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
function extractEpicKey(epicLink) {
    if (!epicLink) return null;
    
    if (epicLink.includes('/browse/')) {
        return epicLink.split('/browse/')[1];
    }
    
    return epicLink;
}
// Enhanced API endpoint with Server-Sent Events
app.post('/api/create-tasks-stream', async (req, res) => {
   const { config, tasks } = req.body;
   
   // Set up SSE headers
   res.writeHead(200, {
       'Content-Type': 'text/event-stream',
       'Cache-Control': 'no-cache',
       'Connection': 'keep-alive',
       'Access-Control-Allow-Origin': '*'
   });

   // Get API token from environment variables
   const apiToken = process.env.JIRA_API_TOKEN;
   if (!apiToken) {
       res.write(`data: ${JSON.stringify({
           type: 'error',
           message: 'JIRA_API_TOKEN environment variable is not set. Please set it in your .env file or environment.'
       })}\n\n`);
       res.end();
       return;
   }

   // Validate required config
   if (!config.jiraUrl || !config.email || !config.projectKey) {
       res.write(`data: ${JSON.stringify({
           type: 'error',
           message: 'Missing required Jira configuration (URL, email, project key)'
       })}\n\n`);
       res.end();
       return;
   }

   const results = [];
   let successCount = 0;
   let errorCount = 0;

   const auth = Buffer.from(`${config.email}:${apiToken}`).toString('base64');
   
   const axiosConfig = {
       headers: {
           'Authorization': `Basic ${auth}`,
           'Content-Type': 'application/json',
           'Accept': 'application/json'
       }
   };

   // Find Epic Link field ID
   let epicFieldId = null;
   
   try {
       console.log('Finding Epic Link field ID...');
       const fieldsResponse = await axios.get(
           `${config.jiraUrl}/rest/api/3/field`,
           axiosConfig
       );
       
       // Look for Epic Link field
       const epicField = fieldsResponse.data.find(field => 
           field.name === 'Epic Link' || 
           (field.schema && field.schema.custom === 'com.pyxis.greenhopper.jira:gh-epic-link')
       );
       
       if (epicField) {
           epicFieldId = epicField.id;
           console.log(`✅ Found Epic Link field: ${epicFieldId}`);
       } else {
           console.log('⚠️ Epic Link field not found, will try parent field');
       }
   } catch (error) {
       console.error('Error getting field metadata:', error.message);
   }

   try {
       for (let i = 0; i < tasks.length; i++) {
           const task = tasks[i];
           
           // Send start processing message
           res.write(`data: ${JSON.stringify({
               type: 'processing',
               current: i + 1,
               total: tasks.length,
               taskName: task.taskName
           })}\n\n`);
           
           try {
               // Create base payload
               const jiraPayload = {
                   fields: {
                       project: {
                           key: config.projectKey
                       },
                       summary: task.taskName,
                       issuetype: {
                           name: config.issueType || 'Task'
                       }
                   }
               };

               // Add Epic Link
               if (task.epicLink) {
                const epicKey = extractEpicKey(task.epicLink); 
                
                if (epicFieldId) {
                    jiraPayload.fields[epicFieldId] = epicKey;
                    console.log(`Using Epic Link field ${epicFieldId}: ${epicKey}`);
                } else {
                    jiraPayload.fields.parent = {
                        key: epicKey
                    };
                    console.log(`Using parent field: ${epicKey}`);
                }
            }

               console.log(`Creating task: ${task.taskName}`);
               console.log('Payload:', JSON.stringify(jiraPayload, null, 2));
               
               const response = await axios.post(
                   `${config.jiraUrl}/rest/api/3/issue`,
                   jiraPayload,
                   axiosConfig
               );

               console.log(`✅ Task created: ${response.data.key}`);

               // Try to set estimate AFTER task creation if estimates exist
               if (response.data && task.minEstimate && task.maxEstimate) {
                   const avgEstimate = Math.round((task.minEstimate + task.maxEstimate) / 2);
                   const issueKey = response.data.key;
                   
                   console.log(`Attempting to set ${avgEstimate}h estimate for ${issueKey}`);
                   
                   try {
                       // Method 1: Try using update syntax with timeoriginalestimate
                       const estimatePayload = {
                           update: {
                               timeoriginalestimate: [{ set: avgEstimate * 3600 }] // Convert hours to seconds
                           }
                       };
                       
                       await axios.put(
                           `${config.jiraUrl}/rest/api/3/issue/${issueKey}`,
                           estimatePayload,
                           axiosConfig
                       );
                       
                       console.log(`✅ Set ${avgEstimate}h estimate for ${issueKey} using update method`);
                   } catch (estimateError) {
                       console.log(`⚠️ Update method failed for ${issueKey}, trying fields method...`);
                       
                       try {
                           // Method 2: Try using fields syntax
                           const estimatePayload2 = {
                               fields: {
                                   timeoriginalestimate: avgEstimate * 3600
                               }
                           };
                           
                           await axios.put(
                               `${config.jiraUrl}/rest/api/3/issue/${issueKey}`,
                               estimatePayload2,
                               axiosConfig
                           );
                           
                           console.log(`✅ Set ${avgEstimate}h estimate for ${issueKey} using fields method`);
                       } catch (estimateError2) {
                           console.log(`⚠️ Could not set estimate for ${issueKey}:`, {
                               updateMethod: estimateError.response?.data?.errorMessages || estimateError.message,
                               fieldsMethod: estimateError2.response?.data?.errorMessages || estimateError2.message
                           });
                           // Continue anyway - task was created successfully
                       }
                   }
               }

               successCount++;
               results.push({
                   index: i,
                   taskName: task.taskName,
                   status: 'success',
                   jiraKey: response.data.key
               });

               res.write(`data: ${JSON.stringify({
                   type: 'success',
                   index: i,
                   current: i + 1,
                   total: tasks.length,
                   taskName: task.taskName,
                   jiraKey: response.data.key,
                   jiraUrl: `${config.jiraUrl}/browse/${response.data.key}`
               })}\n\n`);

           } catch (error) {
               errorCount++;
               console.error(`❌ Failed to create task: ${task.taskName}`, {
                   status: error.response?.status,
                   statusText: error.response?.statusText,
                   errorMessages: error.response?.data?.errorMessages,
                   errors: error.response?.data?.errors,
                   message: error.message
               });
               
               const errorMessage = error.response?.data?.errorMessages?.[0] || 
                                  JSON.stringify(error.response?.data?.errors) || 
                                  error.message;
               
               results.push({
                   index: i,
                   taskName: task.taskName,
                   status: 'error',
                   error: errorMessage
               });

               res.write(`data: ${JSON.stringify({
                   type: 'error',
                   index: i,
                   current: i + 1,
                   total: tasks.length,
                   taskName: task.taskName,
                   error: errorMessage
               })}\n\n`);
           }

           // Delay to prevent rate limiting
           if (i < tasks.length - 1) {
               await new Promise(resolve => setTimeout(resolve, 500));
           }
       }

       // Send completion
       res.write(`data: ${JSON.stringify({
           type: 'complete',
           successCount,
           errorCount,
           totalTasks: tasks.length,
           results
       })}\n\n`);

   } catch (error) {
       console.error('Unexpected error:', error);
       res.write(`data: ${JSON.stringify({
           type: 'fatal_error',
           message: 'Unexpected server error',
           details: error.message
       })}\n\n`);
   }

   res.end();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
   res.json({ 
       status: 'ok', 
       timestamp: new Date().toISOString(),
       hasApiToken: !!process.env.JIRA_API_TOKEN,
       nodeEnv: process.env.NODE_ENV || 'development'
   });
});

// API endpoint to test Jira connection
app.post('/api/test-connection', async (req, res) => {
   const { config } = req.body;
   
   const apiToken = process.env.JIRA_API_TOKEN;
   if (!apiToken) {
       return res.status(400).json({
           success: false,
           error: 'JIRA_API_TOKEN environment variable is not set'
       });
   }

   if (!config.jiraUrl || !config.email) {
       return res.status(400).json({
           success: false,
           error: 'Missing Jira URL or email'
       });
   }

   try {
       const auth = Buffer.from(`${config.email}:${apiToken}`).toString('base64');
       
       const response = await axios.get(
           `${config.jiraUrl}/rest/api/3/myself`,
           {
               headers: {
                   'Authorization': `Basic ${auth}`,
                   'Accept': 'application/json'
               }
           }
       );

       res.json({
           success: true,
           user: response.data.displayName,
           email: response.data.emailAddress
       });
   } catch (error) {
       res.status(400).json({
           success: false,
           error: error.response?.data?.errorMessages?.[0] || error.message
       });
   }
});

// Debug endpoint to check Epic Link field
app.get('/api/debug/epic-field/:projectKey', async (req, res) => {
   const { projectKey } = req.params;
   const { jiraUrl, email } = req.query;
   
   const apiToken = process.env.JIRA_API_TOKEN;
   const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
   
   try {
       // Get all fields
       const fieldsResponse = await axios.get(
           `${jiraUrl}/rest/api/3/field`,
           {
               headers: {
                   'Authorization': `Basic ${auth}`,
                   'Accept': 'application/json'
               }
           }
       );
       
       // Find Epic Link field
       const epicField = fieldsResponse.data.find(field => 
           field.name === 'Epic Link' || 
           (field.schema && field.schema.custom === 'com.pyxis.greenhopper.jira:gh-epic-link')
       );
       
       res.json({
           epicField: epicField ? {
               id: epicField.id,
               name: epicField.name,
               schema: epicField.schema
           } : null,
           allEpicFields: fieldsResponse.data.filter(field => 
               field.name.toLowerCase().includes('epic') ||
               (field.schema && field.schema.custom && field.schema.custom.includes('epic'))
           ).map(field => ({
               id: field.id,
               name: field.name,
               schema: field.schema
           }))
       });
       
   } catch (error) {
       res.status(500).json({
           error: error.message,
           details: error.response?.data
       });
   }
});

// Start server
app.listen(PORT, () => {
   console.log(`🚀 Jira Bulk Creator server running on http://localhost:${PORT}`);
   console.log(`📋 Open your browser and go to http://localhost:${PORT}`);
   
   if (!process.env.JIRA_API_TOKEN) {
       console.log('⚠️  WARNING: JIRA_API_TOKEN environment variable is not set!');
       console.log('   Please create a .env file with: JIRA_API_TOKEN=your_token_here');
   } else {
       console.log('✅ JIRA_API_TOKEN is configured');
   }
});

module.exports = app;