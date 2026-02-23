**PRD: Newsroom**
*Author: Alexander Suraphel | Date: Feb 23, 2026 | Status: Draft*

**What I'm Building**

Newsroom is an interactive news breifing chatbot that lets users ask about current events, explore topics they are interested in and get article summaries. 

To choose the most apt model for this goal, I'll build evaluation framework that compares different LLMs on different criteria (listed in "Eval Dimensions" below). 

**Tools (Function Calls)**
- get_top_headlines(category, country?) ->  NewsAPI
- search_news(query, from_date?) ->  NewsAPI
- get_news_sources(category?) ->  NewsAPI
- summarize_article(url) -> Tool to fetch the page in markdown then Summarize
- Potentially more 

May switch to another API if newsapi.org reaches limits, has throttling etc..

**Models to Compare**
- Model 1: Gemini 3.1 Pro. For deepthink to reason through complex topics. Also high context tool calling allows me to process large volume of news in one context. 
- Model 2: GPT 5.2. Great summarizer. Possibly best in class for tool calling. Interesting to evaluate tool call simulation performance. 
- Model 3: deepseek-r1-distill-llama-70b. Great thinking for free via Groq
- Potentially more

**Stack**
- Next.js with App Router
- Vercel AI SDK (streaming, tool calling and useChat hook)
- Tailwind CSS for styling 

**Eval Dimensions**
- Response latency
- Tool call accuracy 
- Guardrail handling 
- Response quality 
- Hallucination detection 

**In Scope**
- Chat interface with streaming
- Tool calls indicators in the chat interface (e.g. "Fetching News...")
- Thinking indicator in the UI
- Model switcher
- Eval tool 
- Eval dashboard

**Out of Scope**
- Auth, persistent history, memory

**Timeline**
- Day 1 (tomorrow): Project boostrapped and core chat working. Draft PR shared
- Day 2: Iterate on the chat and work on eval framework
- Day 3: Polish the chat UI, Finalize eval framework. Presentation recording and prep
