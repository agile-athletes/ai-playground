const resultset = [
  {
    "type": "workflow",
    "label": "SWOT",
    "pitch": "Explains the workings of SWOT to the user",
    "prompt": "Explain why the sky is blue.",
    "model": "qwen2.5:14b",
    "in-topic": "tasks/agent/process",
    "out-topic": "tasks/agent/result"
  },
  {
    "type": "workflow",
    "label": "SOFT",
    "pitch": "validate an issue of the user according to the rules of the SOFT framework",
    "prompt": "Explain the priciples of SWOT.",
    "model": "qwen2.5:14b",
    "in-topic": "tasks/agent/process",
    "out-topic": "tasks/agent/result"
  }
]
return resultset