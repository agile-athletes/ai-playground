const workflow = $('MQTT Trigger').first().json
const decodedWorkflow = JSON.parse(workflow.message);

function atobNode(base64) {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

if (decodedWorkflow.prompt) {
  try {
    const decoded = atobNode(decodedWorkflow.prompt);
    decodedWorkflow.prompt = decoded;
  } catch (error) {
    console.log(`Fehler beim Dekodieren des Prompts für Workflow "${workflow.label || i}":`, error);
  }
} else {
  console.log(`Workflow "${workflow.label || i}" enthält keinen Prompt zum Dekodieren`);
}

return [ decodedWorkflow ]
