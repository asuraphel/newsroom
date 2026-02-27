import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
// import { google } from '@ai-sdk/google';
// import { openai } from '@ai-sdk/openai';



// import { OpenRouter } from '@openrouter/sdk';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
})

export async function POST(req: Request) {
  const data = await req.json();
  const { messages, model }: { messages: UIMessage[]; model: string } = data;
  // return 

  console.log("model", model)

  const result = streamText({
    model: openrouter.chat(model),
    //model: google("gemini-2.5-flash"),
    //model: groq("qwen/qwen3-32b"),
    messages: await convertToModelMessages(messages),
    temperature: 0.2,
    system: `/no_think

      Respond directly and concisely. Do not use step-by-step reasoning or internal monologues.

      You are a sophisticated AI assistant with a consistent professional, 
      minimalist, and slightly technical tone. 
      - Use clear, concise language.
      - Avoid flowery introductions or "As an AI..." filler.
      - Maintain a helpful but objective demeanor.
      - When summarizing news, focus on facts and impact.

      ### NEWS TOOL PROTOCOL
      - **Wait for Input:** Never call 'summarize_article' immediately after a 'news' call. You must stop and wait for the user to explicitly click a TLDR button or ask for a summary.
      - **Strict One-Call Limit:** You are restricted to exactly ONE tool call per user message. No parallel tool calling is permitted.

      1. Use the 'changelog' tool ONLY for technical software, libraries, frameworks, and programming languages (e.g., "Django", "React", "Python", "Tailwind"). These topics have versioned releases, tags, and code repositories on GitHub.

      2. Use the 'news' tool for general current events, sports, politics, entertainment, and non-technical entities (e.g., "Premier League", "Apple", "SpaceX", "Elon Musk").

      Decision Logic:
      - When asked for updates about a software library, framework, or language (e.g., Django, React, Python), you MUST use the "changelog" tool and provide the "topic" argument.
      - When asked about news, sports, or general events (e.g., Premier League, Politics), use the "news" tool.
      - If the user query is "What's new in Django", the topic for the tool is "django".

      Examples:
      - User: "Whats new in Django?" -> Call changelog(topic: "Django")
      - User: "Recent React changes" -> Call changelog(topic: "React")
      - User: "What's new in Premier League?" -> Call news(query: "Premier League")
    `,
    stopWhen: stepCountIs(2),
    tools: {
      weather: tool({
        description: 'Get the weather in a location',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return {
            location,
            temperature: 3275928573854,
          };
        },
      }),

      changelog: tool({
        description: 'Whats new for a specific framework or technology. IMPORTANT: Do NOT call this tool unless the user explicitly names a technology. If they do not specify one, ask them first.',
        inputSchema: z.object({
          topic: z.string().describe('The name of the technology to search for (e.g. "Django", "React").'),
        }),
        execute: async ({ topic }) => {
          console.log(`Received changelog tool call with topic: "${topic}"`);
          const key = topic.toLowerCase().trim();
          const data = CHANGELOG_DATA[key];

          console.log(data)

          if (!data) {
            return {
              error: `No records found for "${topic}".`,
              hint: `Try searching for: ${Object.keys(CHANGELOG_DATA).join(', ')}`
            };
          }

          return {
            technology: topic,
            releases: data
          };
        },
      }),
      news: tool({
        description: 'Search news articles from the past month using NewsAPI.org.',
        inputSchema: z.object({
          query: z.string().describe('The topic to search for'),
          timeframe: z.enum(['day', 'week', 'month', 'latest']).optional().default('latest'),
        }),
        execute: async ({ query, timeframe }) => {
          const apiKey = process.env.NEWS_API_KEY;
          // Using 'everything' endpoint to allow for date filtering
          let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=5&apiKey=${apiKey}`;

          const date = new Date();
          if (timeframe === 'day') date.setDate(date.getDate() - 1);
          else if (timeframe === 'week') date.setDate(date.getDate() - 7);
          else if (timeframe === 'month') date.setDate(date.getDate() - 30);
          else date.setDate(date.getDate() - 2); // 'latest' on free plan has ~24h delay

          const fromDate = date.toISOString().split('T')[0];
          url += `&from=${fromDate}&sortBy=publishedAt`;

          console.log(`Fetching news for query "${query}" with timeframe "${timeframe}" (last ${date.toDateString()})`);

          try {
            const response = await fetch(url, {});
            const data = await response.json();

            if (data.status === "error") {
              console.error("NewsAPI Error:", data.message);
              return [];
            }

            return data.articles.map((article: any) => ({
              title: article.title,
              link: article.url,
              description: article.description,
              source: article.source.name,
              image: article.urlToImage,
              date: article.publishedAt,
            }));
          } catch (error) {
            console.error("News Tool Failed:", error);
            return { error: "Failed to fetch news. Check server logs." };
          }
        },
      }),
      summarize_article: tool({
        description: 'Generate a TLDR summary of a news article by fetching and analyzing its content',
        inputSchema: z.object({
          articleUrl: z.string().describe('The URL of the article to summarize'),
          articleTitle: z.string().describe('The title of the article'),
        }),
        execute: async ({ articleUrl, articleTitle }) => {
          try {
            const response = await fetch(`https://r.jina.ai/${articleUrl}`, {});

            if (!response.ok) return {
              title: articleTitle,
              url: articleUrl,
              content: null,
              error: 'Could not fetch article content for summarization'
            };

            const articleText = await response.text();

            console.log(`Fetched article content for summarization: ${articleText.slice(0, 200)}...`);

            return {
              title: articleTitle,
              url: articleUrl,
              content: articleText.slice(0, 8000), // Limit tokens
              summary: null
            };
          } catch (error) {
            console.log(error)
            return {
              title: articleTitle,
              url: articleUrl,
              content: null,
              error: 'Could not fetch article content for summarization'
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

const CHANGELOG_DATA: Record<string, any[]> = {
  "react": [
    {
      "version": "19.0.0",
      "date": "2024-12-05",
      "changes": ["Introduced Actions for form handling", "New 'use' API for resources", "Stable Server Components support", "Document Metadata support"]
    },
    {
      "version": "18.3.0",
      "date": "2024-04-25",
      "changes": ["Added console warnings for deprecated APIs to prepare for React 19"]
    }
  ],
  "django": [
    {
      "version": "5.1",
      "date": "2024-08-07",
      "changes": ["Added LoginRequiredMiddleware", "New PostgreSQL-specific fields", "Improved template performance"]
    },
    {
      "version": "5.0",
      "date": "2023-12-04",
      "changes": ["Database-computed default values", "GeneratedModelField support", "Simplified template fragment caching"]
    }
  ],
  "next.js": [
    {
      "version": "15.0.0",
      "date": "2024-10-21",
      "changes": ["Caching is now 'uncached' by default", "New Async Request APIs", "Support for React 19", "Enhanced @next/codemod"]
    },
    {
      "version": "14.2.0",
      "date": "2024-04-11",
      "changes": ["Turbopack for development is now feature-complete", "Build memory usage optimizations"]
    }
  ],
  "tailwind": [
    {
      "version": "4.0-alpha",
      "date": "2024-03-01",
      "changes": ["New high-performance Rust engine (Oxide)", "CSS-variable based configuration", "Zero-runtime overhead"]
    },
    {
      "version": "3.4.0",
      "date": "2023-12-19",
      "changes": ["New 'has-*' variants", "Balanced text wrapping support", "Extended grid-stacking utilities"]
    }
  ]
};
