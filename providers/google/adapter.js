// Adapter Google Gemini. Key và quota thật phải nằm ở backend.
const adapter = {
  id: "gemini-personal",
  protocol: "gemini",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: {
        provider: "google",
        model: model.id,
        messages,
        project,
        skills,
        plugins
      }
    };
  }
};

export default adapter;
