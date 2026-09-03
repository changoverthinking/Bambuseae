// Adapter OpenAI-compatible. Backend sẽ quyết định endpoint và model thật.
const adapter = {
  id: "openai-personal",
  protocol: "openai-compatible",
  buildGatewayRequest({ model, messages, project, skills, plugins }) {
    return {
      path: "/api/chat",
      method: "POST",
      body: {
        provider: "openai",
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
