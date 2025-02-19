
export function parseJsonStringWithOpenAiTics(str) {
    // Remove the leading ```json and trailing ``` markers
    const cleaned = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
}

export function testDataAsJson() {
    return parseJsonStringWithOpenAiTics(input);
}

// Example usage:
const input = `\`\`\`json
{
  "attentions": [
    {
      "id": 1,
      "name": "Accuracy of USER_TEXT",
      "value": "0.0", 
      "weight": "0.5",
      "parent_id": null
    },
    {
      "id": 2,
      "name": "Title",
      "value": "Gap in Identifying Planning Issues",
      "weight": "0.7",
      "parent_id": 1
    },
    {
      "id": 3,
      "name": "SOFT Question",
      "value": "What must be done to safeguard the satisfactory in present operations?",
      "weight": "0.6",
      "parent_id": 2
    },
    {
      "id": 4,
      "name": "Description",
      "value": "The submitted text lacks a clear identification and documentation of planning issues faced in the unit, which is essential for recognizing satisfactory operations.",
      "weight": "0.8",
      "parent_id": 3
    },
    {
      "id": 5,
      "name": "Reference sources or facts",
      "value": "Lack of documented examples or data to support identified gaps in operations.",
      "weight": "0.6",
      "parent_id": 3
    },
    {
      "id": 6,
      "name": "Possible actions and resource requirements",
      "value": "Managers should gather and compile a list of planning issues collaboratively and classify them into satisfactory, opportunities, faults, and threats.",
      "weight": "0.7",
      "parent_id": 3
    },
    {
      "id": 7,
      "name": "SOFT Question",
      "value": "What must be done to open the door to opportunities in future operations?",
      "weight": "0.5",
      "parent_id": 2
    },
    {
      "id": 8,
      "name": "SOFT Question",
      "value": "What must be done to fix the cause of faults in present operations?",
      "weight": "0.5",
      "parent_id": 2
    },
    {
      "id": 9,
      "name": "SOFT Question",
      "value": "What must be done to thwart, ameliorate or avert the threats to future operations?",
      "weight": "0.5",
      "parent_id": 2
    }
  ]
}
\`\`\``;