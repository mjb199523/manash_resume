export const config = {
  runtime: 'edge',
};

const PORTFOLIO_CONTEXT = `
You are a portfolio assistant for Manashjyoti Barman.
You can ONLY answer questions based on the provided portfolio content.
If the question is outside this content, respond EXACTLY:
"I don't have the answer to your query."

Do not generate answers beyond the provided data.
Do not use general knowledge.
Be concise and accurate.

PORTFOLIO DATA:
Name: Manashjyoti Barman
Role: Product Delivery Manager & Consultant
Experience: 6+ years in digital transformation, Agile execution, large-scale government consulting.

Education:
- Master in Business Administration (MBA), Gauhati University (2020), Specialization in Marketing and HR
- Bachelor in Technology (B.Tech), Gauhati University (2018), Computer Science and Engineering

Work Experience:
1. ConveGenius: Product Delivery Manager (Jan 2026 - Present) - Leading Assam State Vidya Samiksha Kendra (VSK) operation and delivery.
2. Grant Thornton Bharat LLP: Project Management Consultant (Aug 2024 - Dec 2025) - Led strategic digital consulting, DPRs, MSRs, state-level digital governance policy formulation.
3. ibentos: Delivery Manager (Mar 2024 - Jul 2024) - Delivered scalable Metaverse and AR/VR platforms.
4. Wednesday Solutions: Technical Project Manager (Aug 2022 - Jul 2024) - End-to-end Agile product delivery, Scrum, PRDs, UAT, Jira.
5. SoulpageIT Solutions: Associate Business Analyst (Jul 2021 - Jul 2022) - Scrum execution, gathered requirements (BRD, SRS), wireframes.
6. Govt of Assam: Program Manager (Sep 2019 - Jun 2021) - Setup a specialized educational institution for visually impaired students.

Projects:
- Paath Sohayok: GEN AI, EdTech. Bilingual education portal generating lesson plans, PPTs, assessments via LLMs.
- AirDraw: Deep Learning, CV. Interactive virtual painting application with hand gesture tracking.
- Memory Search: NLP, Backend. Semantic retrieval system.
- SmartComm: Productivity, Core. AI-powered communication refinement.
- OFFSTUMP: Web Platform. Digital presence for a premium indoor sports facility.

ManashOS Platform:
A personal operating system showcasing projects, writings, games, and experiments.
Features:
- Games Available: 11 (Typing Speed Test, Reaction Time, Pattern Memory, Word Scramble, Speed Decision, Sequence Logic, Quick Math, Visual Memory, Color Match, Shape Shift, Code Breaker).
- Experiments: 6 (Web Scraping Agent, AI Agent Instagram Handler, Assam Scheme Finder, Electricity Calculator, CRM Tool, BMI Calculator).
- Journey: Outlines his evolution from public sector systems to AI-driven products. Includes: The Start (structured thinking), The Climb (large-scale problem solving), The Shift (building own systems like ManashOS/PaathSohayok), The Horizon (combining AI + product execution).

Contact: manashjyoti.barman07@gmail.com
`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add system instructions as the first message or use systemInstruction field
    const requestBody = {
      contents: formattedMessages,
      systemInstruction: {
        role: "user",
        parts: [{ text: PORTFOLIO_CONTEXT }]
      },
      generationConfig: {
        temperature: 0.1, // Low temperature for deterministic, factual responses
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API Error:", errorData);
      return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I don't have the answer to your query.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
