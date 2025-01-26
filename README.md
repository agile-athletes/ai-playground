# ai-playground
A shared ai-playground starting with the making of a RAG-SWOT-Analysis prototype.

## RAG-SWOT-Analysis
Based on [The origins of SWOT analysis](https://www.sciencedirect.com/science/article/pii/S0024630123000110), it's fascinating to see how long-range planning with SWOT likely originated from the Long Range Planning Service (Stanford Research Institute) known as SOFT. Our team of open source developers is dedicated to modernizing this approach by integrating cutting-edge Agentic RAG technology. Exciting times ahead in 2025 as we merge traditional strategies with AI advancements.

After its installation it will show the data collection of so called ``issues``. We invite you to try it out on our [playground installation](https://ai-playground.agile-athletes.de/).

### Weakness of SWOT / SOFT
Our analysis and testing of the prompts revealed, as what we see it now, a weakness in the methodology of SWOT and SOFT.
In the data collection phase, the data suffer from opinion.

The article notes: ``Before determining their purpose, firms had to first identify and then discuss their so-called planning issues.``

Being in the IT business for decades, we thought it would be good to bring the first step of the analysis into a data collection dialogue.
In the nature of SWOT and SOFT, the data collected is categorised in the same way. SWOT is nothing more than a re-labelling of the
of the "four questions":

````
the four (SOFT) questions.
1. What must be done to safeguard the satisfactory in present operations?
2. What must be done to open the door to opportunities in future operations?
3. What must be done to fix the cause of faults of present operations?
4. What must be done to thwart, ameliorate or avert the threats to future operations?’ (Stewart et al., 1965a, p. 18).
````

The LLM simply answered all four questions. We had to do some extra prompt engineering to
the LLM to pick out the opinionated intention of the author of the question.

````
Example of an issue defined by a manager: New artificial intelligence technology is challenging our core business of on-demand translation.
 
The LLM rephrases:
1. Safeguarding Present Operations:
To ensure our current on-demand translation services remain effective, we must integrate new artificial intelligence technologies carefully, maintaining the quality and reliability our clients expect.

2. Opening Opportunities for Future Operations:
To capitalize on emerging opportunities, we should leverage advanced AI technologies to enhance and expand our translation services, potentially entering new markets and offering innovative solutions.

3. Fixing Causes of Faults in Present Operations:
To address the challenges posed by AI to our existing translation business, we need to identify and rectify specific areas where our operations are being disrupted, such as improving workflow efficiency or enhancing human-AI collaboration.

4. Averting Threats to Future Operations:
To protect our future business interests, we must proactively adapt to AI advancements by developing proprietary technologies, investing in research and development, and staying ahead of industry trends to mitigate potential threats.
````
As you can see, there are four ways of looking at a problem. Each of these can lead the observer in a different direction if the 
context of the problem area is not taken into account. Starting with the questions invites the opinion of an employee of a company or organisation.

We have addressed this issue by instructing the LLM to stick to the manager's description when one of the four questions is clearly selected. 
If not, it starts making suggestions based on all four. The purpose of the dialogue is to inspire the manager and standardise the data collection phase, 
as Stewart intended.

The author of SOFT: ``Stewart also noted that something might seem very risky to one manager because he does not know how to solve a particular planning issue, while to another there is little risk because his experience and knowledge make him feel the problem can be solved.``

In terms of data collection, this can be a false start. Or at least the subsequent analysis must be aware of this.

## Requirements

- Python 3.13
- [uv](https://github.com/astral-sh/uv) package manager

## Getting Started

- Create virtual env `uv venv`
- Activate virtual env `source .venv/bin/activate`
- Install dependencies `uv sync`

## Adding dependencies

- `uv add gradio`
