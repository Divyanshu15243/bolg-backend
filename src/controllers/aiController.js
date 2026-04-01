exports.generateDescription = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-3-4b-it:free",
        messages: [{
          role: "user",
          content: `Write a compelling blog post excerpt/description for a blog titled "${title}". Keep it between 100-150 words. Make it engaging, informative, and SEO-friendly. Return only the description text, no extra formatting or labels.`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter request failed");
    const description = data.choices?.[0]?.message?.content?.trim();
    if (!description) throw new Error("No response from AI");

    res.json({ description });
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
};
