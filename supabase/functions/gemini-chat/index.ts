import { serve } from "https://deno.land/std/http/server.ts"

serve(async (req) => {
  const { message } = await req.json()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    }
  )

  const data = await res.json()
  return new Response(
    JSON.stringify({ reply: data.candidates[0].content.parts[0].text }),
    { headers: { "Content-Type": "application/json" } }
  )
})
