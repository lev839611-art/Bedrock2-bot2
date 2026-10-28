const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем запросы с любых устройств (чтобы APK мог достучаться)
app.use(cors());
app.use(express.json());

// Сюда Render автоматически подставит твой ключ из настроек
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Наш API endpoint
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Пустое сообщение" });
    }

    // Проверка, что ключ вообще есть
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: "Ключ API не настроен на сервере" });
    }

    try {
        // Делаем запрос к Groq от имени сервера
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant", // Быстрая модель
                messages: [
                    { role: "system", content: "Ты полезный и дружелюбный ассистент. Отвечай кратко на русском языке." },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Если Groq вернул ошибку (например, кончился лимит)
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        // Отправляем ответ обратно в приложение
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({ error: "Ошибка сервера при связи с ИИ" });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
